import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { advertisementsApi, AdvertisementDto } from '../lib/api';
import { Phone, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '../lib/format';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5558';

function toUrl(path?: string) {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) return s;
  if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
  if (s.startsWith('uploads')) return `${API_BASE_URL}/${s}`;
  return `${API_BASE_URL}/uploads/${s}`;
}

function resolveAdvertisementImage(ad: AdvertisementDto) {
  if (!ad) return null;
  if (ad.images && Array.isArray(ad.images) && ad.images.length > 0) {
    const first = ad.images[0];
    if (typeof first === 'string') {
      if (first.startsWith('data:image/')) return first;
      return toUrl(first) || null;
    }
    if (first && typeof first === 'object') {
      const imgObj = first as { path?: string; media_url?: string; url?: string; filename?: string };
      if (imgObj.path) return toUrl(imgObj.path) || null;
      if (imgObj.media_url) return toUrl(imgObj.media_url) || null;
      if (imgObj.url) return toUrl(imgObj.url) || null;
      if (imgObj.filename) return toUrl(`/uploads/advertisements/images/${imgObj.filename}`) || null;
    }
  }
  return null;
}

export default function AdvertisementBanner({ limit = 10 }: { limit?: number }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [ads, setAds] = useState<AdvertisementDto[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await advertisementsApi.list({ page: 1, limit, isActive: true });
        if (!mounted) return;
        setAds(res?.advertisements || []);
      } catch (err) {
        console.error('AdvertisementBanner: failed to load ads', err);
        setAds([]);
      }
    })();
    return () => { mounted = false; };
  }, [limit]);

  // auto rotate
  useEffect(() => {
    if (ads.length <= 1) return;
    const id = setInterval(() => setCurrent((c) => (c + 1) % ads.length), 5000);
    return () => clearInterval(id);
  }, [ads.length]);

  if (!ads || ads.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 md:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-[90rem] mx-auto">
        <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="relative h-56 sm:h-64 md:h-80 lg:h-96 xl:h-[450px] overflow-hidden">
            {ads.map((ad, idx) => {
              const imageUrl = resolveAdvertisementImage(ad);
              const isActive = idx === current;
              return (
                <div
                  key={String(ad.id)}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${isActive ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'}`}>
                  <div className="relative h-full w-full">
                    {imageUrl ? (
                      <img src={imageUrl} alt={ad.title} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800'; }} />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-light-blue-500 via-dark-blue-500 to-purple-600"></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white px-4 sm:px-6 md:px-8 lg:px-12 max-w-5xl w-full font-sans">
                        <div className="mb-4 sm:mb-6">
                          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold mb-2 sm:mb-4 drop-shadow-2xl leading-tight text-white font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>{ad.title}</h2>
                          {ad.description && <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 line-clamp-2 drop-shadow-lg max-w-3xl mx-auto text-white font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>{ad.description}</p>}
                        </div>

                        {ad.price && <div className="mb-4 sm:mb-6"><p className="text-lg sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold drop-shadow-lg text-white font-sans" style={{ fontFamily: "'Poppins', sans-serif" }}>Tsh {formatPrice(ad.price)}</p></div>}

                        <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-6 md:mt-8">
                          {ad.phoneNumber && (
                            <a href={`tel:${String(ad.phoneNumber || '').replace(/\s+/g, '')}`} className="inline-flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-4 rounded-lg sm:rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold text-xs sm:text-sm md:text-base lg:text-lg shadow-2xl hover:shadow-green-500/50 hover:scale-105 transform duration-200 font-sans whitespace-nowrap" style={{ fontFamily: "'Poppins', sans-serif" }}>
                              <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                              <span>{t('nav.callNow')}</span>
                            </a>
                          )}
                          <button onClick={() => navigate('/advertisements')} className="inline-flex items-center space-x-1 sm:space-x-1.5 md:space-x-2 bg-white text-dark-blue-500 px-3 py-2 sm:px-4 sm:py-2.5 md:px-6 md:py-3 lg:px-8 lg:py-4 rounded-lg sm:rounded-xl hover:bg-light-blue-50 transition-all font-semibold text-xs sm:text-sm md:text-base lg:text-lg shadow-2xl hover:scale-105 transform duration-200 font-sans whitespace-nowrap" style={{ fontFamily: "'Poppins', sans-serif" }}>
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" />
                            <span>{t('nav.viewAll')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {ads.length > 1 && (
              <>
                <button onClick={() => setCurrent((c) => (c - 1 + ads.length) % ads.length)} className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-dark-blue-500 p-3 md:p-4 rounded-full shadow-2xl transition-all z-20 hover:scale-110 backdrop-blur-sm" aria-label="Previous slide"><ChevronLeft className="w-6 h-6 md:w-8 md:h-8" /></button>
                <button onClick={() => setCurrent((c) => (c + 1) % ads.length)} className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-dark-blue-500 p-3 md:p-4 rounded-full shadow-2xl transition-all z-20 hover:scale-110 backdrop-blur-sm" aria-label="Next slide"><ChevronRight className="w-6 h-6 md:w-8 md:h-8" /></button>
              </>
            )}

            {ads.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
                {ads.map((_, index) => (
                  <button key={index} onClick={() => setCurrent(index)} className={`transition-all duration-300 rounded-full ${index === current ? 'bg-white w-12 h-3 shadow-lg' : 'bg-white/50 w-3 h-3 hover:bg-white/75 hover:w-8'}`} aria-label={`Go to slide ${index + 1}`} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { advertisementsApi, AdvertisementDto } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Eye, Calendar, Phone, DollarSign, Megaphone, MapPin } from 'lucide-react';
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
  console.log('[resolveAdvertisementImage] Processing ad:', {
    id: ad.id,
    title: ad.title,
    images: ad.images,
    imagesType: typeof ad.images,
    imagesIsArray: Array.isArray(ad.images)
  });

  // Handle base64 data URLs (data:image/...)
  if (ad.images && Array.isArray(ad.images) && ad.images.length > 0) {
    const first = ad.images[0];
    
    // If it's a base64 data URL, return it directly
    if (typeof first === 'string' && first.startsWith('data:image/')) {
      console.log('[resolveAdvertisementImage] Found base64 image:', first.substring(0, 50) + '...');
      return first;
    }
    
    // If it's a regular string URL
    if (typeof first === 'string') {
      const url = toUrl(first);
      console.log('[resolveAdvertisementImage] String image resolved to:', url);
      return url || null;
    }
    
    // If it's an object with image properties
    if (first && typeof first === 'object') {
      const imgObj = first as { path?: string; media_url?: string; url?: string; filename?: string };
      
      // Try different properties
      if (imgObj.path) {
        const url = toUrl(imgObj.path);
        console.log('[resolveAdvertisementImage] Object path resolved to:', url);
        return url || null;
      }
      if (imgObj.media_url) {
        const url = toUrl(imgObj.media_url);
        console.log('[resolveAdvertisementImage] Object media_url resolved to:', url);
        return url || null;
      }
      if (imgObj.url) {
        const url = toUrl(imgObj.url);
        console.log('[resolveAdvertisementImage] Object url resolved to:', url);
        return url || null;
      }
      if (imgObj.filename) {
        const url = toUrl(`/uploads/advertisements/images/${imgObj.filename}`);
        console.log('[resolveAdvertisementImage] Object filename resolved to:', url);
        return url || null;
      }
    }
  }
  
  console.log('[resolveAdvertisementImage] No image found for ad:', ad.id);
  return null;
}

export default function Advertisements() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [advertisements, setAdvertisements] = useState<AdvertisementDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    loadAdvertisements();
  }, [page, filterActive]);

  const loadAdvertisements = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filterActive !== undefined) params.isActive = filterActive;
      const res = await advertisementsApi.list(params);
      
      // Console log to debug the response
      console.log('[Advertisements] API Response:', res);
      console.log('[Advertisements] Advertisements array:', res.advertisements);
      
      if (res.advertisements && res.advertisements.length > 0) {
        res.advertisements.forEach((ad: AdvertisementDto, index: number) => {
          console.log(`[Advertisements] Ad ${index + 1}:`, {
            id: ad.id,
            title: ad.title,
            images: ad.images,
            imagesType: typeof ad.images,
            imagesIsArray: Array.isArray(ad.images),
            imagesLength: Array.isArray(ad.images) ? ad.images.length : 0,
            firstImage: Array.isArray(ad.images) && ad.images.length > 0 ? ad.images[0] : null,
            firstImageType: Array.isArray(ad.images) && ad.images.length > 0 ? typeof ad.images[0] : null,
            fullAd: ad
          });
        });
      }
      
      setAdvertisements(res.advertisements || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load advertisements', err);
      setAdvertisements([]);
    } finally {
      setLoading(false);
    }
  };




  const handleDelete = async (id: string | number) => {
    if (!confirm(t('advertisements.confirmDelete'))) return;
    try {
      await advertisementsApi.remove(id);
      loadAdvertisements();
    } catch (err: any) {
      alert(err?.message || t('advertisements.deleteError'));
    }
  };


  const canCreate = () => {
    if (!user) return false;
    const role = String((user as any).role || '').toLowerCase();
    return role === 'admin';
  };

  const canEditDelete = (ad: AdvertisementDto) => {
    if (!user) return false;
    const role = String((user as any).role || '').toLowerCase();
    return role === 'admin';
  };

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-light-blue-500 to-dark-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Megaphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{t('advertisements.title')}</h1>
                  <p className="text-gray-600 mt-1">{t('advertisements.subtitle')}</p>
                </div>
              </div>
            </div>
            {canCreate() && (
              <button
                onClick={() => navigate('/admin/advertisements/new')}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-light-blue-500 text-white px-6 py-3.5 rounded-xl hover:from-purple-600 hover:via-pink-600 hover:to-light-blue-600 transition-all shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 flex items-center space-x-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>{t('advertisements.createButton')}</span>
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center space-x-3 bg-white rounded-xl p-2 shadow-md border border-gray-100 inline-flex">
            <button
              onClick={() => setFilterActive(undefined)}
              className={`px-5 py-2.5 rounded-lg transition-all font-medium text-sm ${
                filterActive === undefined
                  ? 'bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('advertisements.all')}
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`px-5 py-2.5 rounded-lg transition-all font-medium text-sm ${
                filterActive === true
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('advertisements.active')}
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`px-5 py-2.5 rounded-lg transition-all font-medium text-sm ${
                filterActive === false
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('advertisements.inactive')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-light-blue-500 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg">{t('advertisements.loading')}</p>
          </div>
        ) : advertisements.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {advertisements.map((ad) => {
                const imageUrl = resolveAdvertisementImage(ad);
                const placeholder = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                
                console.log('[Advertisements] Rendering ad card:', {
                  id: ad.id,
                  title: ad.title,
                  resolvedImageUrl: imageUrl,
                  imageUrlType: typeof imageUrl,
                  imageUrlStartsWith: imageUrl ? imageUrl.substring(0, 50) : null
                });
                
                // Get location from property if linked
                const location = ad.property 
                  ? `${ad.property.city || ''}${ad.property.city && ad.property.state ? ', ' : ''}${ad.property.state || ''}`.trim()
                  : '';
                
                return (
                  <div
                    key={ad.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group cursor-pointer"
                  >
                    <div className="relative overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={ad.title}
                          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            console.error('[Advertisements] Image load error for ad:', ad.id, 'URL:', imageUrl);
                            if ((e.currentTarget as HTMLImageElement).src !== placeholder) {
                              (e.currentTarget as HTMLImageElement).src = placeholder;
                            }
                          }}
                          onLoad={() => {
                            console.log('[Advertisements] Image loaded successfully for ad:', ad.id, 'URL:', imageUrl);
                          }}
                        />
                      ) : (
                        <div className="w-full h-56 bg-gradient-to-br from-light-blue-100 to-dark-blue-100 flex items-center justify-center">
                          <Megaphone className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      {ad.isActive && (
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                          {t('advertisements.active')}
                        </div>
                      )}
                      <div className="absolute top-4 right-4 flex items-center space-x-2">
                        {ad.price && (
                          <div className="bg-white text-dark-blue-500 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                            Tsh {formatPrice(ad.price)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{ad.title}</h3>
                      {location && (
                        <div className="flex items-center text-gray-600 mb-4">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">{location}</span>
                        </div>
                      )}
                      {ad.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{ad.description}</p>
                      )}
                      <div className="flex items-center justify-between text-gray-600 border-t border-gray-100 pt-4">
                        {ad.phoneNumber && (
                          <a
                            href={`tel:${ad.phoneNumber.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center hover:text-light-blue-500 transition-colors"
                            title="Call now"
                          >
                            <Phone className="w-4 h-4 mr-1 text-light-blue-500" />
                            <span className="text-sm font-medium">{t('advertisements.call')}</span>
                          </a>
                        )}
                        {ad.startDate && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-light-blue-500" />
                            <span className="text-sm font-medium">
                              {new Date(ad.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              {ad.endDate ? ` - ${new Date(ad.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      {user && canEditDelete(ad) && (
                        <div className="flex space-x-2 pt-4 border-t border-gray-100 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/advertisements/${ad.id}/edit`);
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-light-blue-500 text-white rounded-lg hover:bg-light-blue-600 transition font-medium text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            <span>{t('advertisements.edit')}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(ad.id);
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{t('advertisements.delete')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {Math.ceil(total / limit) > 1 && (
              <div className="flex items-center justify-center space-x-3 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-6 py-2.5 rounded-lg bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-light-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-gray-700"
                >
                  {t('dashboard.prev')}
                </button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, Math.ceil(total / limit)) }).map((_, idx) => {
                    const pageNum = page <= 3 ? idx + 1 : page - 2 + idx;
                    if (pageNum > Math.ceil(total / limit)) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white shadow-lg'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <span className="text-gray-600 font-medium">
                  {t('dashboard.page', { current: page, total: Math.ceil(total / limit) })}
                </span>
                <button
                  onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-6 py-2.5 rounded-lg bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-light-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-gray-700"
                >
                  {t('dashboard.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-24 h-24 bg-gradient-to-br from-light-blue-100 to-dark-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('advertisements.notFound')}</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('advertisements.notFoundDesc')}</p>
            {canCreate() && (
              <button
                onClick={() => navigate('/admin/advertisements/new')}
                className="bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-8 py-3 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition shadow-lg shadow-light-blue-500/30 flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>{t('advertisements.createFirst')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


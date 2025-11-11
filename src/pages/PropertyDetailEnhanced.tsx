import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertiesApi, PropertyDto, reviewsApi, ReviewDto, favoritesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, BedDouble, Bath, Square, ArrowLeft, Calendar, Home, Star, Heart } from 'lucide-react';
import { formatPrice } from '../lib/format';
import { useTranslation } from 'react-i18next';

export default function PropertyDetailEnhanced() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [property, setProperty] = useState<PropertyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingStart, setBookingStart] = useState('');
  const [bookingEnd, setBookingEnd] = useState('');
  const [bookingDurationType, setBookingDurationType] = useState<'days' | 'weeks' | 'months'>('days');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | number | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    const res = await propertiesApi.getById(id!);
    if (res?.property) setProperty(res.property);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await reviewsApi.list(id);
        setReviews(res.reviews || []);
        const count = (res.reviews || []).length;
        const avg = count > 0 ? (res.reviews!.reduce((s, r) => s + (r.rating || 0), 0) / count) : 0;
        setAvgRating(Number(avg.toFixed(2)));
        setReviewsCount(count);
      } catch {}
    })();
  }, [id]);

  useEffect(() => {
    loadFavoriteStatus();
  }, [id, user]);

  const loadFavoriteStatus = async () => {
    if (!user || !id) return;
    const userRole = String((user as any).role || '').toLowerCase();
    if (userRole !== 'users') return;

    try {
      const res = await favoritesApi.list();
      const favorite = (res.favorites || []).find((f: any) => 
        (f.property?.id || f.propertyId) === id
      );
      if (favorite) {
        setIsFavorited(true);
        setFavoriteId(favorite.id);
      } else {
        setIsFavorited(false);
        setFavoriteId(null);
      }
    } catch (e) {
      console.error('Failed to load favorite status', e);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const userRole = String((user as any).role || '').toLowerCase();
    if (userRole !== 'users') return;

    if (!id) return;

    setFavoriteLoading(true);
    try {
      if (isFavorited && favoriteId) {
        await favoritesApi.remove(favoriteId);
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        const res = await favoritesApi.create({ propertyId: id });
        setIsFavorited(true);
        setFavoriteId((res as any).favorite?.id || null);
      }
    } catch (e: any) {
      console.error('Failed to toggle favorite', e);
      alert(e?.message || 'Failed to update favorite');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setReviewError('');
    setReviewLoading(true);
    try {
      await reviewsApi.create(id, { rating, comment });
      setComment('');
      setRating(5);
      const res = await reviewsApi.list(id);
      setReviews(res.reviews || []);
    } catch (e: any) {
      setReviewError(e?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
  <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('property.loading')}</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
  <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('property.notFound')}</h2>
          <button
            onClick={() => navigate('/properties')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
          >
            {t('property.backToProperties')}
          </button>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen pt-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
            <button
            onClick={() => navigate('/properties')}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('property.backToProperties')}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative h-96">
            {(() => {
              const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:5558';
              const toUrl = (path: string) => path?.startsWith('http') ? path : `${base}/${path?.startsWith('uploads') ? path : `uploads/${path}`}`;
              const images: string[] = [];
              if (property?.image_url) images.push(property.image_url);
              const imagesArr: any[] = ((property as any)?.images || []) as any[];
              imagesArr.forEach((it: any) => {
                if (typeof it === 'string') images.push(toUrl(it));
                else if (it?.path) images.push(toUrl(it.path));
              });
              const mediaArr: any[] = ((property as any)?.media || []) as any[];
              mediaArr.forEach((m: any) => {
                if (!m) return;
                if (!m.media_type || m.media_type === 'image') images.push(toUrl(m.media_url || m.path));
              });
              const current = images[galleryIndex] || images[0] || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200';
              return (
                <>
                  <img src={current} alt={property.title} className="w-full h-full object-cover" />
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((prev) => (prev - 1 + images.length) % images.length); }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center"
                        aria-label="Previous image"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setGalleryIndex((prev) => (prev + 1) % images.length); }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center"
                        aria-label="Next image"
                      >
                        ›
                      </button>
                      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
                        {images.slice(0, 8).map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setGalleryIndex(idx); }}
                            className={`w-3 h-3 rounded-full ${idx === galleryIndex ? 'bg-white' : 'bg-white/60'}`}
                            aria-label={`Go to image ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              );
            })()}
            {property.featured && (
              <div className="absolute top-6 left-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                {t('property.featured')}
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-4xl font-bold text-gray-900">{property.title}</h1>
                    </div>
                    {property.category && (
                      <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-3">
                        {property.category.name}
                      </div>
                    )}
                    {user && String((user as any).role || '').toLowerCase() === 'users' && (
                      <button
                        onClick={toggleFavorite}
                        disabled={favoriteLoading}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50 shadow-sm hover:shadow-md"
                        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart 
                          className={`w-5 h-5 transition-all ${
                            isFavorited 
                              ? 'text-red-600 fill-red-600' 
                              : 'text-gray-400'
                          }`}
                        />
                        <span className={`text-sm font-semibold ${
                          isFavorited ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {isFavorited ? 'Remove from Favorites' : 'Add to Favorites'}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">Tsh {formatPrice(property.price)}</div>
                    {property.price_per && property.price_per !== 'one_time' && (
                      <div className="text-sm text-gray-600">{t('property.per')} {property.price_per}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-gray-600 mb-6">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-lg">{property.location}, {property.city}, {property.state}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <BedDouble className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                    <p className="text-sm text-gray-600">{t('property.bedrooms')}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Bath className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                    <p className="text-sm text-gray-600">{t('property.bathrooms')}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Square className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.area}</p>
                    <p className="text-sm text-gray-600">{t('property.sqft')}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Home className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.property_type}</p>
                    <p className="text-sm text-gray-600">{t('property.type')}</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('property.description')}</h2>
                  <div className="mb-8">
                    <p className="text-gray-600 leading-relaxed">
                      {property.description || t('property.defaultDescription')}
                    </p>
                  </div>
                </div>

                {/* Enhanced Map Section */}
                {(property.latitude != null && property.longitude != null) && (
                  <div className="border-t border-gray-200 pt-8 mt-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">Location</h2>
                        <p className="text-gray-600 text-sm">Exact property location on map</p>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                      <div className="relative h-[500px] w-full">
                        <iframe
                          title="Property Location Map"
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          allowFullScreen
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&hl=en&z=15&output=embed`}
                        />
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-gray-200">
                          <div className="flex items-center space-x-2">
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">Coordinates</p>
                              <p className="text-sm font-bold text-gray-900">
                                {Number(property.latitude).toFixed(6)}, {Number(property.longitude).toFixed(6)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <a
                          href={`https://www.google.com/maps?q=${property.latitude},${property.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute bottom-4 left-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-xl shadow-blue-500/30 font-semibold flex items-center space-x-2 hover:scale-105 transform"
                        >
                          <MapPin className="w-5 h-5" />
                          <span>Open in Google Maps</span>
                        </a>
                      </div>
                    </div>
                  </div>
                )}

              {(() => {
                const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:5558';
                const toUrl = (p: string) => p?.startsWith('http') ? p : `${base}/${p?.startsWith('uploads') ? p : `uploads/${p}`}`;
                const mediaArr: any[] = ((property as any)?.media || []) as any[];
                const videoMedia = mediaArr.find((m: any) => m?.media_type === 'video');
                const videoFromProp = (property as any)?.video?.path ? toUrl((property as any).video.path) : null;
                const videoUrl = videoMedia?.media_url ? toUrl(videoMedia.media_url) : videoFromProp;
                if (!videoUrl) return null;
                return (
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 mt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('property.tour360')}</h3>
                    <video src={videoUrl} className="w-full h-96 rounded-xl" controls playsInline />
                  </div>
                );
              })()}

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="w-6 h-6 text-yellow-500 mr-2" /> {t('property.reviews')}
                </h2>
                    <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-semibold text-gray-900">{avgRating || '0.0'}</div>
                    <div className="text-yellow-500 text-lg">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(Math.max(0, 5 - Math.round(avgRating)))}</div>
                    <div className="text-sm text-gray-600">({reviewsCount} review{reviewsCount === 1 ? '' : 's'})</div>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        if (!user) {
                          navigate('/login');
                          return;
                        }
                        const el = document.getElementById('review-form');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      className="text-sm text-blue-700 hover:underline"
                    >
                      {t('property.writeReview')}
                    </button>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-gray-600">{t('property.noReviews')}</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={String(r.id)} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-gray-900">{r.user?.name ? `by ${r.user.name}` : 'by Guest'}</div>
                          <div className="text-yellow-500">{'★'.repeat(Math.round(r.rating))}{'☆'.repeat(Math.max(0, 5 - Math.round(r.rating)))}</div>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{r.comment}</p>
                        <div className="text-xs text-gray-400 mt-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
                      </div>
                    ))}
                  </div>
                )}

                {(() => {
                  const userRole = user ? String((user as any).role || '').toLowerCase() : '';
                  // Only users with role "users" can comment/review
                  if (user && userRole === 'users') {
                    return (
                      <form id="review-form" onSubmit={submitReview} className="mt-6 space-y-4">
                        {reviewError && (
                          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg text-sm">{reviewError}</div>
                        )}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.yourRating')}</label>
                          <select
                            value={rating}
                            onChange={(e) => setRating(parseInt(e.target.value))}
                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          >
                            {[5,4,3,2,1].map(v => (
                              <option key={v} value={v}>{v} {t('property.star', { count: v })}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('property.yourReview')}</label>
                          <textarea
                            required
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder={t('property.placeholderReview')}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={reviewLoading}
                          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
                        >
                          {reviewLoading ? t('property.submitting') : t('property.submitReview')}
                        </button>
                      </form>
                    );
                  } else if (user) {
                    return (
                      <div className="mt-4">
                        <p className="text-gray-600 mb-3">Only regular users can post reviews. Agents and owners cannot post reviews.</p>
                      </div>
                    );
                  } else {
                    return (
                      <div className="mt-4">
                        <p className="text-gray-600 mb-3">{t('property.mustBe')}{' '}<button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">{t('property.loggedIn')}</button>{' '}{t('property.toPost')}</p>
                      </div>
                    );
                  }
                })()}
              </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('property.details')}</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">{t('property.listedDate')}</p>
                        <p className="font-semibold text-gray-900">
                          {/* created_at may not exist on DTO; fallback to now */}
                          {new Date((property as any).created_at || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Home className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">{t('property.status')}</p>
                        <p className="font-semibold text-gray-900 capitalize">{property.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 sticky top-24">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{t('property.interestedTitle')}</h3>
                  <p className="text-gray-600 mb-6">{t('property.contactBlurb')}</p>

                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 font-medium mb-3"
                  >
                    {t('property.scheduleViewing')}
                  </button>

                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full border-2 border-blue-600 text-blue-600 px-6 py-3.5 rounded-lg hover:bg-blue-50 transition font-medium"
                  >
                    {t('property.contactAgent')}
                  </button>

                  {(() => {
                    const userRole = user ? String((user as any).role || '').toLowerCase() : '';
                    // Only users with role "users" can make bookings
                    if (user && userRole === 'users') {
                      return (
                        <>
                          <div className="mt-4">
                            <button
                              onClick={() => {
                                setShowBookingForm((s) => !s);
                              }}
                              className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-lg hover:bg-blue-700 transition font-medium"
                            >
                              {showBookingForm ? t('property.cancel') : t('property.bookNow')}
                            </button>
                          </div>
                        </>
                      );
                    } else if (user) {
                      return (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 text-center">Only regular users can make bookings. Agents and owners cannot make bookings.</p>
                        </div>
                      );
                    } else {
                      return (
                        <div className="mt-4">
                          <button
                            onClick={() => navigate('/login')}
                            className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-lg hover:bg-blue-700 transition font-medium"
                          >
                            {t('property.bookNow')}
                          </button>
                        </div>
                      );
                    }
                  })()}

                  {showBookingForm && user && (() => {
                    const userRole = String((user as any).role || '').toLowerCase();
                    // Only show booking form if user has "users" role
                    if (userRole !== 'users') return null;
                    return (
                    <div className="mt-4 bg-white p-4 border border-gray-100 rounded-lg">
                      {bookingError && <div className="text-sm text-red-600 mb-2">{bookingError}</div>}
                      <label className="block text-sm text-gray-700">{t('property.startDate')}</label>
                      <input type="date" value={bookingStart} onChange={(e) => setBookingStart(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-2" />
                      <label className="block text-sm text-gray-700">{t('property.endDate')}</label>
                      <input type="date" value={bookingEnd} onChange={(e) => setBookingEnd(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-2" />
                      <label className="block text-sm text-gray-700">{t('property.durationType')}</label>
                      <select value={bookingDurationType} onChange={(e) => setBookingDurationType(e.target.value as any)} className="w-full px-3 py-2 border rounded mt-1 mb-3">
                        <option value="days">{t('property.duration.days')}</option>
                        <option value="weeks">{t('property.duration.weeks')}</option>
                        <option value="months">{t('property.duration.months')}</option>
                      </select>
                      <button
                        onClick={async () => {
                          if (!user) { navigate('/login'); return; }
                          if (!bookingStart || !bookingEnd) { setBookingError(t('property.selectDates')); return; }
                          setBookingError('');
                          setBookingLoading(true);
                          try {
                            // compute a simple totalAmount if possible
                            const start = new Date(bookingStart);
                            const end = new Date(bookingEnd);
                            const msPerDay = 1000 * 60 * 60 * 24;
                            const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / msPerDay));
                            let multiplier = 1;
                            if (bookingDurationType === 'weeks') multiplier = Math.ceil(diffDays / 7);
                            else if (bookingDurationType === 'months') multiplier = Math.ceil(diffDays / 30);
                            else multiplier = diffDays;
                            const price = (property?.price ?? 0) as number;
                            const totalAmount = price ? price * multiplier : undefined;

                            // Redirect user to the payment page with booking details so they complete payment first
                            const params = new URLSearchParams();
                            params.append('propertyId', String(property!.id));
                            params.append('startDate', bookingStart);
                            params.append('endDate', bookingEnd);
                            params.append('durationType', bookingDurationType);
                            if (totalAmount != null) params.append('amount', String(totalAmount));
                            navigate(`/payment?${params.toString()}`);
                          } catch (err: any) {
                            setBookingError(err?.message || t('property.bookingFailed'));
                          } finally {
                            setBookingLoading(false);
                          }
                        }}
                        disabled={bookingLoading}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition font-medium"
                      >
                        {bookingLoading ? t('property.booking') : t('property.confirmBooking')}
                      </button>
                    </div>
                    );
                  })()}

                  {/* <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                      Property ID: {String(property.id).substring(0, 8)}
                    </p>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

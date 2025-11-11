import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApiExtended, usersApi, PropertyDto, favoritesApi, bookingsApi, BookingDto } from '../lib/api';
import { formatPrice } from '../lib/format';
import { Plus, MapPin, BedDouble, Bath, Square, Edit, Eye, Heart, Calendar, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [profile, setProfile] = useState<{ name?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(6);
  const [total, setTotal] = useState<number>(0);
  
  // For users with role "users"
  const [favorites, setFavorites] = useState<Array<{ id: string | number; property: PropertyDto }>>([]);
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const userRole = user ? String((user as any).role || '').toLowerCase() : '';
  const isRegularUser = userRole === 'users';

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // If the user is an admin, redirect them to the admin dashboard (case-insensitive)
    if (user) {
      const role = String((user as any).role || '').toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
        return;
      }
    }

    loadData();
  }, [user, navigate]);

  // Reload data when returning to this page (e.g., after editing a property)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !loading) {
        loadData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, loading]);

  const loadData = async () => {
    try {
      if (isRegularUser) {
        // Load favorites and bookings for regular users
        const [favRes, bookRes, me] = await Promise.all([
          favoritesApi.list(),
          bookingsApi.list(),
          usersApi.getProfile(),
        ]);
        setFavorites(favRes?.favorites || []);
        setBookings(bookRes?.data?.bookings || []);
        setProfile(me ? { name: me.name } : null);
      } else {
        // Load properties for agents/owners
        const [propsRes, me] = await Promise.all([
          propertiesApiExtended.getByUser(user!.id as any, { page, limit }),
          usersApi.getProfile(),
        ]);
        if ((propsRes as any)?.properties) {
          setProperties((propsRes as any).properties);
          setTotal((propsRes as any).total || 0);
        }
        setProfile(me ? { name: me.name } : null);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      setProperties([]);
      setFavorites([]);
      setBookings([]);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5558';

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    // reload data for the new page
    setLoading(true);
    propertiesApiExtended.getByUser(user!.id as any, { page: p, limit })
      .then((res: any) => {
        setProperties(res?.properties || []);
        setTotal(res?.total || 0);
      })
      .catch((e) => console.error('Failed to load user properties page', e))
      .finally(() => setLoading(false));
  };

  const getFirstImageUrl = (property: any) => {
    const fallback = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
    if (!property) return fallback;
    
    const toUrl = (path: string) => {
      if (!path) return '';
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
      if (path.startsWith('uploads')) return `${API_BASE_URL}/${path}`;
      return `${API_BASE_URL}/uploads/${path}`;
    };

    // Priority 1: Check images array (uploaded files)
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      const first = property.images[0];
      if (first) {
        if (typeof first === 'string') {
          const url = toUrl(first);
          if (url) return url;
        } else if (typeof first === 'object') {
          const path = first.path || first.url || first.media_url;
          if (path) {
            const url = toUrl(path);
            if (url) return url;
          }
          if (first.filename) {
            const url = toUrl(`properties/images/${first.filename}`);
            if (url) return url;
          }
        }
      }
    }

    // Priority 2: Check media array (alternative name)
    if (property.media && Array.isArray(property.media) && property.media.length > 0) {
      const first = property.media[0];
      if (first && (!first.media_type || first.media_type === 'image')) {
        const path = first.media_url || first.path;
        if (path) {
          const url = toUrl(path);
          if (url) return url;
        }
      }
    }

    // Priority 3: Fall back to image_url (may be stale external URL)
    if (property.image_url) {
      const url = toUrl(property.image_url);
      if (url) return url;
    }

    return fallback;
  };

  const isAvailable = (p: any) => {
    const s = (p?.status || p?.availability_status || '').toString();
    return ['for_sale', 'for_rent', 'available'].includes(s);
  };


  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {profile?.name ? t('dashboard.welcomeBack', { name: profile.name }) : t('dashboard.welcomeUser')}
            </h1>
            <p className="text-gray-600">
              {isRegularUser ? t('dashboard.manageFavoritesBookings') : t('dashboard.manageProperties')}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/profile')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30"
          >
            {t('dashboard.editProfile')}
          </button>
        </div>

        {isRegularUser ? (
          // Stats cards for regular users
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-6 shadow-lg border border-pink-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-700 text-sm font-medium mb-1">{t('dashboard.totalFavorites')}</p>
                  <p className="text-3xl font-bold text-pink-900">{favorites.length}</p>
                </div>
                <div className="bg-pink-200 p-3 rounded-lg">
                  <Heart className="w-6 h-6 text-pink-600 fill-pink-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-700 text-sm font-medium mb-1">{t('dashboard.totalBookings')}</p>
                  <p className="text-3xl font-bold text-blue-900">{bookings.length}</p>
                </div>
                <div className="bg-blue-200 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6 shadow-lg border border-yellow-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-700 text-sm font-medium mb-1">{t('dashboard.requested')}</p>
                  <p className="text-3xl font-bold text-yellow-900">
                    {bookings.filter(b => b.status === 'pending' || b.status === 'requested').length}
                  </p>
                </div>
                <div className="bg-yellow-200 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 shadow-lg border border-red-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-700 text-sm font-medium mb-1">{t('dashboard.rejected')}</p>
                  <p className="text-3xl font-bold text-red-900">
                    {bookings.filter(b => b.status === 'rejected' || b.status === 'declined').length}
                  </p>
                </div>
                <div className="bg-red-200 p-3 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Stats cards for agents/owners
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{t('dashboard.totalProperties')}</p>
                  <p className="text-3xl font-bold text-gray-900">{properties.length}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{t('dashboard.available')}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {properties.filter(p => isAvailable(p)).length}
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm mb-1">{t('dashboard.featured')}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {properties.filter(p => p.featured).length}
                  </p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {isRegularUser ? (
          <>
            {/* Favorites Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Heart className="w-6 h-6 text-pink-600" />
                  <span>{t('dashboard.myFavorites')}</span>
                </h2>
                <button
                  onClick={() => navigate('/favorites')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {t('dashboard.viewAll')}
                </button>
              </div>

              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.slice(0, 6).map((favorite) => {
                    const property = favorite.property;
                    return (
                      <div
                        key={favorite.id}
                        onClick={() => navigate(`/properties/${property.id}`)}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all cursor-pointer group"
                      >
                        <div className="relative">
                          <img
                            src={getFirstImageUrl(property)}
                            alt={property.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              const ph = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                              if ((e.currentTarget as HTMLImageElement).src !== ph) (e.currentTarget as HTMLImageElement).src = ph;
                            }}
                          />
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-blue-700 shadow-lg">
                            Tsh {formatPrice(property.price)}
                          </div>
                          <div className="absolute top-3 left-3 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                            <Heart className="w-3 h-3 inline fill-white" />
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition">{property.title}</h3>
                          <div className="flex items-center text-gray-600 text-sm mb-3">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{property.city}, {property.state}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-600 text-sm">
                            <div className="flex items-center">
                              <BedDouble className="w-4 h-4 mr-1 text-blue-600" />
                              <span>{property.bedrooms}</span>
                            </div>
                            <div className="flex items-center">
                              <Bath className="w-4 h-4 mr-1 text-blue-600" />
                              <span>{property.bathrooms}</span>
                            </div>
                            <div className="flex items-center">
                              <Square className="w-4 h-4 mr-1 text-blue-600" />
                              <span>{property.area} sqft</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('dashboard.noFavorites')}</h3>
                  <p className="text-gray-600 mb-6">{t('dashboard.startBrowsing')}</p>
                  <button
                    onClick={() => navigate('/properties')}
                    className="bg-gradient-to-r from-pink-600 to-pink-700 text-white px-6 py-3 rounded-lg hover:from-pink-700 hover:to-pink-800 transition shadow-lg shadow-pink-600/30"
                  >
                    {t('dashboard.browseProperties')}
                  </button>
                </div>
              )}
            </div>

            {/* Bookings Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <span>{t('dashboard.myBookings')}</span>
                </h2>
                <button
                  onClick={() => navigate('/dashboard/bookings')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {t('dashboard.viewAll')}
                </button>
              </div>

              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'pending' || b.status === 'requested' || b.status === 'rejected' || b.status === 'declined').slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            {booking.status === 'pending' || booking.status === 'requested' ? (
                              <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{t('dashboard.requested')}</span>
                              </div>
                            ) : booking.status === 'rejected' || booking.status === 'declined' ? (
                              <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                <XCircle className="w-3 h-3" />
                                <span>{t('dashboard.rejected')}</span>
                              </div>
                            ) : (
                              <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                                <CheckCircle className="w-3 h-3" />
                                <span>{t('dashboard.confirmed')}</span>
                              </div>
                            )}
                          </div>
                          {booking.property && (
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{booking.property.title}</h3>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>{booking.startDate ? (() => {
                                try {
                                  return format(new Date(booking.startDate), 'MMM dd, yyyy');
                                } catch {
                                  return booking.startDate;
                                }
                              })() : 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              <span>{booking.endDate ? (() => {
                                try {
                                  return format(new Date(booking.endDate), 'MMM dd, yyyy');
                                } catch {
                                  return booking.endDate;
                                }
                              })() : 'N/A'}</span>
                            </div>
                            {booking.property && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-blue-600" />
                                <span>{booking.property.city}, {booking.property.state}</span>
                              </div>
                            )}
                            {booking.totalAmount && (
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-blue-600" />
                                <span className="font-bold text-gray-900">Tsh {formatPrice(booking.totalAmount)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/properties/${booking.property?.id}`)}
                          className="ml-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                        >
                          {t('dashboard.viewProperty')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('dashboard.noBookings')}</h3>
                  <p className="text-gray-600 mb-6">{t('dashboard.startBooking')}</p>
                  <button
                    onClick={() => navigate('/properties')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30"
                  >
                    {t('dashboard.browseProperties')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.yourProperties')}</h2>
              {(() => {
                const userRole = String((user as any)?.role || '').toLowerCase();
                // Only agents and owners can create properties
                if (userRole === 'agent' || userRole === 'owner') {
                  return (
                    <button
                      onClick={() => navigate('/dashboard/properties/new')}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 flex items-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{t('dashboard.addProperty')}</span>
                    </button>
                  );
                }
                return null;
              })()}
            </div>

            {properties.length > 0 ? (
            <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-all"
                >
                  <div className="relative">
                    <img
                      src={getFirstImageUrl(property)}
                      alt={property.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const ph = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                        if ((e.currentTarget as HTMLImageElement).src !== ph) (e.currentTarget as HTMLImageElement).src = ph;
                      }}
                    />
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-blue-700">
                      Tsh { formatPrice(property.price) }
                    </div>
                    {property.featured && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Featured
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{property.title}</h3>
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{property.city}, {property.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 text-sm mb-4">
                      <div className="flex items-center">
                        <BedDouble className="w-4 h-4 mr-1 text-blue-600" />
                        <span>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1 text-blue-600" />
                        <span>{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Square className="w-4 h-4 mr-1 text-blue-600" />
                        <span>{property.area} sqft</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/dashboard/properties/${property.id}/edit`)}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center space-x-2"
                      >
                        <Edit className="w-4 h-4" />
                        <span>{t('dashboard.edit')}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination controls for user properties (bottom) */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center space-x-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-2 rounded bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('dashboard.prev')}
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={"px-3 py-2 rounded border " + (p === page ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50')}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-2 rounded bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('dashboard.next')}
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('dashboard.noProperties')}</h3>
              <p className="text-gray-600 mb-6">{t('dashboard.startAdding')}</p>
              <button
                onClick={() => navigate('/dashboard/properties/new')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30"
              >
                {t('dashboard.addFirstProperty')}
              </button>
            </div>
          )}
          </div>
        )}
      </div>
    </div>
  );
}

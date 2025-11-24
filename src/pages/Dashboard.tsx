import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApiExtended, usersApi, PropertyDto, favoritesApi, bookingsApi, BookingDto, BackendUser } from '../lib/api';
import { formatPrice } from '../lib/format';
import { Plus, MapPin, BedDouble, Bath, Square, Edit, Eye, Heart, Calendar, CheckCircle, XCircle, Clock, DollarSign, AlertCircle, MessageCircle } from 'lucide-react';
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
  const userRole = user ? String((user as BackendUser).role || '').toLowerCase() : '';
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
        // Use getUserBookings to get all bookings belonging to the user (as guest or property owner/agent)
        const [favRes, bookRes, me] = await Promise.all([
          favoritesApi.list(),
          bookingsApi.getUserBookings(),
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
    
    const base = API_BASE_URL;
    const toUrl = (path: string | undefined | null) => {
      if (!path || typeof path !== 'string') return '';
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      if (path.startsWith('/')) return `${base}${path}`;
      if (path.startsWith('uploads')) return `${base}/${path}`;
      return `${base}/uploads/${path}`;
    };

    const firstImageFromArray = (arr: any[]) => {
      if (!Array.isArray(arr) || arr.length === 0) return '';
      const item = arr[0];
      if (!item) return '';
      
      if (typeof item === 'string') {
        const url = toUrl(item);
        if (url) return url;
      } else if (item && typeof item === 'object') {
        // Try multiple possible fields
        const candidates = [
          item.path,
          item.media_url,
          item.url,
          item.src,
          item.image_url
        ];
        
        for (const candidate of candidates) {
          if (candidate) {
            const url = toUrl(candidate);
            if (url) return url;
          }
        }
        
        // If filename exists, construct path
        if (item.filename) {
          // Try different path formats
          const filenamePaths = [
            `properties/images/${item.filename}`,
            `/uploads/properties/images/${item.filename}`,
            `uploads/properties/images/${item.filename}`
          ];
          for (const filenamePath of filenamePaths) {
            const url = toUrl(filenamePath);
            if (url) return url;
          }
        }
      }
      return '';
    };

    // Priority 1: Check images array (uploaded files)
    const fromImages = firstImageFromArray(property.images || []);
    if (fromImages) return fromImages;

    // Priority 2: Check media array (alternative name)
    const fromMedia = firstImageFromArray(
      (property.media || []).filter((m: any) => !m.media_type || m.media_type === 'image')
    );
    if (fromMedia) return fromMedia;

    // Priority 3: Check gallery array
    const fromGallery = firstImageFromArray(property.gallery || []);
    if (fromGallery) return fromGallery;

    // Priority 4: Fall back to explicit image_url
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

  // Helper function to check if property is approved (handles different formats)
  const isPropertyApproved = (property: any): boolean => {
    // Check moderationStatus first (new field from backend)
    if (property.moderationStatus) {
      return String(property.moderationStatus).toLowerCase() === 'approved';
    }
    // Check approvedAt field - if it exists, property is approved
    if (property.approvedAt) {
      return true;
    }
    // Fallback to is_approved field
    return property.is_approved === true || 
           property.is_approved === 1 || 
           property.is_approved === '1' || 
           String(property.is_approved).toLowerCase() === 'true' ||
           property.status === 'approved';
  };

  // Get property status for display
  const getPropertyStatus = (property: any) => {
    const isApproved = isPropertyApproved(property);
    // Get moderationStatus or fallback to status
    const moderationStatus = property.moderationStatus || property.status || (isApproved ? 'approved' : 'pending');
    const statusText = String(moderationStatus).toLowerCase();
    const isRejected = statusText === 'rejected' || statusText === 'declined';
    
    if (isApproved || statusText === 'approved') {
      return {
        text: t('dashboard.approved'),
        class: 'bg-green-100 text-green-800',
        icon: <CheckCircle className="w-3 h-3 mr-1" />
      };
    } else if (isRejected) {
      return {
        text: t('dashboard.rejected'),
        class: 'bg-red-100 text-red-800',
        icon: <XCircle className="w-3 h-3 mr-1" />
      };
    } else {
      return {
        text: t('dashboard.waitingForApproval'),
        class: 'bg-yellow-100 text-yellow-800',
        icon: <Clock className="w-3 h-3 mr-1" />
      };
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('dashboard.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {profile?.name ? t('dashboard.welcomeBack', { name: profile.name }) : t('dashboard.welcomeUser')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {isRegularUser ? t('dashboard.manageFavoritesBookings') : t('dashboard.manageProperties')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {(() => {
              const userRole = String((user as any)?.role || '').toLowerCase();
              // Only owners and agents can view inquiries
              if (userRole === 'owner' || userRole === 'agent') {
                return (
                  <button
                    onClick={() => navigate('/dashboard/inquiries')}
                    className="w-full sm:w-auto bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-5 py-2.5 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition shadow-lg shadow-light-blue-500/30 text-sm sm:text-base flex items-center justify-center space-x-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquiries</span>
                  </button>
                );
              }
              return null;
            })()}
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="w-full sm:w-auto bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-5 py-2.5 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30 text-sm sm:text-base"
            >
              {t('dashboard.editProfile')}
            </button>
          </div>
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

            <div className="bg-gradient-to-br from-light-blue-50 to-light-blue-100 rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-dark-blue-600 text-sm font-medium mb-1">{t('dashboard.totalBookings')}</p>
                  <p className="text-3xl font-bold text-dark-blue-800">{bookings.length}</p>
                </div>
                <div className="bg-blue-200 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-dark-blue-500" />
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
                <div className="bg-light-blue-100 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-dark-blue-500" />
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
                  className="text-dark-blue-500 hover:text-dark-blue-600 font-medium text-sm"
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
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-dark-blue-600 shadow-lg">
                            Tsh {formatPrice(property.price)}
                          </div>
                          <div className="absolute top-3 left-3 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                            <Heart className="w-3 h-3 inline fill-white" />
                          </div>
                        </div>
                        <div className="p-5">
                          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-dark-blue-500 transition">{property.title}</h3>
                          <div className="flex items-center text-gray-600 text-sm mb-3">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span>{property.city}, {property.state}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-600 text-sm">
                            <div className="flex items-center">
                              <BedDouble className="w-4 h-4 mr-1 text-dark-blue-500" />
                              <span>{property.bedrooms}</span>
                            </div>
                            <div className="flex items-center">
                              <Bath className="w-4 h-4 mr-1 text-dark-blue-500" />
                              <span>{property.bathrooms}</span>
                            </div>
                            <div className="flex items-center">
                              <Square className="w-4 h-4 mr-1 text-dark-blue-500" />
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
                  <Calendar className="w-6 h-6 text-dark-blue-500" />
                  <span>{t('dashboard.myBookings')}</span>
                </h2>
                <button
                  onClick={() => navigate('/dashboard/bookings')}
                  className="text-dark-blue-500 hover:text-dark-blue-600 font-medium text-sm"
                >
                  {t('dashboard.viewAll')}
                </button>
              </div>

              {bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'pending' || b.status === 'requested' || b.status === 'rejected' || b.status === 'declined').slice(0, 5).map((booking) => (
                    <div
                      key={booking.id}
                      className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 sm:p-5 border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex-1 w-full">
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
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">{booking.property.title}</h3>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-dark-blue-500 flex-shrink-0" />
                              <span className="truncate">{booking.startDate ? (() => {
                                try {
                                  return format(new Date(booking.startDate), 'MMM dd, yyyy');
                                } catch {
                                  return booking.startDate;
                                }
                              })() : 'N/A'}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-dark-blue-500 flex-shrink-0" />
                              <span className="truncate">{booking.endDate ? (() => {
                                try {
                                  return format(new Date(booking.endDate), 'MMM dd, yyyy');
                                } catch {
                                  return booking.endDate;
                                }
                              })() : 'N/A'}</span>
                            </div>
                            {booking.property && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-dark-blue-500 flex-shrink-0" />
                                <span className="truncate">{booking.property.city}, {booking.property.state}</span>
                              </div>
                            )}
                            {booking.totalAmount && (
                              <div className="flex items-center space-x-2">
                                <DollarSign className="w-4 h-4 text-dark-blue-500 flex-shrink-0" />
                                <span className="font-bold text-gray-900">Tsh {formatPrice(booking.totalAmount)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate(`/properties/${booking.property?.id}`)}
                          className="w-full sm:w-auto bg-dark-blue-500 text-white px-4 py-2 rounded-lg hover:bg-dark-blue-600 transition text-sm font-medium"
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
                    className="bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30"
                  >
                    {t('dashboard.browseProperties')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboard.yourProperties')}</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {(() => {
                  const userRole = String((user as any)?.role || '').toLowerCase();
                  // Only agents and owners can create properties and view inquiries
                  if (userRole === 'agent' || userRole === 'owner') {
                    return (
                      <>
                        <button
                          onClick={() => navigate('/dashboard/inquiries')}
                          className="w-full sm:w-auto bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-6 py-2.5 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition shadow-lg shadow-light-blue-500/30 flex items-center justify-center space-x-2 text-sm sm:text-base"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>View Inquiries</span>
                        </button>
                        <button
                          onClick={() => navigate('/dashboard/properties/new')}
                          className="w-full sm:w-auto bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-2.5 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30 flex items-center justify-center space-x-2 text-sm sm:text-base"
                        >
                          <Plus className="w-5 h-5" />
                          <span>{t('dashboard.addProperty')}</span>
                        </button>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
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
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-dark-blue-600">
                      Tsh { formatPrice(property.price) }
                    </div>
                    {property.featured && (
                      <div className="absolute top-3 left-3 bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Featured
                      </div>
                    )}
                    {/* Status Badge */}
                    {(() => {
                      const status = getPropertyStatus(property);
                      return (
                        <div className={`absolute bottom-3 left-3 inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${status.class} shadow-lg`}>
                          {status.icon}
                          {status.text}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{property.title}</h3>
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{property.city}, {property.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 text-sm mb-4">
                      <div className="flex items-center">
                        <BedDouble className="w-4 h-4 mr-1 text-dark-blue-500" />
                        <span>{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1 text-dark-blue-500" />
                        <span>{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Square className="w-4 h-4 mr-1 text-dark-blue-500" />
                        <span>{property.area} sqft</span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/dashboard/properties/${property.id}/edit`)}
                        className="flex-1 bg-dark-blue-500 text-white px-4 py-2 rounded-lg hover:bg-dark-blue-600 transition flex items-center justify-center space-x-2"
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
                      className={"px-3 py-2 rounded border " + (p === page ? 'bg-dark-blue-500 text-white' : 'bg-white hover:bg-gray-50')}
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
                className="bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30"
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

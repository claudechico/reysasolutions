import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi, bookingsApi, paymentsApi, propertiesApiExtended, favoritesApi } from '../lib/api';
import { CheckCircle, XCircle, Clock, Mail, Phone, User, Shield, DollarSign, Calendar, Home, Heart, Edit, KeyRound, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../lib/format';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'payments'>('profile');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [profile, setProfile] = useState<any>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  
  // Statistics
  const [stats, setStats] = useState({
    bookings: 0,
    payments: 0,
    totalSpent: 0,
    properties: 0,
    favorites: 0,
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProfileData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const me: any = await usersApi.getProfile();
      setProfile(me);
      setForm({
        name: me.name || '',
        email: me.email || '',
        phoneNumber: me.phoneNumber || '',
      });
      setEmailVerified(!!me.isVerified || !!me.emailVerified);
      setPhoneVerified(!!me.phoneNumberVerified || !!me.phoneVerified || !!me.phone_verified);

      // Load statistics
      const userRole = String((me.role || '').toLowerCase());
      const isRegularUser = userRole === 'users';

      if (isRegularUser) {
        // Load bookings and payments for regular users
        // Use getUserBookings to get bookings where user is the guest
        const [bookingsRes, paymentsRes, favoritesRes] = await Promise.all([
          bookingsApi.getUserBookings({ type: 'guest', limit: 100 }).catch(() => ({ data: { bookings: [] } })),
          paymentsApi.list?.({ limit: 100 }).catch(() => ({ payments: [] })),
          favoritesApi.list().catch(() => ({ favorites: [] })),
        ]);

        const bookings = bookingsRes?.data?.bookings || [];
        const payments = paymentsRes?.payments || [];
        const favorites = favoritesRes?.favorites || [];

        console.log('Profile - User Bookings Data:', {
          totalBookings: bookings.length,
          bookings: bookings.map((b: any) => ({
            id: b.id,
            status: b.status,
            propertyId: b.propertyId || b.property?.id,
            propertyTitle: b.property?.title,
            totalAmount: b.totalAmount || b.total_price,
            startDate: b.startDate || b.check_in,
            endDate: b.endDate || b.check_out,
          }))
        });

        setStats({
          bookings: bookings.length,
          payments: payments.length,
          totalSpent: payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0),
          properties: 0,
          favorites: favorites.length,
        });

        setRecentBookings(bookings.slice(0, 5));
        setRecentPayments(payments.slice(0, 5));
      } else {
        // Load properties for agents/owners
        // Use getUserBookings with type='owner' to get bookings for properties owned/managed by this user
        const [propsRes, bookingsRes] = await Promise.all([
          propertiesApiExtended.getByUser(me.id, { page: 1, limit: 1000 }).catch(() => ({ properties: [] })),
          bookingsApi.getUserBookings({ type: 'owner', limit: 100 }).catch(() => ({ data: { bookings: [] } })),
        ]);

        const properties = (propsRes as any)?.properties || [];
        const myPropertyBookings = bookingsRes?.data?.bookings || [];

        console.log('Profile - Agent/Owner Bookings Data:', {
          myProperties: properties.length,
          myPropertyBookings: myPropertyBookings.length,
          bookings: myPropertyBookings.map((b: any) => ({
            id: b.id,
            status: b.status,
            propertyId: b.propertyId || b.property?.id,
            propertyTitle: b.property?.title,
            guest: b.guest?.name || b.user?.name,
            totalAmount: b.totalAmount || b.total_price,
          }))
        });

        setStats({
          bookings: myPropertyBookings.length,
          payments: 0,
          totalSpent: 0,
          properties: properties.length,
          favorites: 0,
        });

        setRecentBookings(myPropertyBookings.slice(0, 5));
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const me = await usersApi.getProfile();
      const payload: any = {};
      if (form.name.trim() && form.name.trim() !== (me.name || '')) payload.name = form.name.trim();
      if (form.email.trim() && form.email.trim() !== (me.email || '')) payload.email = form.email.trim();
      if ((form.phoneNumber || '').trim() !== (me.phoneNumber || '')) payload.phoneNumber = (form.phoneNumber || '').trim();

      if (Object.keys(payload).length === 0) {
        setSuccess('No changes to update');
      } else {
        await usersApi.updateProfile(payload);
        setSuccess('Profile updated successfully');
        await loadProfileData();
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const updateBookingStatus = async (bookingId: string | number, status: 'confirmed' | 'declined') => {
    if (!bookingId) return;
    
    // Check for token before making request
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Authentication required. Please login again.');
      console.error('No auth token found when updating booking status');
      return;
    }
    
    try {
      if (status === 'declined' && !confirm('Are you sure you want to decline this booking?')) return;

      setLoading(true);
      console.log('Updating booking status:', { bookingId, status, hasToken: !!token });
      
      if (status === 'confirmed') {
        await bookingsApi.confirm(bookingId);
      } else if (status === 'declined') {
        await bookingsApi.decline(bookingId);
      }
      
      // Reload profile data after status update
      await loadProfileData();
      setSuccess(`Booking ${status === 'confirmed' ? 'accepted' : 'declined'} successfully`);
    } catch (err: any) {
      console.error('Failed to update booking status', err);
      const errorMessage = err?.message || 'Unknown error';
      if (errorMessage.includes('Authentication') || err?.status === 401 || err?.status === 403) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Failed to update booking: ' + errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower === 'confirmed' || statusLower === 'completed' || statusLower === 'paid') {
      return { class: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-3 h-3" />, text: t('profile.confirmed') };
    } else if (statusLower === 'pending' || statusLower === 'requested') {
      return { class: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3" />, text: t('profile.pending') };
    } else if (statusLower === 'rejected' || statusLower === 'declined' || statusLower === 'cancelled') {
      return { class: 'bg-red-100 text-red-800', icon: <XCircle className="w-3 h-3" />, text: t('profile.cancelled') };
    }
    return { class: 'bg-gray-100 text-gray-800', icon: <Clock className="w-3 h-3" />, text: status };
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  const userRole = profile ? String((profile.role || '').toLowerCase()) : '';
  const isRegularUser = userRole === 'users';

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('profile.title')}</h1>
          <p className="text-gray-600">{t('profile.manageAccount')}</p>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-dark-blue-500 to-dark-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {profile?.name ? getInitials(profile.name) : 'U'}
              </div>
              {emailVerified && (
                <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1.5 border-4 border-white">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-900">{profile?.name || t('profile.user')}</h2>
                {emailVerified ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    <Shield className="w-3 h-3 mr-1" />
                    {t('profile.verifiedAccount')}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {t('profile.unverified')}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-gray-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>{profile?.email || t('profile.notAvailable')}</span>
                  {emailVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                {profile?.phoneNumber && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4" />
                    <span>{profile.phoneNumber}</span>
                    {phoneVerified && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span className="capitalize">{profile?.role || t('profile.user')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {isRegularUser ? (
            <>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 text-dark-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.bookings}</p>
                <p className="text-sm text-gray-600">{t('profile.totalBookings')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.payments}</p>
                <p className="text-sm text-gray-600">{t('profile.payments')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">Tsh {formatPrice(stats.totalSpent)}</p>
                <p className="text-sm text-gray-600">{t('profile.totalSpent')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="w-8 h-8 text-pink-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.favorites}</p>
                <p className="text-sm text-gray-600">{t('profile.favorites')}</p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <Home className="w-8 h-8 text-dark-blue-500" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.properties}</p>
                <p className="text-sm text-gray-600">{t('profile.properties')}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <Calendar className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stats.bookings}</p>
                <p className="text-sm text-gray-600">{t('profile.bookings')}</p>
              </div>
            </>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-light-blue-500 text-dark-blue-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{t('profile.profile')}</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-light-blue-500 text-dark-blue-500'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t('profile.bookings')}</span>
                  {stats.bookings > 0 && (
                    <span className="bg-light-blue-100 text-dark-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {stats.bookings}
                    </span>
                  )}
                </div>
              </button>
              {isRegularUser && (
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'payments'
                      ? 'border-light-blue-500 text-dark-blue-500'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span>{t('profile.payments')}</span>
                    {stats.payments > 0 && (
                      <span className="bg-light-blue-100 text-dark-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {stats.payments}
                      </span>
                    )}
                  </div>
                </button>
              )}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div>
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
                    <XCircle className="w-5 h-5" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>{success}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>{t('profile.name')}</span>
                        </div>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4" />
                          <span>{t('profile.email')}</span>
                        </div>
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none pr-10"
                        />
                        {emailVerified && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                      </div>
                      {!emailVerified && (
                        <p className="mt-1 text-xs text-yellow-600 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Email not verified</span>
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4" />
                          <span>{t('profile.phone')}</span>
                        </div>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={form.phoneNumber}
                          onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none pr-10"
                        />
                        {phoneVerified && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    {t('profile.cancel')}
                  </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition disabled:opacity-50 flex items-center space-x-2"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4" />
                          <span>{t('profile.save')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Security Section */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <KeyRound className="w-5 h-5" />
                    <span>{t('profile.security')}</span>
                  </h3>
                  <button
                    onClick={() => navigate('/dashboard/change-password')}
                    className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{t('profile.changePassword')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                {recentBookings.length > 0 ? (
                  <div className="space-y-4">
                    {recentBookings.map((booking: any) => {
                      const statusBadge = getStatusBadge(booking.status || 'pending');
                      return (
                        <div
                          key={booking.id}
                          className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.class}`}>
                                  {statusBadge.icon}
                                  <span>{statusBadge.text}</span>
                                </span>
                              </div>
                              {booking.property && (
                                <h3 className="text-lg font-bold text-gray-900 mb-2">{booking.property.title}</h3>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-dark-blue-500" />
                                  <span>
                                    {booking.startDate
                                      ? format(new Date(booking.startDate), 'MMM dd, yyyy')
                                      : 'N/A'}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Calendar className="w-4 h-4 text-dark-blue-500" />
                                  <span>
                                    {booking.endDate
                                      ? format(new Date(booking.endDate), 'MMM dd, yyyy')
                                      : 'N/A'}
                                  </span>
                                </div>
                                {booking.property && (
                                  <div className="flex items-center space-x-2">
                                    <Home className="w-4 h-4 text-dark-blue-500" />
                                    <span>
                                      {booking.property.city}, {booking.property.state}
                                    </span>
                                  </div>
                                )}
                                {booking.totalAmount && (
                                  <div className="flex items-center space-x-2">
                                    <DollarSign className="w-4 h-4 text-dark-blue-500" />
                                    <span className="font-bold text-gray-900">
                                      Tsh {formatPrice(booking.totalAmount)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {booking.property && (
                                <button
                                  onClick={() => navigate(`/properties/${booking.property.id}`)}
                                  className="bg-dark-blue-500 text-white px-4 py-2 rounded-lg hover:bg-dark-blue-600 transition text-sm font-medium"
                                >
                                  {t('profile.view')}
                                </button>
                              )}
                              {/* Show accept/decline buttons for agents/owners on pending bookings */}
                              {!isRegularUser && (booking.status === 'pending' || booking.status === 'requested') && (
                                <>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center space-x-1"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Accept</span>
                                  </button>
                                  <button
                                    onClick={() => updateBookingStatus(booking.id, 'declined')}
                                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center space-x-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    <span>Decline</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('profile.noBookingsYet')}</h3>
                    <p className="text-gray-600 mb-6">{t('profile.startBooking')}</p>
                    <button
                      onClick={() => navigate('/properties')}
                      className="bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition"
                    >
                      {t('profile.browseProperties')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && isRegularUser && (
              <div>
                {recentPayments.length > 0 ? (
                  <div className="space-y-4">
                    {recentPayments.map((payment: any) => {
                      const statusBadge = getStatusBadge(payment.status || 'pending');
                      return (
                        <div
                          key={payment.id}
                          className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.class}`}>
                                  {statusBadge.icon}
                                  <span>{statusBadge.text}</span>
                                </span>
                                <span className="text-sm text-gray-600 capitalize">{payment.provider || 'N/A'}</span>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-600">{t('profile.amount')}</p>
                                  <p className="text-lg font-bold text-gray-900">
                                    Tsh {formatPrice(payment.amount || 0)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-600">{t('profile.date')}</p>
                                  <p className="font-medium text-gray-900">
                                    {payment.created_at
                                      ? format(new Date(payment.created_at), 'MMM dd, yyyy')
                                      : t('profile.notAvailable')}
                                  </p>
                                </div>
                                {payment.phone && (
                                  <div>
                                    <p className="text-gray-600">{t('profile.phoneLabel')}</p>
                                    <p className="font-medium text-gray-900">{payment.phone}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('profile.noPaymentsYet')}</h3>
                    <p className="text-gray-600 mb-6">{t('profile.paymentHistory')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

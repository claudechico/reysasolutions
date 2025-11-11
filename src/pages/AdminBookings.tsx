import { useEffect, useState } from 'react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminSidebar from '../components/AdminSidebar';
import { adminBookingsApi } from '../lib/api';
import { CheckCircle, XCircle, Clock, RefreshCw, Calendar, User, MapPin, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { formatPrice } from '../lib/format';

export default function AdminBookings() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, statusFilter]);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit };
      if (statusFilter) params.status = statusFilter;
      const res: any = await adminBookingsApi.list(params).catch(() => null);
      const list = (res && res.data && res.data.bookings) ? res.data.bookings : (res?.bookings || []);
      setBookings(list || []);
      // try various shapes for total
      const totalCount = res?.pagination?.total ?? res?.total ?? (res?.data?.bookings ? Number(res.data.bookings.length) : (res?.bookings ? res.bookings.length : 0));
      setTotal(Number(totalCount || 0));
      setPage(p);
    } catch (err) {
      console.error('Failed to load admin bookings', err);
      setBookings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (v: any) => {
    if (!v) return '-';
    try {
      return format(new Date(v), 'MMM dd, yyyy HH:mm');
    } catch { return '-'; }
  };

  const getStatusColor = (s: string) => {
    switch ((s || '').toLowerCase()) {
      case 'confirmed': return 'bg-green-50 text-green-700';
      case 'pending': return 'bg-yellow-50 text-yellow-700';
      case 'declined': return 'bg-red-50 text-red-700';
      case 'cancelled': return 'bg-gray-50 text-gray-700';
      default: return 'bg-gray-50 text-gray-700';
    }
  };

  const getStatusIcon = (s: string) => {
    switch ((s || '').toLowerCase()) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'declined': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  if (loading && bookings.length === 0) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading bookings...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <AdminSidebar />
        <div className="flex-1 ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Bookings Management</h1>
            </div>
            <p className="text-gray-600">Review and manage all bookings across the platform</p>
          </div>

          {/* Filters and Actions */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full">
                <select 
                  value={statusFilter} 
                  onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="declined">Declined</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <button 
                onClick={() => load(1)} 
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Booking ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Dates</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No bookings found.</p>
                      </td>
                    </tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-900">#{b.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 mb-1">{b.property?.title || b.propertyTitle || b.properties?.title || '—'}</div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate">{b.property?.city || b.propertyCity || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-2 text-gray-400" />
                            <span>{b.guest?.name || b.guestName || b.user?.name || 'Guest'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center mb-1">
                              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="font-medium">Check-in:</span>
                            </div>
                            <div className="text-gray-600 ml-4">{formatDate(b.startDate || b.check_in)}</div>
                            <div className="flex items-center mt-2 mb-1">
                              <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                              <span className="font-medium">Check-out:</span>
                            </div>
                            <div className="text-gray-600 ml-4">{formatDate(b.endDate || b.check_out)}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center text-sm font-semibold text-blue-600">
                            <DollarSign className="w-4 h-4 mr-1" />
                            <span>Tsh {formatPrice(b.totalAmount || b.total_price || 0)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(b.status)}`}>
                            {getStatusIcon(b.status)}
                            <span className="capitalize">{b.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> — <span className="font-semibold">{total}</span> total bookings
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Prev
              </button>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                {[10, 20, 50, 100].map(n => (<option key={n} value={n}>{n} / page</option>))}
              </select>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

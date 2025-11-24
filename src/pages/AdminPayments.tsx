import { useEffect, useState } from 'react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminSidebar from '../components/AdminSidebar';
import { adminPaymentsApi } from '../lib/api';
import { CreditCard, DollarSign, Calendar, CheckCircle, XCircle, Clock, Loader2, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { formatPrice } from '../lib/format';

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => { load(page); }, [page, limit]);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const res: any = await adminPaymentsApi.transactions({ page: p, limit });
      if (res?.payments) {
        setPayments(res.payments);
        setTotal(res.pagination?.total ?? res.total ?? res.payments.length);
      } else {
        setPayments([]);
        setTotal(0);
      }
    } catch (e) {
      console.error('Failed to load payments', e);
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (v: any) => {
    if (!v) return '-';
    try {
      return format(new Date(v), 'MMM dd, yyyy HH:mm');
    } catch {
      return '-';
    }
  };

  const getStatusColor = (s: string) => {
    switch ((s || '').toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (s: string) => {
    switch ((s || '').toLowerCase()) {
      case 'completed':
      case 'success':
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const totalRevenue = payments
    .filter(p => ['completed', 'success', 'paid'].includes((p.status || '').toLowerCase()))
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  if (loading && payments.length === 0) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading payments...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-16 lg:pt-0 pb-6 sm:pb-8 lg:pb-12 space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-dark-blue-500" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Payments Management</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">View and manage all payment transactions across the platform</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl shadow-xl border border-green-400 p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 opacity-80" />
              </div>
              <div className="text-green-100 text-xs sm:text-sm font-medium mb-1">Total Revenue</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">Tsh {formatPrice(totalRevenue)}</div>
            </div>

            <div className="bg-gradient-to-br from-light-blue-500 to-dark-blue-500 rounded-xl sm:rounded-2xl shadow-xl border border-light-blue-400 p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <CreditCard className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
              </div>
              <div className="text-light-blue-100 text-xs sm:text-sm font-medium mb-1">Total Transactions</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{total}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl shadow-xl border border-purple-400 p-4 sm:p-6 text-white">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="bg-white/20 p-2 sm:p-3 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Clock className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
              </div>
              <div className="text-purple-100 text-xs sm:text-sm font-medium mb-1">Pending Payments</div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold">
                {payments.filter(p => (p.status || '').toLowerCase() === 'pending').length}
              </div>
            </div>
          </div>

          {/* Payments Table */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full min-w-[700px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Provider</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                        <CreditCard className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-gray-600 font-medium">No payments found.</p>
                      </td>
                    </tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm font-semibold text-gray-900">#{p.id}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center text-xs sm:text-sm font-semibold text-dark-blue-500">
                            <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            <span>Tsh {formatPrice(p.amount || 0)}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm text-gray-900 capitalize">{p.provider || 'N/A'}</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className={`inline-flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(p.status)}`}>
                            {getStatusIcon(p.status)}
                            <span className="capitalize">{p.status || 'Unknown'}</span>
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400 flex-shrink-0" />
                            <span>{formatDate(p.created_at || p.createdAt)}</span>
                          </div>
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
              Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> — <span className="font-semibold">{total}</span> total transactions
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
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-light-blue-500 outline-none text-sm"
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

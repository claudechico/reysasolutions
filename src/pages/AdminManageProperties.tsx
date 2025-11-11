import { useEffect, useState } from 'react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminSidebar from '../components/AdminSidebar';
import { adminListingsApi } from '../lib/api';
import { useTranslation } from 'react-i18next';
import {
  Search,
  X,
  CheckCircle,
  XCircle,
  Trash2,
  Eye,
  Building2,
  Calendar,
  MapPin,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { formatPrice } from '../lib/format';
import { format } from 'date-fns';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5558';

const resolveImageUrl = (property: any) => {
  if (!property) {
    return 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600';
  }

  const toUrl = (path: string | undefined | null) => {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
    if (path.startsWith('uploads')) return `${API_BASE_URL}/${path}`;
    return `${API_BASE_URL}/uploads/${path}`;
  };

  const candidates: Array<string | undefined> = [];

  if (Array.isArray(property.images) && property.images.length) {
    const first = property.images[0];
    if (typeof first === 'string') {
      candidates.push(first);
    } else if (first) {
      candidates.push(first.url || first.path || first.src || first.image_url);
    }
  }

  if (Array.isArray(property.gallery) && property.gallery.length) {
    const first = property.gallery[0];
    if (typeof first === 'string') {
      candidates.push(first);
    } else if (first) {
      candidates.push(first.url || first.path || first.src);
    }
  }

  candidates.push(
    property.featured_image,
    property.cover_image,
    property.mainImage,
    property.thumbnail,
    property.image_url,
    property.imageUrl
  );

  for (const candidate of candidates) {
    const resolved = toUrl(candidate);
    if (resolved) return resolved;
  }

  return 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600';
};

export default function AdminManageProperties() {
  const [props, setProps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string | number, boolean>>({});

  useEffect(() => { load(page); }, [page]);

  const load = async (forPage = 1) => {
    setLoading(true);
    try {
      // If a search query exists, fetch a larger set and filter client-side
      if (query && query.trim().length > 0) {
        // use admin listings endpoint to ensure we retrieve all listings (including unapproved)
        const res: any = await adminListingsApi.list({ page: 1, limit: 1000 });
        const all = res?.properties || [];
        const q = query.trim().toLowerCase();
        const filtered = all.filter((p: any) => {
          const title = String(p.title || '').toLowerCase();
          const ownerName = String(p?.profiles?.full_name || (p.owner && typeof p.owner === 'object' ? (p.owner.name || p.owner.full_name) : p.owner) || '').toLowerCase();
          return title.includes(q) || ownerName.includes(q);
        });
        setTotal(filtered.length);
        const start = (forPage - 1) * limit;
        setProps(filtered.slice(start, start + limit));
        return;
      }

      // For admin view, use the admin listings endpoint which returns all listings for moderation
      const res: any = await adminListingsApi.list({ page: forPage, limit });
      if (res?.properties) {
        setProps(res.properties);
        setTotal(res.pagination?.total ?? res.total ?? (res.properties ? res.properties.length : 0));
      } else {
        setProps([]);
        setTotal(0);
      }
    } catch (e) {
      console.error('Failed to load properties', e);
      setProps([]);
      setTotal(0);
    } finally { setLoading(false); }
  };

  const setApproval = async (id: string | number, approved: boolean) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      if (approved) {
        await adminListingsApi.approve(id as any);
      } else {
        await adminListingsApi.decline(id as any);
      }
      await load(page);
    } catch (e: any) {
      console.error('Approve failed', e);
      alert('Approve failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const remove = async (id: string | number) => {
    const key = `${id}-remove`;
    if (!confirm('Delete property?')) return;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      await adminListingsApi.remove(id);
      setProps((prev) => prev.filter((p) => p.id !== id));
      await load(page);
    } catch (e: any) {
      console.error(e);
      alert('Delete failed: ' + (e?.message || 'Unknown error'));
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const formatDate = (v: any) => {
    if (!v) return '-';
    try {
      const d = new Date(v);
      if (isNaN(d.getTime())) return '-';
      return format(d, 'MMM dd, yyyy');
    } catch {
      return '-';
    }
  };

  const { t } = useTranslation();

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading properties...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <AdminSidebar />
        <div className="flex-1 ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Building2 className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">{t('admin.manageProperties.title')}</h1>
            </div>
            <p className="text-gray-600">Manage and moderate all property listings</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('admin.manageProperties.searchPlaceholder')}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
              <button 
                onClick={() => { setPage(1); load(1); }} 
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>{t('admin.manageProperties.search')}</span>
              </button>
              {query && (
                <button 
                  onClick={() => { setQuery(''); setPage(1); load(1); }} 
                  className="w-full md:w-auto bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>{t('admin.manageProperties.clear')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Property</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Owner</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Created</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {props.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">No properties found.</p>
                      </td>
                    </tr>
                  ) : (
                    props.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-4">
                            <div className="h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
                              <img
                                src={resolveImageUrl(p)}
                                alt={p.title}
                                className="h-16 w-16 object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 mb-1">{p.title}</div>
                              <div className="flex items-center text-sm text-gray-600 mb-2">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="truncate">{p.location || ''}{p.city ? `, ${p.city}` : ''}</span>
                              </div>
                              <div className="flex items-center text-sm font-medium text-blue-600">
                                <DollarSign className="w-3 h-3 mr-1" />
                                <span>Tsh {formatPrice(p.price)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{(p?.profiles?.full_name) || (p.owner && typeof p.owner === 'object' ? (p.owner.name || p.owner.full_name) : p.owner) || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${p.is_approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {p.is_approved ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {t('admin.manageProperties.approved')}
                              </>
                            ) : (
                              <>
                                <Calendar className="w-3 h-3 mr-1" />
                                {t('admin.manageProperties.pending')}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(p.created_at || p.createdAt || p.created)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => window.open(`/properties/${p.id}`, '_blank')}
                              className="p-2 rounded-lg border border-blue-100 bg-blue-50 text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {!p.is_approved && (
                              <button
                                disabled={Boolean(actionLoading[p.id])}
                                onClick={() => setApproval(p.id, true)}
                                className="flex items-center justify-center rounded-lg bg-green-50 px-2 py-2 text-green-600 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-70"
                                title="Approve"
                              >
                                {actionLoading[p.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {!p.is_approved && (
                              <button
                                disabled={Boolean(actionLoading[p.id])}
                                onClick={() => setApproval(p.id, false)}
                                className="flex items-center justify-center rounded-lg bg-yellow-50 px-2 py-2 text-yellow-600 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-70"
                                title="Decline"
                              >
                                {actionLoading[p.id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            <button
                              disabled={Boolean(actionLoading[`${p.id}-remove`])}
                              onClick={() => remove(p.id)}
                              className="flex items-center justify-center rounded-lg bg-red-50 px-2 py-2 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                              title="Delete"
                            >
                              {actionLoading[`${p.id}-remove`] ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
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
              Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> — <span className="font-semibold">{total}</span> total properties
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => { setPage(page - 1); }}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                Prev
              </button>
              <select
                value={limit}
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); load(1); }}
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                {[10, 20, 50, 100].map(n => (<option key={n} value={n}>{n} / page</option>))}
              </select>
              <button
                disabled={page >= totalPages}
                onClick={() => { setPage(page + 1); }}
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

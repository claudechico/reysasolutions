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
  const placeholder = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600';
  
  if (!property) {
    return placeholder;
  }

  const toUrl = (path: string | undefined | null) => {
    if (!path || typeof path !== 'string') return '';
    
    // Check for invalid CDN URLs (like cdn.example.com)
    if (path.includes('cdn.example.com') || path.includes('example.com')) {
      return '';
    }
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      // Validate URL before returning
      try {
        const url = new URL(path);
        // Reject invalid domains
        if (url.hostname.includes('example.com') || url.hostname === 'cdn.example.com') {
          return '';
        }
        return path;
      } catch {
        return '';
      }
    }
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

  if (Array.isArray(property.media) && property.media.length) {
    const first = property.media[0];
    if (typeof first === 'string') {
      candidates.push(first);
    } else if (first && (!first.media_type || first.media_type === 'image')) {
      candidates.push(first.media_url || first.path || first.url);
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

  return placeholder;
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

  const load = async (forPage = 1) => {
    setLoading(true);
    try {
      // If a search query exists, fetch a larger set and filter client-side
      if (query && query.trim().length > 0) {
        // use admin listings endpoint to ensure we retrieve all listings (including unapproved)
        const res: any = await adminListingsApi.list({ page: 1, limit: 1000 });
        console.log('[AdminManageProperties] Search API response:', res);
        const all = res?.properties || [];
        
        // Log each property's status-related fields for debugging
        console.log('[AdminManageProperties] All properties for search:', all.length);
        all.forEach((property: any, index: number) => {
          console.log(`[AdminManageProperties] Search Property ${index + 1}:`, {
            id: property.id,
            title: property.title,
            status: property.status,
            listing_type: property.listing_type,
            moderationStatus: property.moderationStatus,
            is_approved: property.is_approved,
            fullProperty: property
          });
        });
        
        const q = query.trim().toLowerCase();
        const filtered = all.filter((p: any) => {
          const title = String(p.title || '').toLowerCase();
          const agentName = String(
            (p?.agent && typeof p.agent === 'object' ? (p.agent.name || p.agent.full_name) : p?.agent) ||
            p?.profiles?.full_name || 
            (p.owner && typeof p.owner === 'object' ? (p.owner.name || p.owner.full_name) : p.owner) || 
            ''
          ).toLowerCase();
          return title.includes(q) || agentName.includes(q);
        });
        setTotal(filtered.length);
        const start = (forPage - 1) * limit;
        setProps(filtered.slice(start, start + limit));
        return;
      }

      // For admin view, use the admin listings endpoint which returns all listings for moderation
      const res: any = await adminListingsApi.list({ page: forPage, limit });
      console.log('[AdminManageProperties] API response:', res);
      
      if (res?.properties) {
        // Log each property's status-related fields for debugging
        console.log('[AdminManageProperties] Properties received:', res.properties.length);
        res.properties.forEach((property: any, index: number) => {
          console.log(`[AdminManageProperties] Property ${index + 1}:`, {
            id: property.id,
            title: property.title,
            status: property.status,
            listing_type: property.listing_type,
            moderationStatus: property.moderationStatus,
            is_approved: property.is_approved,
            fullProperty: property
          });
        });
        
        setProps(res.properties);
        setTotal(res.pagination?.total ?? res.total ?? (res.properties ? res.properties.length : 0));
      } else {
        console.log('[AdminManageProperties] No properties in response');
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
    const actionKey = `${id}-${approved ? 'approve' : 'decline'}`;
    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));
    try {
      let response;
      if (approved) {
        response = await adminListingsApi.approve(id);
      } else {
        response = await adminListingsApi.decline(id);
      }
      
      // Log response for debugging
      console.log(`${approved ? 'Approve' : 'Decline'} response:`, response);
      
      // Update local state with the property object from response if available
      const responseAny = response as any;
      if (responseAny?.property) {
        const updatedProperty = responseAny.property;
        console.log('Updated property from response:', updatedProperty);
        console.log('is_approved value:', updatedProperty.is_approved, 'type:', typeof updatedProperty.is_approved);
        console.log('status value:', updatedProperty.status);
        
        setProps((prev) =>
          prev.map((p) => {
            if (p.id === id) {
              const merged = { 
                ...p, 
                ...updatedProperty, // Merge all properties from response
                is_approved: updatedProperty.is_approved !== undefined ? updatedProperty.is_approved : (approved ? 1 : 0),
                status: updatedProperty.status || (approved ? 'approved' : 'declined')
              };
              console.log('Merged property state:', merged);
              console.log('isPropertyApproved check:', isPropertyApproved(merged));
              return merged;
            }
            return p;
          })
        );
      } else {
        // Fallback: update manually if response doesn't have property object
        setProps((prev) =>
          prev.map((p) =>
            p.id === id ? { 
              ...p, 
              is_approved: approved ? 1 : 0, 
              isApproved: approved,
              status: approved ? 'approved' : 'declined',
              availability_status: approved ? 'available' : p.availability_status
            } : p
          )
        );
      }
      
      // Show success message
      alert(`Property ${approved ? 'approved' : 'declined'} successfully!`);
      
      // Only reload if we didn't get the property from response
      // If we got it, we already updated the state, so no need to reload
      if (!responseAny?.property) {
        // Reload to sync with backend (with a small delay to ensure backend has updated)
        setTimeout(async () => {
          await load(page);
        }, 500);
      }
    } catch (e: any) {
      console.error(`${approved ? 'Approve' : 'Decline'} action failed:`, e);
      const errorMessage = e?.message || e?.body?.message || e?.body?.error || 'Unknown error';
      alert(`${approved ? 'Approve' : 'Decline'} failed: ${errorMessage}`);
      // Reload to get fresh data
      await load(page);
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[actionKey];
        return next;
      });
    }
  };

  const remove = async (id: string | number) => {
    const key = `${id}-remove`;
    if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const response = await adminListingsApi.remove(id);
      console.log('Delete response:', response);
      
      // Remove from local state immediately for better UX
      setProps((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      
      // Show success message
      alert('Property deleted successfully!');
      
      // Reload to sync with backend
      await load(page);
    } catch (e: any) {
      console.error('Delete failed:', e);
      const errorMessage = e?.message || e?.body?.message || e?.body?.error || 'Unknown error';
      alert('Delete failed: ' + errorMessage);
      // Reload to get fresh data
      await load(page);
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
        <div className="min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading properties...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-16 lg:pt-0 pb-6 sm:pb-8 lg:pb-12 space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-dark-blue-500" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t('admin.manageProperties.title')}</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Manage and moderate all property listings</p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('admin.manageProperties.searchPlaceholder')}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                />
              </div>
              <button 
                onClick={() => { setPage(1); load(1); }} 
                className="w-full sm:w-auto bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Search className="w-4 h-4" />
                <span>{t('admin.manageProperties.search')}</span>
              </button>
              {query && (
                <button 
                  onClick={() => { setQuery(''); setPage(1); load(1); }} 
                  className="w-full sm:w-auto bg-gray-100 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <X className="w-4 h-4" />
                  <span>{t('admin.manageProperties.clear')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Properties Table */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Property</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Agent</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Created</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {props.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                        <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-gray-600 font-medium">No properties found.</p>
                      </td>
                    </tr>
                  ) : (
                    props.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-start space-x-2 sm:space-x-4">
                            <div className="h-12 w-12 sm:h-16 sm:w-16 overflow-hidden rounded-lg bg-gray-100 flex-shrink-0">
                              <img
                                src={resolveImageUrl(p)}
                                alt={p.title}
                                className="h-12 w-12 sm:h-16 sm:w-16 object-cover"
                                onError={(e) => {
                                  const placeholder = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600';
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (target.src !== placeholder) {
                                    target.src = placeholder;
                                  }
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs sm:text-sm text-gray-900 mb-1 truncate">{p.title}</div>
                              <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-1 sm:mb-2">
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span className="truncate">{p.location || ''}{p.city ? `, ${p.city}` : ''}</span>
                              </div>
                              <div className="flex items-center text-xs sm:text-sm font-medium text-dark-blue-500">
                                <DollarSign className="w-3 h-3 mr-1 flex-shrink-0" />
                                <span>Tsh {formatPrice(p.price)}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="text-xs sm:text-sm text-gray-900 truncate max-w-[150px]">
                            {(p?.agent && typeof p.agent === 'object' ? (p.agent.name || p.agent.full_name) : p?.agent) ||
                             (p?.profiles?.full_name) || 
                             (p.owner && typeof p.owner === 'object' ? (p.owner.name || p.owner.full_name) : p.owner) || 
                             'N/A'}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          {(() => {
                            const isApproved = isPropertyApproved(p);
                            // Get moderationStatus or fallback to status
                            const moderationStatus = p.moderationStatus || p.status || (isApproved ? 'approved' : 'pending');
                            const statusText = String(moderationStatus).toLowerCase();
                            const isRejected = statusText === 'rejected' || statusText === 'declined';
                            
                            let badgeClass = 'bg-yellow-100 text-yellow-800';
                            let badgeText = t('admin.manageProperties.pending');
                            let badgeIcon = <Calendar className="w-3 h-3 mr-1" />;
                            
                            if (isApproved || statusText === 'approved') {
                              badgeClass = 'bg-green-100 text-green-800';
                              badgeText = t('admin.manageProperties.approved');
                              badgeIcon = <CheckCircle className="w-3 h-3 mr-1" />;
                            } else if (isRejected) {
                              badgeClass = 'bg-red-100 text-red-800';
                              badgeText = 'Rejected';
                              badgeIcon = <XCircle className="w-3 h-3 mr-1" />;
                            }
                            
                            return (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                                {badgeIcon}
                                {badgeText}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 hidden md:table-cell">{formatDate(p.created_at || p.createdAt || p.created)}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap gap-1">
                            <button
                              onClick={() => window.open(`/properties/${p.id}`, '_blank')}
                              className="p-1.5 sm:p-2 rounded-lg border border-light-blue-100 bg-light-blue-50 text-dark-blue-500 transition hover:border-blue-200 hover:bg-light-blue-100"
                              title="Preview"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            {(() => {
                              const isApproved = isPropertyApproved(p);
                              return !isApproved ? (
                                <>
                                  <button
                                    disabled={Boolean(actionLoading[`${p.id}-approve`])}
                                    onClick={() => setApproval(p.id, true)}
                                    className="flex items-center justify-center rounded-lg bg-green-50 px-1.5 sm:px-2 py-1.5 sm:py-2 text-green-600 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-70"
                                    title="Approve"
                                  >
                                    {actionLoading[`${p.id}-approve`] ? (
                                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                    )}
                                  </button>
                                  <button
                                    disabled={Boolean(actionLoading[`${p.id}-decline`])}
                                    onClick={() => setApproval(p.id, false)}
                                    className="flex items-center justify-center rounded-lg bg-yellow-50 px-1.5 sm:px-2 py-1.5 sm:py-2 text-yellow-600 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-70"
                                    title="Decline"
                                  >
                                    {actionLoading[`${p.id}-decline`] ? (
                                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                    )}
                                  </button>
                                </>
                              ) : null;
                            })()}
                            <button
                              disabled={Boolean(actionLoading[`${p.id}-remove`])}
                              onClick={() => remove(p.id)}
                              className="flex items-center justify-center rounded-lg bg-red-50 px-1.5 sm:px-2 py-1.5 sm:py-2 text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                              title="Delete"
                            >
                              {actionLoading[`${p.id}-remove`] ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-light-blue-500 outline-none text-sm"
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

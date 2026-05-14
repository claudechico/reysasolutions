import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Clock, XCircle, AlertCircle, Mail, Phone, FileText } from 'lucide-react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminSidebar from '../components/AdminSidebar';
import { adminAccountDeletionRequestsApi } from '../lib/api';
import { getFriendlyErrorMessage } from '../lib/errorUtils';

export default function AdminAccountDeletionRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await adminAccountDeletionRequestsApi.list({ status: 'pending' });
      setRequests(res?.requests || []);
    } catch (e) {
      // Keep page usable even if the request list fails
      console.error('Failed to load deletion requests', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approve = async (id: string | number) => {
    if (!confirm('Approve this deletion request? The user will be deleted.')) return;
    const noteInput = window.prompt('Optional admin note (visible in request history):', '') || '';
    const note = noteInput.trim().length > 0 ? noteInput.trim() : undefined;

    try {
      setActionLoadingId(id);
      await adminAccountDeletionRequestsApi.approve(id, { note });
      await load();
    } catch (e: any) {
      alert(getFriendlyErrorMessage(e, 'Failed to approve deletion request.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const decline = async (id: string | number) => {
    if (!confirm('Decline this deletion request? The user will NOT be deleted.')) return;
    const noteInput = window.prompt('Optional admin note (visible in request history):', '') || '';
    const note = noteInput.trim().length > 0 ? noteInput.trim() : undefined;

    try {
      setActionLoadingId(id);
      await adminAccountDeletionRequestsApi.decline(id, { note });
      await load();
    } catch (e: any) {
      alert(getFriendlyErrorMessage(e, 'Failed to decline deletion request.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const statusBadge = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'pending') return { className: 'bg-yellow-50 border-yellow-200 text-yellow-800', icon: <Clock className="w-5 h-5" /> };
    if (s === 'approved') return { className: 'bg-green-50 border-green-200 text-green-800', icon: <CheckCircle className="w-5 h-5" /> };
    return { className: 'bg-red-50 border-red-200 text-red-800', icon: <XCircle className="w-5 h-5" /> };
  };

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-72">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-6 lg:pt-0 pb-6 sm:pb-8 lg:pb-12 space-y-6 sm:space-y-8 lg:space-y-10">
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-dark-blue-500" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Account Deletion Requests
                </h1>
              </div>
              <p className="text-sm sm:text-base text-gray-600">Approve or decline users’ deletion requests.</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4" />
                <p className="text-gray-600">Loading deletion requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-xl border border-gray-100">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending requests</h3>
                <p className="text-gray-600">Users will appear here when they request account deletion.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((r) => {
                  const badge = statusBadge(r.status);
                  return (
                    <div key={r.id} className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="min-w-0">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${badge.className} mb-3`}>
                            {badge.icon}
                            <span className="ml-2">{String(r.status).toLowerCase()}</span>
                          </div>

                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-light-blue-500 to-dark-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                              {String(r.user?.name || 'U').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {r.user?.name || 'Unknown user'}
                              </div>
                              <div className="text-sm text-gray-600 truncate">
                                ID: {String(r.user?.id ?? r.userId ?? '').substring(0, 12)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 space-y-1 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4 text-gray-400" />
                              <span className="truncate">{r.user?.email || '-'}</span>
                            </div>
                            {r.user?.phoneNumber && (
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="truncate">{r.user.phoneNumber}</span>
                              </div>
                            )}
                          </div>

                          {r.reason && (
                            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center space-x-2 text-sm font-medium text-gray-800 mb-1">
                                <FileText className="w-4 h-4 text-dark-blue-500" />
                                <span>Reason</span>
                              </div>
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">{r.reason}</div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row md:flex-col gap-2 md:items-end">
                          <button
                            onClick={() => approve(r.id)}
                            disabled={actionLoadingId === r.id}
                            className="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            {actionLoadingId === r.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                            <span>{t('dashboard.approved') || 'Approve'}</span>
                          </button>

                          <button
                            onClick={() => decline(r.id)}
                            disabled={actionLoadingId === r.id}
                            className="bg-red-600 text-white px-5 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
                          >
                            {actionLoadingId === r.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            <span>{t('dashboard.rejected') || 'Decline'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}


import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../lib/api';
import { CheckCircle, Clock, Mail, User, AlertCircle } from 'lucide-react';

export default function AMA_Delete_Request_Page() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  useEffect(() => {
    // Keep empty fields; user fills them manually.
    setLoading(false);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setNeedsLogin(false);

    try {
      setSubmitting(true);
      const res: any = await usersApi.requestAccountDeletion({
        reason: reason.trim().length ? reason.trim() : undefined,
      });

      setSuccess(res?.message || 'Your request has been submitted to admin.');
      // After submitting, send user back to Profile so they can see updated status.
      setTimeout(() => navigate('/dashboard/profile'), 1500);
    } catch (e: any) {
      const msg = e?.message || 'Failed to submit request';
      if (e?.status === 401 || e?.status === 403) {
        setNeedsLogin(true);
        setError('Please login to submit a deletion request.');
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center bg-white rounded-2xl border border-gray-100 shadow-lg p-8">
            <Clock className="w-10 h-10 text-dark-blue-500 mx-auto mb-3" />
            <p className="text-gray-600">{t('profile.loading') || 'Loading...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Delete Account</h1>
              <p className="text-gray-600">
                You can request deletion of your account data. Admin approval is required.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard/profile')}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
            >
              Back
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-5">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="font-semibold text-gray-900 mb-2">Your details</div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span>Name</span>
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-800"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span>Email</span>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-800"
                  />
                </label>
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700">
              <span>Reason (optional)</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why are you leaving? (Admin review)"
                className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none min-h-[120px] bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg hover:from-red-600 hover:to-red-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Request Account Deletion</span>
              )}
            </button>
          </form>

          <div className="mt-5 text-xs text-gray-500">
            After you submit, the admin will review your request. If approved, your account will be deleted.
          </div>

          {needsLogin && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                Go to Login
              </button>
            </div>
          )}

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="font-semibold text-gray-900 mb-1">Privacy Policy</div>
            <div className="text-sm text-gray-700">
              Please read our privacy policy before submitting a deletion request.{' '}
              <button
                type="button"
                onClick={() => navigate('/privacy-policy')}
                className="text-dark-blue-500 font-medium hover:underline"
              >
                Open Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


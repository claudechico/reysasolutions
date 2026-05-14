import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function DeleteAccountInfo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // This page is intended for Play Store "data safety" compliance:
  // it must be publicly reachable via a stable URL, so we keep it static and simple.
  useEffect(() => {
    setLoading(false);
  }, []);

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Delete Account</h1>
          <p className="text-gray-600 mb-6">
            To request account deletion, please use the account deletion option inside the Reysa app.
            Admin approval is required before the account is deleted.
          </p>

          <div className="space-y-4 text-gray-700">
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div className="font-semibold text-gray-900 mb-1">Steps</div>
              <div className="text-sm">
                1) Open the Reysa app
                <br />
                2) Go to <span className="font-semibold">Profile</span>
                <br />
                3) Open <span className="font-semibold">Account Deletion</span>
                <br />
                4) Tap <span className="font-semibold">Request account deletion</span>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div className="font-semibold text-gray-900 mb-1">What happens next?</div>
              <div className="text-sm">
                Your request will be reviewed by the admin. If approved, your account will be deleted.
                If declined, you can submit a new request later.
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
              <div className="font-semibold text-gray-900 mb-1">Need help?</div>
              <div className="text-sm">
                Contact the admin using the in-app support option or email support at{' '}
                <span className="font-semibold">admin@reysasolutions.co.tz</span>.
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => navigate('/dashboard/profile')}
              className="flex-1 bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition disabled:opacity-50"
            >
              {t('nav.profile') || 'Go to Profile'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition"
            >
              Back to Home
            </button>
          </div>

          <p className="mt-5 text-xs text-gray-500">
            Note: Deletion requires admin approval and is processed after your request is submitted.
          </p>

          <div className="mt-4 text-xs text-gray-500">
            Privacy policy:{' '}
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
  );
}


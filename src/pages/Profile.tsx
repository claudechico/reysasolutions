import { useEffect, useState } from 'react';
import { usersApi } from '../lib/api';
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const me: any = await usersApi.getProfile();
        setForm({
          name: me.name || '',
          email: me.email || '',
          phoneNumber: me.phoneNumber || '',
        });
        setEmailVerified(!!me.isVerified || !!me.emailVerified);
        setPhoneVerified(!!me.phoneNumberVerified || !!me.phoneVerified || !!me.phone_verified);
      } catch (e: any) {
        setError(e?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { t } = useTranslation();

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
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('profile.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('profile.title')}</h1>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>
          )}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.email')}</label>
              <div className="flex items-center space-x-3">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {emailVerified ? (
                  <div className="flex items-center text-green-600 text-sm space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('profile.verified')}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600 text-sm space-x-1">{t('profile.notVerified')}</div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.phone')}</label>
              <div className="flex items-center space-x-3">
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
                {phoneVerified ? (
                  <div className="flex items-center text-green-600 text-sm space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{t('profile.verified')}</span>
                  </div>
                ) : (
                  <div className="flex items-center text-yellow-600 text-sm space-x-1">{t('profile.notVerified')}</div>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
              >
                {saving ? t('profile.saving') : t('profile.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}



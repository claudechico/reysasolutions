import { useEffect, useState } from 'react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import { usersApi } from '../lib/api';
import { Mail, Phone, ShieldCheck, KeyRound, UserCog, Activity, ArrowUpRight } from 'lucide-react';

export default function AdminProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res: any = await usersApi.getProfile();
      setProfile(res);
      setForm({ name: res?.name || '', email: res?.email || '' });
    } catch (e) { console.error('Failed to load profile', e); }
    finally { setLoading(false); }
  };

  const handleChange = (k: 'name' | 'email') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [k]: e.target.value }));
  };

  const save = async () => {
    try {
      setSaving(true);
      await usersApi.updateProfile({ name: (form.name||'').trim(), email: (form.email||'').trim() });
      alert('Profile updated');
      setEditing(false);
      await load();
    } catch (err: any) {
      console.error('Update failed', err);
      alert('Update failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-[200px] p-8 flex items-center justify-center">Loading profile...</div>;

  const initials = (profile?.name || 'A').split(' ').map((s: string) => s[0]).slice(0,2).join('').toUpperCase();

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-dark-blue-600 via-indigo-600 to-purple-600 p-8 sm:p-10 text-white shadow-2xl mb-8">
          <div className="hidden sm:block absolute -top-6 -right-10 opacity-20 w-40 h-40 rounded-full bg-white/15 blur-xl -z-10" />
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide text-white shadow-lg">
                  <UserCog className="h-5 w-5" />
                  Admin account
              </span>
                <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-white">Admin Profile</h1>
                <p className="mt-3 max-w-3xl text-base text-white/95 leading-relaxed">
                Manage personal details and review your administrative footprint. Profile details are surfaced for approvals, audits, and support escalations.
              </p>
            </div>
              <div className="rounded-2xl bg-white/20 backdrop-blur-md p-6 shadow-lg border border-white/20">
                <div className="flex items-center gap-2 text-base font-semibold text-white mb-4">
                  <Activity className="h-5 w-5" />
                Recent activity snapshot
              </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="uppercase tracking-wide text-white/70 text-xs mb-1">Last login</p>
                    <p className="font-semibold text-white text-base">
                    {profile?.last_login ? new Date(profile.last_login).toLocaleString() : '—'}
                  </p>
                </div>
                <div>
                    <p className="uppercase tracking-wide text-white/70 text-xs mb-1">Role</p>
                    <p className="font-semibold text-white text-base">{profile?.role || 'Admin'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-dark-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-6">{initials}</div>
                <h2 className="text-xl font-bold text-gray-900">{profile?.name}</h2>
                <p className="text-sm text-gray-600 mt-2 font-medium">{profile?.role || 'Admin'}</p>
                <div className="mt-8 w-full space-y-4">
                  <div className="flex items-start gap-4 rounded-xl border-2 border-gray-200 bg-gray-50 px-5 py-4 hover:border-blue-300 transition-colors">
                    <Mail className="h-5 w-5 text-dark-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-left flex-1">
                      <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">Email</p>
                      <p className="break-words font-semibold text-gray-900 text-sm">{profile?.email || '—'}</p>
        </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-xl border-2 border-gray-200 bg-gray-50 px-5 py-4 hover:border-blue-300 transition-colors">
                    <Phone className="h-5 w-5 text-dark-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-left flex-1">
                      <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-1">Phone</p>
                      <p className="font-semibold text-gray-900 text-sm">{profile?.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Account details</h3>
                  <div className="flex items-center space-x-3">
                  {!editing ? (
                      <button onClick={() => setEditing(true)} className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition shadow-lg">Edit Profile</button>
                  ) : (
                    <>
                        <button disabled={saving} onClick={save} className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
                        <button disabled={saving} onClick={() => { setEditing(false); setForm({ name: profile?.name, email: profile?.email }); }} className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">Cancel</button>
                    </>
                  )}
                </div>
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full name</label>
                    <input value={form.name} onChange={handleChange('name')} disabled={!editing} className={`mt-1 block w-full rounded-lg border-2 ${editing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'border-transparent bg-gray-100'} px-4 py-3 text-gray-900 font-medium`} />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email address</label>
                    <input value={form.email} onChange={handleChange('email')} disabled={!editing} className={`mt-1 block w-full rounded-lg border-2 ${editing ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'border-transparent bg-gray-100'} px-4 py-3 text-gray-900 font-medium`} />
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h4 className="text-lg font-bold text-gray-900 mb-3">Activity</h4>
                  <p className="text-sm text-gray-600 mb-6">Recent admin actions and audit logs will appear here. For now this area shows basic information about your account.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center">
                      <div className="text-sm font-semibold text-gray-600 mb-2">Pending approvals</div>
                      <div className="text-2xl font-bold text-gray-900">—</div>
              </div>
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center">
                      <div className="text-sm font-semibold text-gray-600 mb-2">Properties managed</div>
                      <div className="text-2xl font-bold text-gray-900">—</div>
                  </div>
                    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center">
                      <div className="text-sm font-semibold text-gray-600 mb-2">Recent logins</div>
                      <div className="text-lg font-bold text-gray-900">{profile?.last_login ? new Date(profile.last_login).toLocaleDateString() : '—'}</div>
                  </div>
                </div>
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <ShieldCheck className="h-6 w-6 text-dark-blue-600 flex-shrink-0" />
                  <div>
                      <h4 className="text-lg font-bold text-gray-900">Access & security</h4>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      Your admin privileges enable property approvals and user management.
                    </p>
                  </div>
                </div>
                  <div className="mt-6 space-y-3">
                    <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="font-bold text-gray-800 text-sm mb-1">Role</p>
                      <p className="text-gray-700 font-semibold">{profile?.role || 'Admin'}</p>
                  </div>
                    <div className="rounded-xl border-2 border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="font-bold text-gray-800 text-sm mb-1">Two-factor authentication</p>
                      <p className="text-gray-700 font-semibold">{profile?.mfa_enabled ? 'Enabled' : 'Not enabled'}</p>
                  </div>
                </div>
              </div>

                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                  <div className="flex items-start gap-4 mb-4">
                    <KeyRound className="h-6 w-6 text-dark-blue-600 flex-shrink-0" />
                  <div>
                      <h4 className="text-lg font-bold text-gray-900">Support escalation</h4>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                      Need help? Our support team can assist with access or audit inquiries.
                    </p>
                  </div>
                </div>
                  <div className="mt-6 space-y-3 text-sm">
                    <p className="text-gray-700"><span className="font-semibold">24/7 admin hotline:</span> <span className="font-bold text-dark-blue-600">+255 672 232 334</span></p>
                    <p className="text-gray-700"><span className="font-semibold">Support email:</span> <span className="font-bold text-dark-blue-600">support@example.com</span></p>
                  <button
                    onClick={() => window.open('mailto:support@example.com', '_blank')}
                      className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  >
                    Contact support
                      <ArrowUpRight className="h-4 w-4" />
                  </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

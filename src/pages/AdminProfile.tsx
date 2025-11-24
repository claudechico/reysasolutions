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
      {/* add top padding so fixed navbar doesn't overlap this page */}
      <div className="max-w-5xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-24 sm:pt-28 md:pt-24 pb-6 sm:pb-10">
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-r from-dark-blue-500 via-dark-blue-600 to-violet-600 p-4 sm:p-6 text-white shadow-xl">
          <div className="hidden sm:block absolute -top-6 -right-10 opacity-20 w-40 h-40 rounded-full bg-white/15 blur-xl -z-10" />
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-2 sm:px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                <UserCog className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs">Admin account</span>
              </span>
              <h1 className="mt-2 sm:mt-3 text-xl sm:text-2xl lg:text-3xl font-semibold">Admin Profile</h1>
              <p className="mt-2 max-w-3xl text-xs sm:text-sm text-white/80">
                Manage personal details and review your administrative footprint. Profile details are surfaced for approvals, audits, and support escalations.
              </p>
            </div>
            <div className="rounded-xl sm:rounded-2xl bg-white/15 p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/80">
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                Recent activity snapshot
              </div>
              <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-2 sm:gap-3 text-xs text-white/70">
                <div>
                  <p className="uppercase tracking-wide text-white/60">Last login</p>
                  <p className="mt-1 font-medium text-white">
                    {profile?.last_login ? new Date(profile.last_login).toLocaleString() : '—'}
                  </p>
                </div>
                <div>
                  <p className="uppercase tracking-wide text-white/60">Role</p>
                  <p className="mt-1 font-medium text-white">{profile?.role || 'Admin'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

  <div className="-mt-4 sm:-mt-6 md:-mt-8 lg:-mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-light-blue-500 to-dark-blue-600 flex items-center justify-center text-xl sm:text-2xl md:text-3xl font-bold text-white shadow-md">{initials}</div>
              <h2 className="mt-3 sm:mt-4 text-base sm:text-lg font-bold text-gray-900">{profile?.name}</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">{profile?.role || 'Admin'}</p>
              <div className="mt-4 sm:mt-6 w-full space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                  <Mail className="h-4 w-4 text-light-blue-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                    <p className="mt-0.5 break-words font-medium text-gray-900">{profile?.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
                  <Phone className="h-4 w-4 text-light-blue-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
                    <p className="mt-0.5 font-medium text-gray-900">{profile?.phoneNumber || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Account details</h3>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  {!editing ? (
                    <button onClick={() => setEditing(true)} className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg text-sm sm:text-base">Edit Profile</button>
                  ) : (
                    <>
                      <button disabled={saving} onClick={save} className="flex-1 sm:flex-none px-4 py-2 bg-dark-blue-500 text-white rounded-lg text-sm sm:text-base">{saving ? 'Saving...' : 'Save'}</button>
                      <button disabled={saving} onClick={() => { setEditing(false); setForm({ name: profile?.name, email: profile?.email }); }} className="flex-1 sm:flex-none px-4 py-2 border rounded-lg text-sm sm:text-base">Cancel</button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-4 sm:mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-sm text-gray-600">Full name</label>
                  <input value={form.name} onChange={handleChange('name')} disabled={!editing} className={`mt-1 block w-full rounded-lg border ${editing ? 'border-gray-300 focus:ring-2 focus:ring-light-blue-500' : 'border-transparent bg-gray-50'} px-4 py-2`} />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email address</label>
                  <input value={form.email} onChange={handleChange('email')} disabled={!editing} className={`mt-1 block w-full rounded-lg border ${editing ? 'border-gray-300 focus:ring-2 focus:ring-light-blue-500' : 'border-transparent bg-gray-50'} px-4 py-2`} />
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900">Activity</h4>
                <p className="mt-2 text-sm text-gray-600">Recent admin actions and audit logs will appear here. For now this area shows basic information about your account.</p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-sm text-gray-500">Pending approvals</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">—</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-sm text-gray-500">Properties managed</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">—</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <div className="text-sm text-gray-500">Recent logins</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">{profile?.last_login ? new Date(profile.last_login).toLocaleString() : '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-dark-blue-500" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Access & security</h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Your admin privileges enable property approvals and user management.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 text-xs text-gray-500">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="font-medium text-gray-700">Role</p>
                    <p className="mt-1 text-gray-600">{profile?.role || 'Admin'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
                    <p className="font-medium text-gray-700">Two-factor authentication</p>
                    <p className="mt-1 text-gray-600">{profile?.mfa_enabled ? 'Enabled' : 'Not enabled'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <KeyRound className="h-5 w-5 text-dark-blue-500" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Support escalation</h4>
                    <p className="mt-1 text-xs text-gray-500">
                      Need help? Our support team can assist with access or audit inquiries.
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-xs text-gray-500">
                  <p>24/7 admin hotline: <span className="font-semibold text-gray-700">+255 672 232 334</span></p>
                  <p>Support email: <span className="font-semibold text-gray-700">support@example.com</span></p>
                  <button
                    onClick={() => window.open('mailto:support@example.com', '_blank')}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-light-blue-500 hover:text-dark-blue-500"
                  >
                    Contact support
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

import { useEffect, useState } from 'react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminSidebar from '../components/AdminSidebar';
import { adminUsersApi } from '../lib/api';
import { useTranslation } from 'react-i18next';
import { Search, X, Trash2, UserPlus, Users, Mail, Phone, Calendar, Download, User } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminManageUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', phoneNumber: '', password: '', role: 'owner' });

  useEffect(() => { loadUsers(page); }, [page]);

  const loadUsers = async (forPage = 1) => {
    setLoading(true);
    try {
      if (query && query.trim().length > 0) {
        // fetch more and filter client-side
        const res: any = await adminUsersApi.list({ page: 1, limit: 1000 });
        const all = res?.users || [];
        const q = query.trim().toLowerCase();
        const filtered = all.filter((u: any) => (String(u.name || '') + ' ' + String(u.email || '') + ' ' + String(u.role || '')).toLowerCase().includes(q));
        setTotal(filtered.length);
        const start = (forPage - 1) * limit;
        setUsers(filtered.slice(start, start + limit));
        return;
      }

  const res: any = await adminUsersApi.list({ page: forPage, limit });
      if (res?.users) {
        setUsers(res.users);
        setTotal(res.pagination?.total ?? res.users.length ?? 0);
      } else {
        setUsers([]);
        setTotal(0);
      }
    } catch (e) {
      console.error('Failed to load users', e);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const removeUser = async (id: string | number) => {
    if (!confirm('Delete this user?')) return;
    try {
  await adminUsersApi.remove(id);
      // reload current page
      loadUsers(page);
    } catch (e) {
      console.error('Delete failed', e);
      alert('Failed to delete user');
    }
  };

  const createUser = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      alert('Name, email and password are required');
      return;
    }
    try {
      setLoading(true);
  await adminUsersApi.create({ name: newUser.name.trim(), email: newUser.email.trim(), password: newUser.password, role: newUser.role });
      setNewUser({ name: '', email: '', phoneNumber: '', password: '', role: 'owner' });
      setAdding(false);
      loadUsers(1);
    } catch (err: any) {
      console.error('Create user failed', err);
      alert(err?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const cols = ['id', 'name', 'email', 'role'];
    const csv = [cols.join(',')].concat(users.map(u => cols.map(c => JSON.stringify(u[c] ?? '')).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const { t } = useTranslation();

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'agent': return 'bg-light-blue-100 text-dark-blue-700';
      case 'owner': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-16 lg:pt-0 pb-6 sm:pb-8 lg:pb-12 space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Header Section */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-dark-blue-500" />
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{t('admin.manageUsers.title')}</h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Manage user accounts and permissions</p>
          </div>

          {/* Search and Actions Bar */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, email or role"
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                />
              </div>
              <button
                onClick={() => setAdding(!adding)}
                className="w-full sm:w-auto bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition shadow-lg shadow-green-600/30 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <UserPlus className="w-4 h-4" />
                <span>{adding ? t('admin.manageUsers.cancel') : t('admin.manageUsers.addUser')}</span>
              </button>
              {query && (
                <button
                  onClick={() => { setQuery(''); setPage(1); loadUsers(1); }}
                  className="w-full sm:w-auto bg-gray-100 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-200 transition flex items-center justify-center space-x-2 text-sm sm:text-base"
                >
                  <X className="w-4 h-4" />
                  <span>{t('admin.manageProperties.clear')}</span>
                </button>
              )}
              <button
                onClick={exportCsv}
                className="w-full sm:w-auto bg-gradient-to-r from-dark-blue-600 to-dark-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-dark-blue-700 hover:to-indigo-800 transition shadow-lg shadow-dark-blue-600/30 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{t('admin.manageUsers.exportCsv')}</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>

          {/* Add User Form */}
          {adding && (
            <form onSubmit={createUser} className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center space-x-2">
                <UserPlus className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                <span>Create New User</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <input
                  required
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Full name"
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                />
                <input
                  required
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Email"
                  type="email"
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                />
                <input
                  value={newUser.phoneNumber}
                  onChange={e => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  placeholder="Phone"
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                />
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                >
                  <option value="owner">Owner</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
                <input
                  required
                  value={newUser.password}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Password"
                  type="password"
                  className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none sm:col-span-2 text-sm sm:text-base"
                />
                <div className="sm:col-span-2 lg:col-span-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition shadow-lg shadow-green-600/30 text-sm sm:text-base"
                  >
                    Create User
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAdding(false); setNewUser({ name: '', email: '', phoneNumber: '', password: '', role: 'owner' }); }}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:bg-gray-200 transition text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto -mx-3 sm:mx-0">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">User</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden md:table-cell">Phone</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 sm:px-6 py-8 sm:py-12 text-center">
                        <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-sm sm:text-base text-gray-600 font-medium">No users found.</p>
                      </td>
                    </tr>
                  ) : (
                    users.map(u => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-light-blue-500 to-dark-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {(u.name || 'U').slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{u.name}</div>
                              <div className="text-xs text-gray-500">ID: {String(u.id).substring(0, 8)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="flex items-center text-xs sm:text-sm text-gray-900">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-[150px] sm:max-w-none">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400 flex-shrink-0" />
                            <span>{u.phoneNumber || '-'}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(u.role)}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
                          <div className="flex items-center text-xs sm:text-sm text-gray-600">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-400 flex-shrink-0" />
                            <span>{u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : '-'}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <button
                            onClick={() => removeUser(u.id)}
                            className="p-1.5 sm:p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition flex items-center space-x-1"
                            title="Delete User"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm font-medium hidden sm:inline">Delete</span>
                          </button>
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
              Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> — <span className="font-semibold">{total}</span> total users
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
                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); loadUsers(1); }}
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


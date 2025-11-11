import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  CreditCard,
  BarChart3,
  FileText,
  Shield,
  User,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/properties', label: 'Properties', icon: Building2 },
    { path: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { path: '/admin/payments', label: 'Payments', icon: CreditCard },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/cms', label: 'CMS', icon: FileText },
    { path: '/admin/moderation', label: 'Moderation', icon: Shield },
    { path: '/admin/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl z-40 flex flex-col">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Admin Panel</h2>
            <p className="text-xs text-gray-400">Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
            {(user as any)?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{(user as any)?.name || 'Admin'}</p>
            <p className="text-xs text-gray-400 truncate">{(user as any)?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-gray-400'}`} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}


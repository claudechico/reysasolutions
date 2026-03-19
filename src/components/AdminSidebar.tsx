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
  Menu,
  X,
  Tag,
  Megaphone,
  Gavel,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    // Special handling for advertisements routes
    if (path === '/admin/advertisements/new') {
      return location.pathname.startsWith('/admin/advertisements') || location.pathname.startsWith('/dashboard/advertisements');
    }
    // Special handling for auctions routes
    if (path === '/admin/auctions/new') {
      return location.pathname.startsWith('/admin/auctions') || location.pathname.startsWith('/dashboard/auctions');
    }
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/properties', label: 'Properties', icon: Building2 },
    { path: '/admin/categories', label: 'Categories', icon: Tag },
    { path: '/admin/advertisements/new', label: 'Advertisements', icon: Megaphone },
    { path: '/admin/auctions/new', label: 'Auctions', icon: Gavel },
    { path: '/admin/bookings', label: 'Bookings', icon: Calendar },
    { path: '/admin/payments', label: 'Payments', icon: CreditCard },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/cms', label: 'CMS', icon: FileText },
    { path: '/admin/moderation', label: 'Moderation', icon: Shield },
    { path: '/admin/profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed z-50 p-2.5 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg shadow-xl hover:shadow-2xl transition-all"
        style={{ 
          top: 'calc(var(--app-nav-height, 80px) + 1rem)',
          left: '1rem'
        }}
      >
        {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
        <div
          className={`fixed left-0 w-72 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl z-40 flex flex-col transition-transform duration-300 border-r border-gray-700/50 ${
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:fixed`}
          style={{ top: 'var(--app-nav-height)', height: 'calc(100% - var(--app-nav-height))' }}
        >
      {/* User Info */}
      <div className="px-4 py-4 border-b border-gray-700/50 bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-light-blue-500 to-dark-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg flex-shrink-0 ring-2 ring-white/20">
            {(user as any)?.name?.charAt(0)?.toUpperCase() || (user as any)?.email?.charAt(0)?.toUpperCase() || 'A'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">
              {(user as any)?.name || (user as any)?.email}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {(user as any)?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                active
                  ? 'bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white shadow-lg shadow-dark-blue-500/30'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 ${active ? 'text-white' : 'text-gray-400 group-hover:text-white group-hover:scale-110'}`} />
              <span className="font-medium text-sm">{item.label}</span>
              {active && <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out Button */}
      <div className="p-4 border-t border-gray-700/50 bg-gray-900/50">
        <button
          onClick={() => {
            setMobileMenuOpen(false);
            handleSignOut();
          }}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-700 hover:text-white transition-all duration-200 hover:shadow-lg hover:shadow-red-600/30 font-medium text-sm group"
        >
          <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
          <span>{t('nav.signOut')}</span>
        </button>
      </div>
    </div>
    </>
  );
}






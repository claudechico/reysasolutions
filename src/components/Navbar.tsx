import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Menu, X, LogOut, LayoutDashboard, Heart, Calendar, Phone, Globe, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  // Guard against missing AuthProvider to avoid runtime crash during partial renders/tests.
  let user: unknown = null;
  let signOut: (() => Promise<void>) | undefined = undefined;
  try {
    const auth = useAuth();
    user = auth.user;
    signOut = auth.signOut;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: unknown) {
    // If AuthProvider is not present, don't crash — fallback to unauthenticated state.
    // This can happen in isolated component previews or tests.
    // eslint-disable-next-line no-console
    console.warn('AuthProvider missing: Navbar rendering without auth context');
    user = null;
    signOut = async () => {};
  }
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const role = String(user?.role || '').toLowerCase();
  const isActive = (path: string) => location.pathname === path;

  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const setVar = () => {
      const h = headerRef.current?.offsetHeight || 0;
      try { document.documentElement.style.setProperty('--app-nav-height', `${h}px`); } catch (e) {}
    };
    setVar();
    window.addEventListener('resize', setVar);
    return () => window.removeEventListener('resize', setVar);
  }, []);

  const { t, i18n } = useTranslation();
  const [lang, setLang] = useState<string>(i18n.language || 'en');

  useEffect(() => {
    // Sync language state when i18n language changes
    setLang(i18n.language || 'en');
  }, [i18n.language]);

  const switchLang = (l: string) => {
    i18n.changeLanguage(l);
    try { localStorage.setItem('app_lang', l); } catch { /* empty */ }
    setLang(l);
  };

  return (
    <header ref={headerRef} className="fixed top-0 left-0 right-0 z-50">
      {/* Top info strip */}
      <div className="w-full bg-dark-blue-500 text-white">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-1.5 sm:py-2 flex flex-wrap items-center justify-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            <span className="whitespace-nowrap truncate max-w-[150px] sm:max-w-none">{t('top.address')}</span>
          </div>

          <div className="hidden sm:flex items-center text-sm text-white/90">
            <Phone className="w-4 h-4 mr-2" />
            <a href="tel:+255672232334" className="font-medium">{t('top.phone')}</a>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-white/90">
            <div className="hidden md:flex items-center space-x-2">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
              <span>{t('top.hours')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
              <select value={lang} onChange={(e) => switchLang(e.target.value)} className="bg-transparent text-white text-xs sm:text-sm border-none outline-none cursor-pointer">
                <option style={{color:'black'}} value="en">EN</option>
                <option  style={{color:'black'}}  value="sw">SW</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="w-full bg-gradient-to-r from-dark-blue-50 via-light-blue-50 to-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/images/logo.jpg" 
                alt="ReysaSolution Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain rounded-lg"
              />
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-dark-blue-500 to-dark-blue-700 bg-clip-text text-transparent">
                ReysaSolution
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <Link 
                to="/" 
                className={`px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                  isActive('/') 
                    ? 'text-dark-blue-600 bg-light-blue-50' 
                    : 'text-gray-700 hover:text-dark-blue-500 hover:bg-gray-50'
                }`}
              >
                {t('nav.home')}
              </Link>
              <Link 
                to="/properties" 
                className={`px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                  isActive('/properties') 
                    ? 'text-dark-blue-600 bg-light-blue-50' 
                    : 'text-gray-700 hover:text-dark-blue-500 hover:bg-gray-50'
                }`}
              >
                {t('nav.properties')}
              </Link>
              <Link 
                to="/about" 
                className={`px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                  isActive('/about') 
                    ? 'text-dark-blue-600 bg-light-blue-50' 
                    : 'text-gray-700 hover:text-dark-blue-500 hover:bg-gray-50'
                }`}
              >
                {t('nav.about')}
              </Link>
              <Link 
                to="/contact" 
                className={`px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                  isActive('/contact') 
                    ? 'text-dark-blue-600 bg-light-blue-50' 
                    : 'text-gray-700 hover:text-dark-blue-500 hover:bg-gray-50'
                }`}
              >
                {t('nav.contact')}
              </Link>
              {/* Show Subscriptions link only to non-admin users */}
              {role !== 'admin' && (
                <Link 
                  to="/subscriptions" 
                  className={`px-3 py-2 rounded-lg transition-all font-medium text-sm ${
                    isActive('/subscriptions') 
                      ? 'text-dark-blue-600 bg-light-blue-50' 
                      : 'text-gray-700 hover:text-dark-blue-500 hover:bg-gray-50'
                  }`}
                >
                  {t('nav.subscriptions')}
                </Link>
              )}
            </div>

            <div className="hidden md:flex items-center space-x-3">
              {user ? (
                <>
                  {/* Only users with role "users" can access favorites and bookings */}
                  {role === 'users' && (
                    <>
                      <Link 
                        to="/favorites" 
                        className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all font-medium ${
                          isActive('/favorites') 
                            ? 'bg-light-blue-50 text-dark-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-dark-blue-500 hover:bg-gray-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isActive('/favorites') ? 'fill-current' : ''}`} />
                        <span className="text-sm">{t('nav.favorites')}</span>
                      </Link>
                      <Link 
                        to="/dashboard/bookings" 
                        className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all font-medium ${
                          isActive('/dashboard/bookings') 
                            ? 'bg-light-blue-50 text-dark-blue-600 shadow-sm' 
                            : 'text-gray-600 hover:text-dark-blue-500 hover:bg-gray-50'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">{t('nav.bookings')}</span>
                      </Link>
                    </>
                  )}
                  <Link 
                    to="/dashboard" 
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all font-medium ${
                      isActive('/dashboard') 
                        ? 'bg-light-blue-50 text-dark-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-dark-blue-500 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-sm">{t('nav.dashboard')}</span>
                  </Link>
                  <div className="h-6 w-px bg-gray-300 mx-1"></div>
                  <button 
                    onClick={handleSignOut} 
                    className="flex items-center space-x-2 bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-4 py-2 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition-all shadow-md hover:shadow-lg font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-dark-blue-500 transition font-medium px-3 py-2 rounded-lg hover:bg-gray-50">{t('nav.login')}</Link>
                  <Link to="/register" className="bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-2.5 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30 font-medium">{t('nav.getStarted')}</Link>
                </>
              )}
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition">
              {mobileMenuOpen ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
            <div className="px-4 py-4 space-y-1">
              <Link 
                to="/" 
                onClick={() => setMobileMenuOpen(false)} 
                className={`block px-4 py-2.5 rounded-lg transition font-medium ${
                  isActive('/') 
                    ? 'bg-light-blue-50 text-dark-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('nav.home')}
              </Link>
              <Link 
                to="/properties" 
                onClick={() => setMobileMenuOpen(false)} 
                className={`block px-4 py-2.5 rounded-lg transition font-medium ${
                  isActive('/properties') 
                    ? 'bg-light-blue-50 text-dark-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('nav.properties')}
              </Link>
              <Link 
                to="/about" 
                onClick={() => setMobileMenuOpen(false)} 
                className={`block px-4 py-2.5 rounded-lg transition font-medium ${
                  isActive('/about') 
                    ? 'bg-light-blue-50 text-dark-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('nav.about')}
              </Link>
              <Link 
                to="/contact" 
                onClick={() => setMobileMenuOpen(false)} 
                className={`block px-4 py-2.5 rounded-lg transition font-medium ${
                  isActive('/contact') 
                    ? 'bg-light-blue-50 text-dark-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('nav.contact')}
              </Link>
              {role !== 'admin' && (
                <Link 
                  to="/subscriptions" 
                  onClick={() => setMobileMenuOpen(false)} 
                  className={`block px-4 py-2.5 rounded-lg transition font-medium ${
                    isActive('/subscriptions') 
                      ? 'bg-light-blue-50 text-dark-blue-600' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t('nav.subscriptions')}
                </Link>
              )}

              {user ? (
                <>
                  {/* Only users with role "users" can access favorites and bookings */}
                  {String(user?.role || '').toLowerCase() === 'users' && (
                    <>
                      <Link 
                        to="/favorites" 
                        onClick={() => setMobileMenuOpen(false)} 
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition ${
                          isActive('/favorites') 
                            ? 'bg-light-blue-50 text-dark-blue-600 font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${isActive('/favorites') ? 'fill-current' : ''}`} />
                        <span>{t('nav.favorites')}</span>
                      </Link>
                      <Link 
                        to="/dashboard/bookings" 
                        onClick={() => setMobileMenuOpen(false)} 
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition ${
                          isActive('/dashboard/bookings') 
                            ? 'bg-light-blue-50 text-dark-blue-600 font-medium' 
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        <span>{t('nav.bookings')}</span>
                      </Link>
                    </>
                  )}
                  <Link 
                    to="/dashboard" 
                    onClick={() => setMobileMenuOpen(false)} 
                    className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition ${
                      isActive('/dashboard') 
                        ? 'bg-light-blue-50 text-dark-blue-600 font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('nav.dashboard')}</span>
                  </Link>
                  <div className="border-t border-gray-200 my-2"></div>
                  <button 
                    onClick={() => { handleSignOut(); setMobileMenuOpen(false); }} 
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-md font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition">  {t('nav.login')}</Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2 rounded-lg bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white hover:from-dark-blue-600 hover:to-dark-blue-700 transition text-center">{t('nav.getStarted')}</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

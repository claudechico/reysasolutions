import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res: any = await signIn(email, password);
    try {
      // eslint-disable-next-line no-console
      console.debug('[Login] signIn result:', res, 'local auth_user:', localStorage.getItem('auth_user'));
    } catch {}
    if (res && res.error) {
      const msg = typeof res.error === 'string' ? res.error : (res.error.message || String(res.error));
      setError(msg);
      setLoading(false);
      return;
    }

    // If user is admin, redirect to admin dashboard (case-insensitive)
    const authUser = res?.user || JSON.parse(localStorage.getItem('auth_user') || 'null');
    const role = authUser ? String(authUser.role || '').toLowerCase() : '';
    if (role === 'admin') {
      setLoading(false);
      navigate('/admin');
    } else {
      setLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-2xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/images/logo.jpg" 
              alt="ReysaSolution Logo" 
              className="h-16 w-16 sm:h-20 sm:w-20 object-contain rounded-lg"
            />
          </div>
          <p className="text-gray-600">{t('auth.signInToAccount')}</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-10 lg:p-12">
            {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3 animate-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-800 text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('auth.emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder={t('auth.placeholderEmail')}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder={t('auth.placeholderPassword')}
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-dark-blue-500 hover:text-dark-blue-600 font-medium transition-colors duration-200 hover:underline"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-dark-blue-500 via-dark-blue-600 to-dark-blue-600 text-white px-8 py-4 rounded-xl hover:from-dark-blue-600 hover:via-dark-blue-700 hover:to-dark-blue-700 transition-all duration-300 shadow-lg shadow-dark-blue-500/30 hover:shadow-xl hover:shadow-dark-blue-500/40 font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{t('auth.signingIn')}</span>
                  </>
                ) : (
                  <span>{t('auth.signIn')}</span>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600">
                {t('auth.dontHaveAccount')}{' '}
                <Link 
                  to="/register" 
                  className="text-dark-blue-500 hover:text-dark-blue-600 font-semibold transition-colors duration-200 hover:underline"
                >
                  {t('auth.signUp')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

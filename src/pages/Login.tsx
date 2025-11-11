import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Mail, Lock, AlertCircle } from 'lucide-react';
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
  <div className="min-h-screen pt-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Reysasolutions
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.welcomeBack')}</h2>
            <p className="text-gray-600">{t('auth.signInToAccount')}</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.emailAddress')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t('auth.placeholderEmail')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t('auth.placeholderPassword')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                {t('auth.signUp')}
              </Link>
            </p>
            <p className="text-center mt-4">
              <a href="/forgot-password" className="text-blue-600 hover:underline text-sm">{t('auth.forgotPassword')}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

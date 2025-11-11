import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'agent' | 'owner' | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Role must be either "agent" or "owner". If not provided, send undefined/null 
    // so backend defaults to "users"
    const finalRole = role === 'agent' || role === 'owner' ? role : undefined;

    const { error } = await signUp({
      name: fullName,
      email,
      phoneNumber,
      password,
      role: finalRole,
    });

    if (error) {
      setError(typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : String(error));
      setLoading(false);
    } else {
      navigate('/verify-otp');
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('register.createAccount')}</h2>
            <p className="text-gray-600">{t('register.joinUs')}</p>
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
                {t('register.fullName')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t('register.placeholderFullName')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.emailAddress')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t('register.placeholderEmail')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.phoneNumber')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t('register.placeholderPhone')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('register.accountType')}</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'agent' | 'owner' | '')}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select Account Type (defaults to users)</option>
                <option value="agent">{t('register.agent')}</option>
                <option value="owner">{t('register.owner')}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">If not selected, will default to "users"</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t('register.placeholderPassword')}
                />
              </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('register.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={t('register.placeholderConfirmPassword')}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('register.creatingAccount') : t('register.createAccountBtn')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('register.alreadyHaveAccount')}{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                {t('register.signIn')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, AlertCircle, Phone, Building2, UserCircle, Loader2 } from 'lucide-react';
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
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{t('register.createAccount')}</h1>
          <p className="text-gray-600">{t('register.joinUs')}</p>
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
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('register.fullName')}
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder={t('register.placeholderFullName')}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('register.emailAddress')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder={t('register.placeholderEmail')}
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('register.phoneNumber')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder={t('register.placeholderPhone')}
                  />
                </div>
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('register.accountType')}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                    {role === 'agent' ? (
                      <Building2 className="w-5 h-5 text-gray-400" />
                    ) : role === 'owner' ? (
                      <UserCircle className="w-5 h-5 text-gray-400" />
                    ) : (
                      <User className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as 'agent' | 'owner' | '')}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white appearance-none cursor-pointer"
                  >
                    <option value="">Select Account Type (defaults to users)</option>
                    <option value="agent">{t('register.agent')}</option>
                    <option value="owner">{t('register.owner')}</option>
                  </select>
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">If not selected, will default to "users"</p>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('register.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder={t('register.placeholderPassword')}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('register.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 outline-none transition-all duration-200 bg-gray-50 hover:bg-white"
                    placeholder={t('register.placeholderConfirmPassword')}
                  />
                </div>
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
                    <span>{t('register.creatingAccount')}</span>
                  </>
                ) : (
                  <span>{t('register.createAccountBtn')}</span>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-gray-600">
                {t('register.alreadyHaveAccount')}{' '}
                <Link 
                  to="/login" 
                  className="text-dark-blue-500 hover:text-dark-blue-600 font-semibold transition-colors duration-200 hover:underline"
                >
                  {t('register.signIn')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

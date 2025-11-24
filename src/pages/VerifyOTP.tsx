import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { usersApi } from '../lib/api';

export default function VerifyOTP() {
  const [searchParams] = useSearchParams();
  const { token: tokenFromParams } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState('');
  const token = (searchParams.get('token') || tokenFromParams || (typeof window !== 'undefined' ? sessionStorage.getItem('pending_verification_token') : '') || '').toString();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (!token) {
        throw new Error('Missing verification token in URL');
      }
      await usersApi.verifyRegistrationOTP(token, otp);
      try { sessionStorage.removeItem('pending_verification_token'); } catch {}
      setSuccess('Email verified! You can now login.');
      navigate('/login')
    } catch (e: any) {
      setError(e?.message || 'OTP verification failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Verify Email OTP</h1>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>}
        {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">{success}</div>}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OTP Code</label>
              <input
                type="text"
                required
                minLength={6}
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 outline-none"
                autoFocus
              />
            </div>
            {!token && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                Missing verification token. Please open the link from your email which contains the token.
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-3 rounded-lg"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}
        {success && (
          <button onClick={() => navigate('/login')} className="w-full mt-4 bg-dark-blue-500 text-white px-6 py-3 rounded-lg">Go to Login</button>
        )}
      </div>
    </div>
  );
}

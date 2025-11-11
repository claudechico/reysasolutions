import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await usersApi.forgotPassword(email);
      setSuccess('OTP code sent. Please check your email.');
      setStep(2);
    } catch (e: any) {
      setError(e?.message || 'Failed to send reset code');
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
  const res: any = await usersApi.verifyResetOTP(email, otp);
  if (res && res.resetToken) setResetToken(res.resetToken);
      setSuccess('OTP verified. Please enter your new password.');
      setStep(3);
    } catch (e: any) {
      setError(e?.message || 'OTP verification failed');
    } finally { setLoading(false); }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      await usersApi.resetPassword(
        { email, otp, newPassword, confirmPassword } as any,
        resetToken || undefined
      );
      setSuccess('Password has been reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (e: any) {
      setError(e?.message || 'Failed to reset password');
    } finally { setLoading(false); }
  };

  return (
  <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>
        {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">{error}</div>}
        {success && <div className="mb-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">{success}</div>}

        {step === 1 && (
          <form onSubmit={handleRequest} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">OTP Code</label>
              <input
                type="text"
                required
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleReset} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

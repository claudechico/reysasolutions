import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentsApi, bookingsApi } from '../lib/api';
import { CreditCard, Smartphone, DollarSign, CheckCircle, Clock, XCircle, Wallet, History, AlertCircle } from 'lucide-react';
import { formatPrice } from '../lib/format';
import { format } from 'date-fns';

export default function Payment() {
  const [provider, setProvider] = useState('mpesa');
  const [amount, setAmount] = useState('1000');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const pollingRef = useRef<Record<string, number>>({});
  const pendingBookingsRef = useRef<Record<string, any>>({});
  const navigate = useNavigate();

  const providers = [
    { id: 'mpesa', label: 'M-Pesa' },
    { id: 'tigopesa', label: 'Tigo Pesa' },
    { id: 'airtelmoney', label: 'Airtel Money' },
    { id: 'mixbyaxx', label: 'Mixby Axx' },
    { id: 'halopesa', label: 'HaloPesa' },
  ];

  const handlePay = async () => {
    setMessage(null);
    setLoading(true);
    try {
      const res: any = await paymentsApi.initiate({ provider, amount: Number(amount), phone });
      setMessage(res?.message || 'Payment initiated. Follow instructions on your phone.');
      // Add to history if backend returns a payment id/object
      const payment = res?.payment || (res?.id ? { id: res.id, provider, amount: Number(amount), phone, status: res?.status || 'pending' } : null);
      if (payment) {
        setHistory(h => [payment, ...h]);
        // start polling status for this payment id
        // If a booking was passed via query, attach it to this payment id so we can create booking after success
        const params = new URLSearchParams(window.location.search);
        // collect booking params if present
        const bookingPropId = params.get('propertyId');
        const bookingStart = params.get('startDate');
        const bookingEnd = params.get('endDate');
        const bookingDurationType = params.get('durationType');
        if (bookingPropId && bookingStart && bookingEnd) {
          const total = params.get('amount');
          const toCreate: any = {
            propertyId: bookingPropId,
            startDate: bookingStart,
            endDate: bookingEnd,
            durationType: (bookingDurationType as any) || 'days',
          };
          if (total) toCreate.totalAmount = Number(total);
          pendingBookingsRef.current[String(payment.id)] = toCreate;
        }

        startPolling(String(payment.id));
      }
    } catch (e: any) {
      setMessage(e?.message || 'Payment failed to start');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res: any = await paymentsApi.list?.({ limit: 20 }) || { payments: [] };
      setHistory(res.payments || []);
    } catch (e: any) {
      // ignore
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => {
      // cleanup intervals
      const map = pollingRef.current;
      Object.values(map).forEach(id => clearInterval(id));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPolling = (paymentId: string) => {
    if (!paymentId) return;
    if (pollingRef.current[paymentId]) return; // already polling
    const iv = window.setInterval(async () => {
      try {
        const res: any = await paymentsApi.status(paymentId);
        if (!res) return;
        // update history entry
        setHistory(prev => prev.map(p => (String(p.id) === String(paymentId) ? { ...p, status: res.status || p.status, updatedAt: res.updatedAt } : p)));
        // stop polling on final states
        const st = (res.status || '').toLowerCase();
        if (['success', 'failed', 'error', 'cancelled'].includes(st)) {
          clearInterval(iv);
          delete pollingRef.current[paymentId];
          // if payment succeeded and we have a pending booking attached, create the booking
          if (st === 'success' && pendingBookingsRef.current[paymentId]) {
            const bk = pendingBookingsRef.current[paymentId];
            try {
              await bookingsApi.create({
                propertyId: bk.propertyId,
                startDate: bk.startDate,
                endDate: bk.endDate,
                durationType: bk.durationType,
                totalAmount: bk.totalAmount,
              });
              // remove pending mapping
              delete pendingBookingsRef.current[paymentId];
              // navigate to user's bookings
              navigate('/dashboard/bookings');
            } catch (err) {
              // if booking creation fails, keep user on payments page and show message
              console.error('Failed to create booking after payment', err);
              setMessage('Payment succeeded but booking finalization failed. Please contact support.');
            }
          }
        }
      } catch (e) {
        // ignore transient errors
      }
    }, 3000);
    pollingRef.current[paymentId] = iv;
  };

  const getStatusBadge = (status: string) => {
    const statusLower = String(status).toLowerCase();
    if (statusLower === 'success' || statusLower === 'completed' || statusLower === 'paid') {
      return { 
        class: 'bg-green-100 text-green-800 border-green-200', 
        icon: <CheckCircle className="w-4 h-4" />, 
        text: 'Success' 
      };
    } else if (statusLower === 'pending' || statusLower === 'processing') {
      return { 
        class: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: <Clock className="w-4 h-4" />, 
        text: 'Pending' 
      };
    } else if (statusLower === 'failed' || statusLower === 'error' || statusLower === 'cancelled') {
      return { 
        class: 'bg-red-100 text-red-800 border-red-200', 
        icon: <XCircle className="w-4 h-4" />, 
        text: statusLower === 'cancelled' ? 'Cancelled' : 'Failed' 
      };
    }
    return { 
      class: 'bg-gray-100 text-gray-800 border-gray-200', 
      icon: <Clock className="w-4 h-4" />, 
      text: status 
    };
  };

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-light-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-dark-blue-500" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Make a Payment</h1>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">Choose your mobile money provider and complete your payment securely.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Payment Form - Left Column */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 mb-6">
              {/* Provider Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-dark-blue-500" />
                  <span>Select Payment Provider</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {providers.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProvider(p.id)}
                      className={`px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                        provider === p.id 
                          ? 'border-dark-blue-500 bg-light-blue-50 text-dark-blue-600 shadow-md transform scale-105' 
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-dark-blue-500" />
                  <span>Phone Number</span>
                </label>
                <input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none transition-all" 
                  placeholder="07XXXXXXXX" 
                  type="tel"
                />
                <p className="mt-1 text-xs text-gray-500">Enter your mobile money registered phone number</p>
              </div>

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-dark-blue-500" />
                  <span>Amount (Tsh)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Tsh</span>
                  <input 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    type="number" 
                    className="w-full pl-16 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none transition-all" 
                    placeholder="1000"
                    min="1"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Minimum amount: Tsh 1,000</p>
              </div>

              {/* Message Display */}
              {message && (
                <div className={`mb-6 p-4 rounded-xl border-2 flex items-start space-x-3 ${
                  message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-light-blue-50 border-blue-200 text-dark-blue-700'
                }`}>
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{message}</p>
                </div>
              )}

              {/* Pay Button */}
              <button 
                onClick={handlePay} 
                disabled={loading || !phone || !amount || Number(amount) < 1000} 
                className="w-full bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pay Now</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Payment History - Right Column */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 sticky top-24">
              <div className="flex items-center space-x-2 mb-6">
                <History className="w-5 h-5 text-dark-blue-500" />
                <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No payments yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Your payment history will appear here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {history.map(p => {
                    const statusBadge = getStatusBadge(p.status || 'pending');
                    return (
                      <div 
                        key={String(p.id)} 
                        className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900 capitalize">
                                {p.provider || 'N/A'}
                              </span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">
                              Tsh {formatPrice(p.amount || 0)}
                            </p>
                            {p.phone && (
                              <p className="text-xs text-gray-500 mt-1 flex items-center space-x-1">
                                <Smartphone className="w-3 h-3" />
                                <span>{p.phone}</span>
                              </p>
                            )}
                            {(p.updatedAt || p.createdAt) && (
                              <p className="text-xs text-gray-400 mt-1">
                                {format(new Date(p.updatedAt || p.createdAt), 'MMM dd, yyyy HH:mm')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.class}`}>
                            {statusBadge.icon}
                            <span>{statusBadge.text}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

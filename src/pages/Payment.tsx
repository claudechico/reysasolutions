import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentsApi, bookingsApi } from '../lib/api';

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

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Make a Payment</h1>
        <p className="text-gray-600 mb-6">Choose your mobile money provider and amount to pay.</p>

        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Provider</label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {providers.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`px-3 py-2 rounded-lg border ${provider === p.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200'} text-sm font-medium`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border rounded mb-4" placeholder="07XXXXXXXX" />

          <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" className="w-full px-3 py-2 border rounded mb-4" />

          <div className="flex justify-end">
            <button onClick={handlePay} disabled={loading} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg">
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>

          {message && (
            <div className="mt-4 text-sm text-gray-700">{message}</div>
          )}
        
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3">Payment History</h2>
          {history.length === 0 ? (
            <div className="text-sm text-gray-500">No payments yet.</div>
          ) : (
            <div className="space-y-2">
              {history.map(p => (
                <div key={String(p.id)} className="flex items-center justify-between border rounded p-2">
                  <div>
                    <div className="font-medium">{p.provider} — {p.amount}</div>
                    <div className="text-xs text-gray-500">{p.phone || ''} • {p.updatedAt || p.createdAt || ''}</div>
                  </div>
                  <div className={`text-sm font-medium ${String(p.status).toLowerCase() === 'success' ? 'text-green-600' : (String(p.status).toLowerCase() === 'pending' ? 'text-yellow-600' : 'text-red-600')}`}>
                    {p.status || 'pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

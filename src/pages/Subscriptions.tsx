import { useEffect, useState } from 'react';
import { subscriptionsApi } from '../lib/api';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await subscriptionsApi.list();
        setSubscriptions(res.subscriptions || []);
      } catch (e: any) {
        setMessage(e?.message || 'Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRenew = async (id: string | number) => {
    setMessage(null);
    try {
      await subscriptionsApi.renew(id);
      setMessage('Subscription renewed successfully.');
      // refresh
      const res = await subscriptionsApi.list();
      setSubscriptions(res.subscriptions || []);
    } catch (e: any) {
      setMessage(e?.message || 'Failed to renew subscription');
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Subscriptions</h1>
        <p className="text-gray-600 mb-6">Manage your subscriptions and view payment status.</p>

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : (
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-600">You have no subscriptions. Visit the Payments page to purchase a plan.</div>
              ) : (
                subscriptions.map((s) => (
                  <div key={s.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.name || 'Plan'}</div>
                      <div className="text-sm text-gray-500">Status: {s.status || 'unknown'}</div>
                      <div className="text-sm text-gray-500">Expires: {s.expiresAt || 'N/A'}</div>
                    </div>
                    <div>
                      <button onClick={() => handleRenew(s.id)} className="bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-4 py-2 rounded-lg">Renew</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {message && <div className="mt-4 text-sm text-gray-700">{message}</div>}
        </div>
      </div>
    </div>
  );
}

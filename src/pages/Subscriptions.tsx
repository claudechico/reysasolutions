import { useEffect, useState } from 'react';
import { subscriptionsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/format';
import { useTranslation } from 'react-i18next';

interface Subscription {
  id: string | number;
  name?: string;
  status?: string;
  expiresAt?: string;
  amount?: number;
}

export default function Subscriptions() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  
  // Determine subscription price based on user role
  // Get user role - handle both direct role property and nested user object
  const getUserRole = () => {
    if (!user) return '';
    const role = (user as { role?: string })?.role || '';
    return String(role).toLowerCase().trim();
  };
  
  const userRole = getUserRole();
  
  // Determine price: 2000 for 'users' role, 10000 for 'owner' or 'agent' roles
  const subscriptionPrice = 
    userRole === 'users' 
      ? 2000 
      : (userRole === 'owner' || userRole === 'agent' 
          ? 10000 
          : 0);
  
  // Debug logging to verify role detection
  useEffect(() => {
    if (user) {
      console.log('Subscription Page - User Role Detection:', {
        user,
        role: userRole,
        subscriptionPrice,
        rawRole: (user as { role?: string })?.role
      });
    }
  }, [user, userRole, subscriptionPrice]);

  useEffect(() => {
    (async () => {
      try {
        const res = await subscriptionsApi.list();
        setSubscriptions(res.subscriptions || []);
      } catch (e: unknown) {
        setMessage((e as { message?: string })?.message || t('subscriptions.loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRenew = async (id: string | number) => {
    setMessage(null);
    try {
      await subscriptionsApi.renew(id);
        setMessage(t('subscriptions.renewSuccess'));
      // refresh
      const res = await subscriptionsApi.list();
      setSubscriptions(res.subscriptions || []);
    } catch (e: unknown) {
      setMessage((e as { message?: string })?.message || t('subscriptions.renewError'));
    }
  };

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">{t('subscriptions.title')}</h1>
        <p className="text-gray-600 mb-6">{t('subscriptions.subtitle')}</p>

        {/* Display subscription price based on user role */}
        {user && subscriptionPrice > 0 && (
          <div className="bg-gradient-to-r from-light-blue-50 to-dark-blue-50 rounded-lg shadow-md p-6 mb-6 border border-light-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {userRole === 'users' ? t('subscriptions.customerSubscription') : t('subscriptions.ownerAgentSubscription')}
                </h2>
                <p className="text-gray-600 mb-1">
                  {userRole === 'users' 
                    ? t('subscriptions.customerDescription')
                    : t('subscriptions.ownerAgentDescription')}
                </p>
                <p className="text-sm text-gray-500">
                  {t('subscriptions.price')}: <span className="font-bold text-dark-blue-600 text-lg">Tsh {formatPrice(subscriptionPrice)}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold bg-gradient-to-r from-dark-blue-500 to-dark-blue-700 bg-clip-text text-transparent">
                  Tsh {formatPrice(subscriptionPrice)}
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('subscriptions.perSubscription')}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-12">{t('subscriptions.loading')}</div>
          ) : (
            <div className="space-y-4">
              {subscriptions.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <p className="mb-4">{t('subscriptions.noActiveSubscriptions')}</p>
                  {user && subscriptionPrice > 0 && (
                    <p className="text-sm text-gray-500">
                      {t('subscriptions.visitPayments', { price: `Tsh ${formatPrice(subscriptionPrice)}` })}
                    </p>
                  )}
                </div>
              ) : (
                subscriptions.map((s) => (
                  <div key={s.id} className="border rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.name || t('subscriptions.plan')}</div>
                      <div className="text-sm text-gray-500">{t('subscriptions.status')}: {s.status || t('subscriptions.unknown')}</div>
                      <div className="text-sm text-gray-500">{t('subscriptions.expires')}: {s.expiresAt || t('subscriptions.notAvailable')}</div>
                      {s.amount && (
                        <div className="text-sm font-semibold text-dark-blue-600 mt-1">
                          {t('subscriptions.amount')}: Tsh {formatPrice(s.amount)}
                        </div>
                      )}
                    </div>
                    <div>
                      <button onClick={() => handleRenew(s.id)} className="bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-4 py-2 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition">{t('subscriptions.renew')}</button>
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

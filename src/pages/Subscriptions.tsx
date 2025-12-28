import { useEffect, useState } from 'react';
import { subscriptionsApi, paymentsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { formatPrice } from '../lib/format';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  
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
    
    // Check payment status
    (async () => {
      try {
        setCheckingPayment(true);
        const res = await paymentsApi.checkSubscription();
        const paid = res?.isPaid || (user as any).isPaidUser || false;
        setIsPaid(paid);
      } catch (err) {
        // If check fails, use user's isPaidUser field as fallback
        setIsPaid((user as any).isPaidUser || false);
      } finally {
        setCheckingPayment(false);
      }
    })();
  }, [user, t]);

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

        {/* Payment Status Banner */}
        {!checkingPayment && (
          <div className={`mb-6 rounded-xl p-6 shadow-lg border-2 ${
            isPaid 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
              : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-300'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  isPaid ? 'bg-green-500' : 'bg-orange-500'
                }`}>
                  {isPaid ? (
                    <CheckCircle className="w-7 h-7 text-white" />
                  ) : (
                    <XCircle className="w-7 h-7 text-white" />
                  )}
                </div>
                <div>
                  <h3 className={`text-xl font-bold mb-1 ${
                    isPaid ? 'text-green-900' : 'text-orange-900'
                  }`}>
                    Payment Status: {isPaid ? 'Paid' : 'Not Paid'}
                  </h3>
                  <p className={`text-sm ${
                    isPaid ? 'text-green-800' : 'text-orange-800'
                  }`}>
                    {isPaid 
                      ? 'Your subscription is active. You can create properties, make bookings, and contact agents.'
                      : 'You need to make a payment to access premium features. Please subscribe to continue.'}
                  </p>
                </div>
              </div>
              {!isPaid && (
                <button
                  onClick={() => navigate('/payment')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md font-medium flex items-center space-x-2"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Make Payment</span>
                </button>
              )}
            </div>
          </div>
        )}

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

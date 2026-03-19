import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { paymentsApi } from '../lib/api';
import { useAuth } from './AuthContext';

export interface SubscriptionState {
  hasActiveSubscription: boolean;
  isPaidUser: boolean;
  daysRemaining: number | null;
  subscriptionExpiresAt: string | null;
  lastPaymentDate: string | null;
  subscriptionDays: number;
}

interface SubscriptionContextType {
  subscription: SubscriptionState | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const defaultState: SubscriptionState = {
  hasActiveSubscription: false,
  isPaidUser: false,
  daysRemaining: null,
  subscriptionExpiresAt: null,
  lastPaymentDate: null,
  subscriptionDays: 30,
};

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(defaultState);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await paymentsApi.checkSubscription();
      const sub = res?.data?.subscription;
      setSubscription({
        hasActiveSubscription: sub?.hasActiveSubscription === true,
        isPaidUser: sub?.isPaidUser === true || (user as { isPaidUser?: boolean }).isPaidUser === true,
        daysRemaining: sub?.daysRemaining ?? null,
        subscriptionExpiresAt: sub?.subscriptionExpiresAt ?? null,
        lastPaymentDate: sub?.lastPaymentDate ?? null,
        subscriptionDays: sub?.subscriptionDays ?? 30,
      });
    } catch {
      setSubscription({
        ...defaultState,
        isPaidUser: !!(user as { isPaidUser?: boolean }).isPaidUser,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return (
    <SubscriptionContext.Provider value={{ subscription, loading, refetch: fetchSubscription }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';

/**
 * RequireSubscription blocks access unless the user has an active subscription.
 * - propertyCreate: agent/owner must be subscribed to create or edit properties.
 * - booking: any user must be subscribed to book, call, or send messages.
 * Use for both web and mobile (same logic).
 */
type RequireFor = 'propertyCreate' | 'booking';

export default function RequireSubscription({
  children,
  requiredFor,
}: {
  children: React.ReactNode;
  requiredFor: RequireFor;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { subscription, loading } = useSubscription();

  const hasActiveSubscription = subscription?.hasActiveSubscription === true;
  const role = String((user as { role?: string })?.role ?? '').toLowerCase();

  useEffect(() => {
    if (loading || !user) return;

    if (requiredFor === 'propertyCreate') {
      // Only agent/owner need subscription to create properties
      if (role !== 'agent' && role !== 'owner') return;
      if (!hasActiveSubscription) {
        navigate('/subscriptions', { replace: true });
      }
      return;
    }

    if (requiredFor === 'booking') {
      // All users need subscription to book, call, send messages
      if (!hasActiveSubscription) {
        navigate('/subscriptions', { replace: true });
      }
    }
  }, [loading, user, role, hasActiveSubscription, requiredFor, navigate]);

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dark-blue-500" />
      </div>
    );
  }

  if (!user) return null;

  if (requiredFor === 'propertyCreate' && role !== 'agent' && role !== 'owner') {
    return <>{children}</>;
  }
  if (requiredFor === 'propertyCreate' && !hasActiveSubscription) {
    return null; // redirecting
  }
  if (requiredFor === 'booking' && !hasActiveSubscription) {
    return null; // redirecting
  }

  return <>{children}</>;
}

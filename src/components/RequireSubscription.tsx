/**
 * Temporary pass-through gate.
 * Subscription enforcement is currently handled by backend policy.
 */
type RequireFor = 'propertyCreate' | 'booking';

export default function RequireSubscription({
  children,
  requiredFor: _requiredFor,
}: {
  children: React.ReactNode;
  requiredFor: RequireFor;
}) {
  return <>{children}</>;
}

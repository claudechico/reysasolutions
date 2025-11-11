import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;
  const role = String((user as any).role || '').toLowerCase();
  if (role !== 'admin') return <Navigate to="/dashboard" />;

  return <>{children}</>;
}

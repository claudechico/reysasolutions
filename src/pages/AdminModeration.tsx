import { useState } from 'react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminSidebar from '../components/AdminSidebar';
import { Shield, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AdminModeration() {
  const [loading] = useState(false);

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50 pt-24 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading moderation...</p>
          </div>
        </div>
      </AdminProtectedRoute>
    );
  }

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <AdminSidebar />
        <div className="flex-1 lg:ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-16 lg:pt-0 pb-6 sm:pb-8 lg:pb-12 space-y-6 sm:space-y-8 lg:space-y-10">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-8 h-8 text-dark-blue-500" />
              <h1 className="text-3xl font-bold text-gray-900">Content Moderation</h1>
            </div>
            <p className="text-gray-600">Review and moderate user-generated content across the platform</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-light-blue-500 to-dark-blue-500 rounded-2xl shadow-xl border border-light-blue-400 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <AlertCircle className="w-8 h-8" />
                </div>
              </div>
              <div className="text-light-blue-100 text-sm font-medium mb-1">Pending Reviews</div>
              <div className="text-3xl font-bold">0</div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl shadow-xl border border-yellow-400 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <XCircle className="w-8 h-8" />
                </div>
              </div>
              <div className="text-yellow-100 text-sm font-medium mb-1">Flagged Content</div>
              <div className="text-3xl font-bold">0</div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-xl border border-green-400 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
              </div>
              <div className="text-green-100 text-sm font-medium mb-1">Approved Today</div>
              <div className="text-3xl font-bold">0</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-xl border border-purple-400 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Shield className="w-8 h-8" />
                </div>
              </div>
              <div className="text-purple-100 text-sm font-medium mb-1">Total Moderated</div>
              <div className="text-3xl font-bold">0</div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div className="text-center py-12">
              <Shield className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-900 mb-3">No Moderation Items Available</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                All content has been reviewed and approved. New moderation items will appear here when users submit content that requires review.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

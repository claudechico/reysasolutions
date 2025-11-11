import { useState } from 'react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminSidebar from '../components/AdminSidebar';
import { FileText, Save, Loader2, CheckCircle } from 'lucide-react';

export default function AdminCMS() {
  const [faq, setFaq] = useState(localStorage.getItem('cms_faq') || '');
  const [about, setAbout] = useState(localStorage.getItem('cms_about') || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      localStorage.setItem('cms_faq', faq);
      localStorage.setItem('cms_about', about);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save', error);
      alert('Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <AdminSidebar />
        <div className="flex-1 ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Content Management System</h1>
            </div>
            <p className="text-gray-600">Manage static content for your website including About Us and FAQs</p>
          </div>

          {/* About Us Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">About Us</h2>
                <p className="text-sm text-gray-600 mt-1">Edit the About Us content that appears on your website</p>
              </div>
            </div>
            <textarea
              value={about}
              onChange={e => setAbout(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={8}
              placeholder="Enter About Us content here..."
            />
            <div className="mt-2 text-xs text-gray-500">
              {about.length} characters
            </div>
          </div>

          {/* FAQs Section */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions (FAQs)</h2>
                <p className="text-sm text-gray-600 mt-1">Edit the FAQs content that appears on your website</p>
              </div>
            </div>
            <textarea
              value={faq}
              onChange={e => setFaq(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              rows={8}
              placeholder="Enter FAQs content here..."
            />
            <div className="mt-2 text-xs text-gray-500">
              {faq.length} characters
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end space-x-4">
            {saved && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Saved successfully!</span>
              </div>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>

          {/* Info Note */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Content is currently saved to local storage only. To persist across devices, integrate with your backend API.
            </p>
          </div>
        </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}

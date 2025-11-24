import { useEffect, useState } from 'react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminSidebar from '../components/AdminSidebar';
import { adminCategoriesApi } from '../lib/api';
import {
  Search,
  X,
  Trash2,
  Edit2,
  Plus,
  Tag,
  Building2,
  Loader2,
  CheckCircle,
  XCircle,
  Save,
} from 'lucide-react';

interface Category {
  id: string | number;
  name: string;
  description?: string;
  properties?: Array<{ id: string | number }>;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await adminCategoriesApi.list({ includeProperties: true });
      if (res?.success && res?.categories) {
        setCategories(res.categories);
      } else if (res?.categories) {
        setCategories(res.categories);
      }
    } catch (err: any) {
      console.error('Failed to load categories', err);
      setError(err?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (category: Category) => {
    setFormData({ name: category.name, description: category.description || '' });
    setEditingId(category.id);
    setShowForm(true);
    setError(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setError(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingId) {
        await adminCategoriesApi.update(editingId, formData);
      } else {
        await adminCategoriesApi.create(formData);
      }

      await loadCategories();
      handleCancel();
    } catch (err: any) {
      console.error('Failed to save category', err);
      setError(err?.message || `Failed to ${editingId ? 'update' : 'create'} category`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? Properties linked to this category will have their category unlinked.`)) {
      return;
    }

    try {
      setError(null);
      await adminCategoriesApi.remove(id);
      await loadCategories();
    } catch (err: any) {
      console.error('Failed to delete category', err);
      setError(err?.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <AdminProtectedRoute>
        <div className="flex min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
          <AdminSidebar />
          <div className="flex-1 lg:ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-16 lg:pt-0 pb-6 sm:pb-8 lg:pb-12 space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4" />
                  <p className="text-gray-600">Loading categories...</p>
                </div>
              </div>
            </div>
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
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Tag className="w-6 h-6 sm:w-8 sm:h-8 text-dark-blue-500" />
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Categories Management</h1>
                </div>
                <button
                  onClick={handleCreate}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base font-medium">Add Category</span>
                </button>
              </div>
              <p className="text-sm sm:text-base text-gray-600">Manage property categories and organize listings</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm sm:text-base text-red-800 font-medium">Error</p>
                  <p className="text-xs sm:text-sm text-red-600 mt-1">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Create/Edit Form */}
            {showForm && (
              <div className="mb-4 sm:mb-6 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    {editingId ? 'Edit Category' : 'Create New Category'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                      placeholder="Enter category name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none resize-none text-sm sm:text-base"
                      rows={3}
                      placeholder="Enter category description (optional)"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <button
                      onClick={handleSave}
                      disabled={saving || !formData.name.trim()}
                      className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                          <span className="text-sm sm:text-base">Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span className="text-sm sm:text-base">{editingId ? 'Update' : 'Create'} Category</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 sm:py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Bar */}
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search categories by name or description..."
                  className="w-full pl-9 sm:pl-12 pr-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none text-sm sm:text-base"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Categories List */}
            {filteredCategories.length === 0 ? (
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12 text-center">
                <Tag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  {searchTerm ? 'No categories found' : 'No categories yet'}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-6">
                  {searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Get started by creating your first category'}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreate}
                    className="inline-flex items-center space-x-2 bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-sm sm:text-base font-medium">Create Category</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredCategories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 hover:shadow-2xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-3 sm:mb-4">
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-light-blue-500 to-dark-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-bold text-gray-900 truncate">{category.name}</h3>
                          {category.description && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">{category.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 mb-4 sm:mb-5">
                      <div className="flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm text-gray-600">
                        <Building2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium">{category.properties?.length || 0} Properties</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={() => handleEdit(category)}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-light-blue-50 text-dark-blue-500 rounded-lg hover:bg-light-blue-100 transition text-xs sm:text-sm font-medium"
                      >
                        <Edit2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs sm:text-sm font-medium"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}


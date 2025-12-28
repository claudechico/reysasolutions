import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { advertisementsApi, propertiesApi, categoriesApi, PropertyDto, CategoryDto } from '../lib/api';
import { Save, ArrowLeft, X, Plus, Image as ImageIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminSidebar from '../components/AdminSidebar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5558';

function toUrl(path?: string) {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) return s;
  if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
  if (s.startsWith('uploads')) return `${API_BASE_URL}/${s}`;
  return `${API_BASE_URL}/uploads/${s}`;
}

export default function AdvertisementForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyId: '',
    categoryId: '',
    phoneNumber: '',
    startDate: '',
    endDate: '',
    price: '',
    isActive: true,
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Only admin, owner, and agent can create/edit advertisements
    const userRole = String((user as any).role || '').toLowerCase();
    if (!['admin', 'owner', 'agent'].includes(userRole)) {
      navigate('/dashboard');
      return;
    }

    loadProperties();
    loadCategories();

    if (id && id !== 'new') {
      loadAdvertisement();
    }
  }, [id, user, navigate]);

  const getBackPath = () => {
    const userRole = String((user as any)?.role || '').toLowerCase();
    return userRole === 'admin' ? '/admin' : '/dashboard';
  };

  const loadProperties = async () => {
    try {
      const res = await propertiesApi.list({ page: 1, limit: 1000 });
      setProperties(res.properties || []);
    } catch (err) {
      console.error('Failed to load properties', err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.list();
      setCategories(res.categories || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const loadAdvertisement = async () => {
    try {
      setLoading(true);
      const res = await advertisementsApi.get(id!);
      const ad = res?.advertisement;
      if (!ad) {
        navigate('/dashboard');
        return;
      }

      // Extract image URLs
      const images: string[] = [];
      if (ad.images && Array.isArray(ad.images)) {
        ad.images.forEach((img: any) => {
          if (typeof img === 'string') {
            images.push(img);
          } else if (img?.path) {
            images.push(img.path);
          } else if (img?.url) {
            images.push(img.url);
          } else if (img?.media_url) {
            images.push(img.media_url);
          }
        });
      }

      setFormData({
        title: ad.title || '',
        description: ad.description || '',
        propertyId: ad.propertyId ? String(ad.propertyId) : '',
        categoryId: ad.categoryId ? String(ad.categoryId) : '',
        phoneNumber: ad.phoneNumber || '',
        startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : '',
        endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : '',
        price: ad.price ? String(ad.price) : '',
        isActive: ad.isActive !== undefined ? ad.isActive : true,
      });
      setImageUrls(images);
    } catch (err: any) {
      setError(err?.message || 'Failed to load advertisement');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...validFiles]);
    
    // Convert files to base64 for preview and upload
    const newImageUrls: string[] = [];
    for (const file of validFiles) {
      try {
        const base64 = await fileToBase64(file);
        newImageUrls.push(base64);
      } catch (err) {
        console.error('Failed to convert file to base64:', err);
        // Fallback to blob URL for preview
        newImageUrls.push(URL.createObjectURL(file));
      }
    }
    
    setImageUrls(prev => [...prev, ...newImageUrls]);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = (index: number) => {
    // Clean up blob URLs if any
    const urlToRemove = imageUrls[index];
    if (urlToRemove && urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove);
    }
    
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        propertyId: formData.propertyId ? Number(formData.propertyId) : null,
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        phoneNumber: formData.phoneNumber || null,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        price: formData.price ? Number(formData.price) : null,
        isActive: formData.isActive,
      };

      // Send images as base64 data URLs or existing URLs
      if (imageUrls.length > 0) {
        // Filter out blob URLs (temporary previews) and keep base64 or existing URLs
        payload.images = imageUrls.filter(url => {
          // Keep base64 data URLs (data:image/...)
          if (url.startsWith('data:image/')) return true;
          // Keep existing URLs (not blob URLs)
          if (!url.startsWith('blob:')) return true;
          return false;
        });
      }

      if (id && id !== 'new') {
        await advertisementsApi.update(id, payload);
      } else {
        await advertisementsApi.create(payload);
      }

      navigate(getBackPath());
    } catch (err: any) {
      setError(err?.message || 'Failed to save advertisement');
    } finally {
      setLoading(false);
    }
  };

  if (loading && id && id !== 'new') {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-72">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <div className="mb-6">
          <button
            onClick={() => navigate(getBackPath())}
            className="flex items-center space-x-2 text-gray-600 hover:text-dark-blue-500 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {id && id !== 'new' ? 'Edit Advertisement' : 'Create Advertisement'}
          </h1>
          <p className="text-gray-600">Fill in the details to create a new advertisement</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
              placeholder="Enter advertisement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter advertisement description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
              <select
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select a property (optional)</option>
                {properties.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.title}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select a category (optional)</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                placeholder="+255..."
              />
            </div>

            <div className="lg:col-span-7">
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div className="lg:col-span-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images <span className="text-gray-500 font-normal">(Optional)</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-light-blue-400 hover:bg-light-blue-50/50 transition-colors">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center space-y-3"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-light-blue-100 to-dark-blue-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-light-blue-500" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 block">Click to upload images</span>
                  <span className="text-xs text-gray-500 mt-1 block">PNG, JPG, GIF up to 10MB each</span>
                </div>
                {imageUrls.length > 0 && (
                  <span className="text-xs text-light-blue-600 font-medium">
                    {imageUrls.length} image{imageUrls.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </label>
            </div>
            {imageUrls.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Selected Images ({imageUrls.length})</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-light-blue-400 transition-colors">
                        <img
                          src={url.startsWith('blob:') || url.startsWith('data:') ? url : toUrl(url)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 hover:scale-110"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                        Image {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 text-light-blue-500 border-gray-300 rounded focus:ring-light-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Active (Advertisement will be visible to users)
            </label>
          </div>

          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-6 py-3 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition shadow-lg shadow-light-blue-500/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? 'Saving...' : id && id !== 'new' ? 'Update Advertisement' : 'Create Advertisement'}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(getBackPath())}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}


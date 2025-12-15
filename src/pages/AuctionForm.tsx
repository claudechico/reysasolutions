import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auctionsApi, propertiesApi, categoriesApi, PropertyDto, CategoryDto } from '../lib/api';
import { Save, ArrowLeft, X, Plus, Image as ImageIcon, Gavel } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AdminSidebar from '../components/AdminSidebar';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5558';

function toUrl(path?: string) {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) return s;
  if (s.startsWith('data:image/')) return s;
  if (s.startsWith('/')) return `${API_BASE_URL}${s}`;
  if (s.startsWith('uploads')) return `${API_BASE_URL}/${s}`;
  return `${API_BASE_URL}/uploads/${s}`;
}

export default function AuctionForm() {
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
    startingPrice: '',
    reservePrice: '',
    bidIncrement: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Only admin and agent can create/edit auctions
    const userRole = String((user as any).role || '').toLowerCase();
    if (!['admin', 'agent'].includes(userRole)) {
      navigate('/dashboard');
      return;
    }

    loadProperties();
    loadCategories();

    if (id && id !== 'new') {
      loadAuction();
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

  const loadAuction = async () => {
    try {
      setLoading(true);
      const res = await auctionsApi.get(id!);
      const auction = res?.auction;
      if (!auction) {
        navigate('/dashboard');
        return;
      }

      // Extract image URLs
      const images: string[] = [];
      if (auction.images && Array.isArray(auction.images)) {
        auction.images.forEach((img: any) => {
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
        title: auction.title || '',
        description: auction.description || '',
        propertyId: auction.propertyId ? String(auction.propertyId) : '',
        categoryId: auction.categoryId ? String(auction.categoryId) : '',
        phoneNumber: auction.phoneNumber || '',
        startDate: auction.startDate ? new Date(auction.startDate).toISOString().split('T')[0] : '',
        endDate: auction.endDate ? new Date(auction.endDate).toISOString().split('T')[0] : '',
        startingPrice: auction.startingPrice ? String(auction.startingPrice) : '',
        reservePrice: auction.reservePrice ? String(auction.reservePrice) : '',
        bidIncrement: auction.bidIncrement ? String(auction.bidIncrement) : '',
      });
      setImageUrls(images);
    } catch (err: any) {
      setError(err?.message || 'Failed to load auction');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxSize = 10 * 1024 * 1024;
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImageFiles(prev => [...prev, ...validFiles]);
    
    const newImageUrls: string[] = [];
    for (const file of validFiles) {
      try {
        const base64 = await fileToBase64(file);
        newImageUrls.push(base64);
      } catch (err) {
        console.error('Failed to convert file to base64:', err);
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
      if (!formData.startDate || !formData.endDate) {
        setError('Start date and end date are required');
        setLoading(false);
        return;
      }

      if (!formData.startingPrice || Number(formData.startingPrice) <= 0) {
        setError('Starting price must be greater than 0');
        setLoading(false);
        return;
      }

      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end <= start) {
        setError(t('auctions.endDateAfterStart'));
        setLoading(false);
        return;
      }

      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        propertyId: formData.propertyId ? Number(formData.propertyId) : null,
        categoryId: formData.categoryId ? Number(formData.categoryId) : null,
        phoneNumber: formData.phoneNumber || null,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startingPrice: Number(formData.startingPrice),
        reservePrice: formData.reservePrice ? Number(formData.reservePrice) : null,
        bidIncrement: formData.bidIncrement ? Number(formData.bidIncrement) : 0,
      };

      // Send images as base64 data URLs or existing URLs
      if (imageUrls.length > 0) {
        payload.images = imageUrls.filter(url => {
          if (url.startsWith('data:image/')) return true;
          if (!url.startsWith('blob:')) return true;
          return false;
        });
      }

      if (id && id !== 'new') {
        await auctionsApi.update(id, payload);
      } else {
        await auctionsApi.create(payload);
      }

      navigate('/auctions');
    } catch (err: any) {
      setError(err?.message || t('auctions.saveError'));
    } finally {
      setLoading(false);
    }
  };

  if (loading && id && id !== 'new') {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('auctions.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="mb-6">
            <button
              onClick={() => navigate(getBackPath())}
              className="flex items-center space-x-2 text-gray-600 hover:text-dark-blue-500 transition mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>{t('auctions.backToDashboard')}</span>
            </button>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
              {id && id !== 'new' ? t('auctions.updateAuction') : t('auctions.createAuction')}
            </h1>
          </div>
          <p className="text-gray-600">{t('auctions.fillDetails')}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auctions.titleLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              placeholder={t('auctions.titlePlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('auctions.descriptionLabel')}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
              placeholder={t('auctions.descriptionPlaceholder')}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auctions.propertyLabel')}</label>
              <select
                value={formData.propertyId}
                onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="">{t('auctions.selectProperty')}</option>
                {properties.map((p) => (
                  <option key={p.id} value={String(p.id)}>{p.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auctions.categoryLabel')}</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              >
                <option value="">{t('auctions.selectCategory')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auctions.phoneLabel')}</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder={t('auctions.phonePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auctions.startingPriceLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                required
                value={formData.startingPrice}
                onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auctions.reservePriceLabel')} ({t('auctions.optional')})
              </label>
              <input
                type="number"
                value={formData.reservePrice}
                onChange={(e) => setFormData({ ...formData, reservePrice: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auctions.bidIncrementLabel')}</label>
              <input
                type="number"
                value={formData.bidIncrement}
                onChange={(e) => setFormData({ ...formData, bidIncrement: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('auctions.startDateLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">{t('auctions.startDateDesc')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                min={formData.startDate || undefined}
              />
              <p className="text-xs text-gray-500 mt-1">{t('auctions.endDateDesc')}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auctions.imagesLabel')} <span className="text-gray-500 font-normal">({t('auctions.optional')})</span>
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 hover:bg-orange-50/50 transition-colors">
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
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700 block">{t('auctions.uploadImages')}</span>
                  <span className="text-xs text-gray-500 mt-1 block">{t('auctions.imageFormat')}</span>
                </div>
                {imageUrls.length > 0 && (
                  <span className="text-xs text-orange-600 font-medium">
                    {t('auctions.selectedImages', { count: imageUrls.length })}
                  </span>
                )}
              </label>
            </div>
            {imageUrls.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">{t('auctions.selectedImagesLabel', { count: imageUrls.length })}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200 group-hover:border-orange-400 transition-colors">
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
                        title={t('auctions.removeImage')}
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

          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition shadow-lg shadow-orange-500/30 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{loading ? t('auctions.saving') : id && id !== 'new' ? t('auctions.updateAuction') : t('auctions.createAuction')}</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(getBackPath())}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              {t('auctions.cancel')}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}


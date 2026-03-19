import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi, propertiesApiExtended, paymentsApi } from '../lib/api';
import { categoriesApi } from '../lib/api';
import { Save, ArrowLeft, X, Plus, CreditCard } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFriendlyErrorMessage } from '../lib/errorUtils';

const AMENITIES_OPTIONS = [
  'wifi', 'air_conditioning', 'heating', 'parking', 'pool', 'gym', 'garden',
  'balcony', 'terrace', 'elevator', 'security', 'furnished',
  'washer', 'dryer', 'dishwasher', 'fireplace', 'storage'
];

export default function PropertyFormEnhanced() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPaid, setIsPaid] = useState<boolean | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [mediaFiles, setMediaFiles] = useState<{ type: string; url: string; alt?: string }[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    property_type: 'House',
    status: 'available',
    featured: false,
    image_url: '',
    listing_type: 'buy',
    price_per: 'one_time',
    latitude: '',
    longitude: '',
    amenities: [] as string[],
    availability_status: 'available',
    categoryId: ''
  });
  const [categories, setCategories] = useState<Array<{ id: string | number; name: string }>>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Only agents and owners can create/edit properties
    const userRole = String((user as any).role || '').toLowerCase();
    if (userRole === 'users') {
      navigate('/dashboard');
      return;
    }

    // Check payment status for agents/owners
    (async () => {
      try {
        setCheckingPayment(true);
        const res = await paymentsApi.checkSubscription();
        // Handle both new response structure (data.subscription) and legacy (isPaid)
        const paid = res?.data?.subscription?.hasActiveSubscription || 
                     res?.data?.subscription?.isPaidUser || 
                     res?.isPaid || 
                     (user as any).isPaidUser || 
                     false;
        setIsPaid(paid);
        if (!paid && id === 'new') {
          setError('You need to make a payment before creating properties. Please subscribe to continue.');
        }
      } catch (err) {
        // If check fails, use user's isPaidUser field as fallback
        setIsPaid((user as any).isPaidUser || false);
        if (!(user as any).isPaidUser && id === 'new') {
          setError('You need to make a payment before creating properties. Please subscribe to continue.');
        }
      } finally {
        setCheckingPayment(false);
      }
    })();

    if (id && id !== 'new') {
      loadProperty();
    }
    // Auto-fill geolocation if available and not already set
    if (!formData.latitude && !formData.longitude && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setFormData(prev => ({
          ...prev,
          latitude: String(pos.coords.latitude),
          longitude: String(pos.coords.longitude)
        }));
      }, () => {/* silent */});
    }
  }, [id, user, navigate]);

  const loadProperty = async () => {
    const res = await propertiesApi.getById(id!);
    const data: any = res?.property;
    if (!data) {
      navigate('/dashboard');
      return;
    }
    setFormData({
      title: data.title,
      description: data.description || '',
      price: (data.price ?? '').toString(),
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      zipCode: (data.zipCode ?? '').toString(),
      bedrooms: (data.bedrooms ?? '').toString(),
      bathrooms: (data.bathrooms ?? '').toString(),
      area: (data.area ?? '').toString(),
      property_type: data.property_type,
      status: data.status,
      featured: data.featured,
      image_url: data.image_url || '',
      listing_type: data.listing_type || 'buy',
      price_per: data.price_per || 'one_time',
      latitude: (data.latitude ?? '').toString(),
      longitude: (data.longitude ?? '').toString(),
      amenities: data.amenities || [],
      availability_status: data.availability_status || 'available',
      categoryId: data.categoryId ? String(data.categoryId) : ''
    });
    const media = (data.media || []) as Array<{ media_type: string; media_url: string; media_alt?: string }>;
    if (Array.isArray(media)) setMediaFiles(media.map(m => ({ type: m.media_type, url: m.media_url, alt: m.media_alt || '' })));
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesApi.list();
        setCategories(res.categories || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Check payment status before submitting
    if (id === 'new') {
      const userRole = String((user as any).role || '').toLowerCase();
      if (userRole !== 'users') {
        // For agents/owners, check payment
        const paid = isPaid || (user as any).isPaidUser || false;
        if (!paid) {
          setError('You need to make a payment before creating properties. Please subscribe to continue.');
          return;
        }
      }
    }
    
    setLoading(true);

    // Helper: map frontend fields to backend enum values to avoid "invalid input value for enum"
    const mapStatusToBackend = (status: string, listingType: string) => {
      // Backend expects 'for_sale', 'for_rent', 'sold', 'rented'
      // Frontend uses a combination of `listing_type` (buy/rent) and `status` (available/pending/sold)
      if (status === 'sold') return 'sold';
      if (status === 'pending') {
        // Keep pending as for_sale or for_rent depending on listing type
        return listingType === 'rent' ? 'for_rent' : 'for_sale';
      }
      // status === 'available' -> map using listing_type
      return listingType === 'rent' ? 'for_rent' : 'for_sale';
    };

    const mappedStatus = mapStatusToBackend(formData.status, formData.listing_type);
    console.log('[PropertyFormEnhanced] Status mapping:', {
      frontendStatus: formData.status,
      frontendListingType: formData.listing_type,
      mappedBackendStatus: mappedStatus
    });

    const propertyData: any = {
      title: formData.title,
      description: formData.description,
      // backend expects `property_type`
      property_type: formData.property_type || undefined,
      // map frontend status/listing_type to backend enum
  status: mappedStatus,
      // include listing and pricing fields
      listing_type: formData.listing_type || undefined,
      price_per: formData.price_per || undefined,
      price: formData.price ? parseFloat(formData.price) : undefined,
      bedrooms: formData.property_type === 'Plot' ? undefined : (formData.bedrooms ? parseInt(formData.bedrooms) : undefined),
      bathrooms: formData.property_type === 'Plot' ? undefined : (formData.bathrooms ? parseInt(formData.bathrooms) : undefined),
      area: formData.area ? parseFloat(formData.area) : undefined,
      // backend uses `address` (we load into formData.address earlier)
      address: formData.address || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
      zipCode: formData.zipCode || undefined,
      availability_status: formData.availability_status || undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
      categoryId: formData.categoryId ? (isNaN(Number(formData.categoryId)) ? formData.categoryId : Number(formData.categoryId)) : undefined,
      featured: !!formData.featured,
      amenities: Array.isArray(formData.amenities) ? formData.amenities : [],
      image_url: formData.image_url || undefined,
    };

    // Only attach legacy URL-based media if no actual files are being uploaded
    // If files are present, they'll be uploaded separately via FormData
    if (imageFiles.length === 0 && videoFile === null) {
      const imageUrls = mediaFiles.filter(m => m.type === 'image').map(m => m.url);
      if (imageUrls.length > 0) propertyData.images = imageUrls;
      const videoUrl = mediaFiles.find(m => m.type === 'video')?.url;
      if (videoUrl) propertyData.video = { url: videoUrl };
    }

    let propertyId: string | null = id && id !== 'new' ? String(id) : null;

    try {
      console.log('[PropertyForm] Submitting property payload', propertyData);
      console.log('[PropertyForm] Status field being sent:', {
        status: propertyData.status,
        listing_type: propertyData.listing_type,
        fullPayload: propertyData
      });
      
      if (id && id !== 'new') {
        const updRes: any = await propertiesApiExtended.update(id, propertyData);
        console.log('[PropertyForm] PATCH /properties/:id response', updRes);
        console.log('[PropertyForm] Updated property status fields:', {
          status: updRes?.property?.status,
          listing_type: updRes?.property?.listing_type,
          fullProperty: updRes?.property
        });
        propertyId = id;
      } else {
        const created: any = await propertiesApiExtended.create(propertyData);
        console.log('[PropertyForm] POST /properties create response', created);
        console.log('[PropertyForm] Created property status fields:', {
          status: created?.property?.status,
          listing_type: created?.property?.listing_type,
          fullProperty: created?.property
        });
        propertyId = created?.property?.id || created?.id;
      }

      // If user selected files, upload them via multipart to /properties/:id/media
      if (propertyId && (imageFiles.length > 0 || videoFile)) {
        const fd = new FormData();
        imageFiles.forEach(file => fd.append('images', file));
        if (videoFile) fd.append('video', videoFile);
        console.log('[PropertyForm] Uploading media to property', propertyId, {
          imagesCount: imageFiles.length,
          hasVideo: Boolean(videoFile),
        });
        try {
          const uploadRes = await propertiesApiExtended.uploadMedia(propertyId, fd);
          console.log('[PropertyForm] POST /properties/:id/media response', uploadRes);
        } catch (uploadErr: any) {
          console.error('Media upload error:', uploadErr);
          setError(getFriendlyErrorMessage(uploadErr, 'Property saved but media upload failed. Please try uploading media again.'));
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('[PropertyForm] Save failed', err);
      setError(getFriendlyErrorMessage(err, 'Failed to save property. Please check your input and try again.'));
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // If property type is changed to Plot, clear bedrooms and bathrooms
    if (name === 'property_type' && value === 'Plot') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        bedrooms: '',
        bathrooms: '',
        amenities: []
      }));
    } else {
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addMediaFile = () => {
    // Deprecated: URL-based adding retained for backwards-compatibility
    const url = prompt('Enter media URL (image or video):');
    if (url) {
      const type = url.match(/\.(mp4|mov|avi|webm)$/i) ? 'video' : 'image';
      setMediaFiles([...mediaFiles, { type, url, alt: '' }]);
    }
  };

  const onSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length) setImageFiles(prev => [...prev, ...files]);
  };

  const onSelectVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setVideoFile(files[0] || null);
  };

  const removeSelectedImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearVideo = () => setVideoFile(null);

  const removeMediaFile = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  return (
  <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-dark-blue-500 transition font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('propertyForm.backToDashboard')}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-8 sm:p-10 lg:p-12">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            {id && id !== 'new' ? 'Edit Property' : 'Add New Property'}
          </h1>
            <p className="text-base text-gray-600 leading-relaxed">
            Fill in the details below. Your listing will be reviewed before publishing.
          </p>
          </div>

          {checkingPayment ? (
            <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
              <p className="text-blue-800 text-sm font-medium">Checking payment status...</p>
            </div>
          ) : !isPaid && id === 'new' ? (
            <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <CreditCard className="w-8 h-8 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-orange-900 mb-2">Payment Required</h3>
                  <p className="text-orange-800 text-sm mb-4">
                    You need to make a payment before creating properties. Please subscribe to continue.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/subscriptions')}
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2.5 rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md font-medium"
                  >
                    Go to Subscriptions
                  </button>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-sm">
              <p className="text-red-800 text-sm font-medium">{error}</p>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-10" style={{ pointerEvents: !isPaid && id === 'new' ? 'none' : 'auto', opacity: !isPaid && id === 'new' ? 0.6 : 1 }}>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-dark-blue-500 to-indigo-600 rounded-full mr-3"></span>
                {t('propertyForm.basicInfo')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6">
                <div className="md:col-span-2 lg:col-span-10">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.propertyTitle')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderTitle')}
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-10">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.description')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md resize-none"
                    placeholder={t('propertyForm.placeholderDescription')}
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.listingType')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="listing_type"
                    required
                    value={formData.listing_type}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-white"
                  >
                    <option value="buy">{t('propertyForm.forSale')}</option>
                    <option value="rent">{t('propertyForm.forRent')}</option>
                    <option value="vacation">{t('propertyForm.vacation')}</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.propertyType')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="property_type"
                    required
                    value={formData.property_type}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-white"
                  >
                    <option value="House">{t('propertyForm.typeHouse')}</option>
                    <option value="Apartment">{t('propertyForm.typeApartment')}</option>
                    <option value="Villa">{t('propertyForm.typeVilla')}</option>
                    <option value="Townhouse">{t('propertyForm.typeTownhouse')}</option>
                    <option value="Condo">{t('propertyForm.typeCondo')}</option>
                    <option value="Plot">Plot</option>
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.categoryOptional')}
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId || ''}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-white"
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.price')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderPrice')}
                  />
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.pricePer')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="price_per"
                    required
                    value={formData.price_per}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-white"
                  >
                    <option value="one_time">{t('propertyForm.oneTime')}</option>
                    <option value="month">{t('propertyForm.perMonth')}</option>
                    <option value="week">{t('propertyForm.perWeek')}</option>
                    <option value="day">{t('propertyForm.perDay')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-dark-blue-500 to-indigo-600 rounded-full mr-3"></span>
                {t('propertyForm.location')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-10 gap-6">
                <div className="md:col-span-2 lg:col-span-10">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.fullAddress')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderAddress')}
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.zipCode')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderZip')}
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.city')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderCity')}
                  />
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.state')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderState')}
                  />
                </div>

                <div className="lg:col-span-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.latitude')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderLatitude')}
                  />
                </div>

                <div className="lg:col-span-5">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.longitude')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderLongitude')}
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-dark-blue-500 to-indigo-600 rounded-full mr-3"></span>
                {t('propertyForm.propertyDetails')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-10 gap-6">
                {formData.property_type !== 'Plot' && (
                  <>
                    <div className="lg:col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('propertyForm.bedrooms')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    required
                    value={formData.bedrooms}
                    onChange={handleChange}
                        className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderBedrooms')}
                  />
                </div>

                    <div className="lg:col-span-3">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('propertyForm.bathrooms')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    required
                    value={formData.bathrooms}
                    onChange={handleChange}
                        className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderBathrooms')}
                  />
                </div>
                  </>
                )}

                <div className={formData.property_type === 'Plot' ? 'lg:col-span-5' : 'lg:col-span-4'}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.area')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="area"
                    required
                    value={formData.area}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder={t('propertyForm.placeholderArea')}
                  />
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.status')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-white"
                  >
                    <option value="available">{t('propertyForm.statusAvailable')}</option>
                    <option value="pending">{t('propertyForm.statusPending')}</option>
                    <option value="sold">{t('propertyForm.statusSold')}</option>
                  </select>
                </div>

                <div className="lg:col-span-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('propertyForm.availability')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="availability_status"
                    required
                    value={formData.availability_status}
                    onChange={handleChange}
                    className="w-full px-5 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-white"
                  >
                    <option value="available">{t('propertyForm.availNow')}</option>
                    <option value="booked">{t('propertyForm.availBooked')}</option>
                    <option value="unavailable">{t('propertyForm.availUnavailable')}</option>
                  </select>
                </div>
              </div>
            </div>

            {formData.property_type !== 'Plot' && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="w-1 h-8 bg-gradient-to-b from-dark-blue-500 to-indigo-600 rounded-full mr-3"></span>
                  {t('propertyForm.amenities')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {AMENITIES_OPTIONS.map(amenity => (
                    <label key={amenity} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border-2 border-gray-200 bg-white hover:border-dark-blue-300 hover:bg-blue-50 transition-all shadow-sm">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                        className="w-5 h-5 text-dark-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-dark-blue-500 focus:ring-offset-2"
                    />
                      <span className="text-sm font-medium text-gray-700">{t(`amenities.${amenity}`)}</span>
                  </label>
                ))}
              </div>
            </div>
            )}

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-dark-blue-500 to-indigo-600 rounded-full mr-3"></span>
                Media
              </h2>
              <div className="space-y-6">
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Image URL (optional)
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder="https://example.com/image.jpg"
                  />
                </div> */}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('propertyForm.uploadImages')} (multiple)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white hover:border-dark-blue-400 hover:bg-blue-50/50 transition-all">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onSelectImages}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-dark-blue-500 file:to-indigo-600 file:text-white hover:file:from-dark-blue-600 hover:file:to-indigo-700 file:cursor-pointer file:shadow-lg"
                  />
                  </div>
                  {imageFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-dark-blue-400 transition-all shadow-md">
                            <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedImage(index)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-700 hover:scale-110"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {t('propertyForm.uploadVideo')} (optional)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-white hover:border-dark-blue-400 hover:bg-blue-50/50 transition-all">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={onSelectVideo}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-gradient-to-r file:from-dark-blue-500 file:to-indigo-600 file:text-white hover:file:from-dark-blue-600 hover:file:to-indigo-700 file:cursor-pointer file:shadow-lg"
                  />
                  </div>
                  {videoFile && (
                    <div className="relative mt-4 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                      <video src={URL.createObjectURL(videoFile)} className="w-full h-48 object-cover" controls />
                      <button type="button" onClick={clearVideo} className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-all">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    (Legacy) Add media by URL
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-xl overflow-hidden border-2 border-gray-200 group-hover:border-dark-blue-400 transition-all shadow-md">
                        {file.type === 'video' ? (
                            <video src={file.url} className="w-full h-full object-cover" controls />
                        ) : (
                            <img src={file.url} alt={file.alt || `media-${index}`} className="w-full h-full object-cover" />
                        )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMediaFile(index)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-700 hover:scale-110"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-lg font-medium">
                          {file.type}
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs font-medium text-gray-700 mb-1">Alt text</label>
                          <input
                            type="text"
                            value={file.alt || ''}
                            onChange={(e) => {
                              const newAlt = e.target.value;
                              setMediaFiles(prev => prev.map((m, i) => i === index ? { ...m, alt: newAlt } : m));
                            }}
                            className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-dark-blue-500 focus:border-dark-blue-500 outline-none"
                            placeholder="Short description"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addMediaFile}
                    className="flex items-center space-x-2 px-6 py-3 border-2 border-dashed border-gray-400 rounded-xl hover:border-dark-blue-500 hover:bg-blue-50 hover:text-dark-blue-600 transition-all font-semibold"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Add Image or Video URL</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-gray-200 pt-8">
              <label className="flex items-center space-x-4 cursor-pointer p-4 rounded-xl border-2 border-gray-200 bg-white hover:border-dark-blue-300 hover:bg-blue-50 transition-all">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-6 h-6 text-dark-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-dark-blue-500 focus:ring-offset-2"
                />
                <span className="text-base font-semibold text-gray-700">
                  {t('propertyForm.markFeatured')}
                </span>
              </label>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-8 border-t-2 border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-dark-blue-600 via-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-dark-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all shadow-xl shadow-dark-blue-500/30 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
              >
                <Save className="w-6 h-6" />
                <span>{loading ? t('propertyForm.saving') : t('propertyForm.savePending')}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-semibold text-lg"
              >
                {t('propertyForm.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi, propertiesApiExtended } from '../lib/api';
import { categoriesApi } from '../lib/api';
import { Save, ArrowLeft, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
      bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
      bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
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
        const updRes = await propertiesApiExtended.update(id, propertyData);
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
          setError(uploadErr?.message || 'Property saved but media upload failed. Please try uploading media again.');
          setLoading(false);
          return;
        }
      }
    } catch (err: any) {
      console.error('[PropertyForm] Save failed', err);
      setError(err?.message || 'Save failed');
      setLoading(false);
      return;
    }

    navigate('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-dark-blue-500 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('propertyForm.backToDashboard')}</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {id && id !== 'new' ? 'Edit Property' : 'Add New Property'}
          </h1>
          <p className="text-gray-600 mb-6">
            Fill in the details below. Your listing will be reviewed before publishing.
          </p>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('propertyForm.basicInfo')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.propertyTitle')}
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderTitle')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.description')}
                  </label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderDescription')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.listingType')}
                  </label>
                  <select
                    name="listing_type"
                    required
                    value={formData.listing_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="buy">{t('propertyForm.forSale')}</option>
                    <option value="rent">{t('propertyForm.forRent')}</option>
                    <option value="vacation">{t('propertyForm.vacation')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.propertyType')}
                  </label>
                  <select
                    name="property_type"
                    required
                    value={formData.property_type}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="House">{t('propertyForm.typeHouse')}</option>
                    <option value="Apartment">{t('propertyForm.typeApartment')}</option>
                    <option value="Villa">{t('propertyForm.typeVilla')}</option>
                    <option value="Townhouse">{t('propertyForm.typeTownhouse')}</option>
                    <option value="Condo">{t('propertyForm.typeCondo')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.categoryOptional')}
                  </label>
                  <select
                    name="categoryId"
                    value={formData.categoryId || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select a category</option>
                    {categories.map(c => (
                      <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.price')}
                  </label>
                  <input
                    type="number"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderPrice')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.pricePer')}
                  </label>
                  <select
                    name="price_per"
                    required
                    value={formData.price_per}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="one_time">{t('propertyForm.oneTime')}</option>
                    <option value="month">{t('propertyForm.perMonth')}</option>
                    <option value="week">{t('propertyForm.perWeek')}</option>
                    <option value="day">{t('propertyForm.perDay')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('propertyForm.location')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.fullAddress')}
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderAddress')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.zipCode')}
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    required
                    value={formData.zipCode}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderZip')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.city')}
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderCity')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.state')}
                  </label>
                  <input
                    type="text"
                    name="state"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderState')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.latitude')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderLatitude')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.longitude')}
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderLongitude')}
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('propertyForm.propertyDetails')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.bedrooms')}
                  </label>
                  <input
                    type="number"
                    name="bedrooms"
                    required
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderBedrooms')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.bathrooms')}
                  </label>
                  <input
                    type="number"
                    name="bathrooms"
                    required
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderBathrooms')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.area')}
                  </label>
                  <input
                    type="number"
                    name="area"
                    required
                    value={formData.area}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                    placeholder={t('propertyForm.placeholderArea')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.status')}
                  </label>
                  <select
                    name="status"
                    required
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="available">{t('propertyForm.statusAvailable')}</option>
                    <option value="pending">{t('propertyForm.statusPending')}</option>
                    <option value="sold">{t('propertyForm.statusSold')}</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.availability')}
                  </label>
                  <select
                    name="availability_status"
                    required
                    value={formData.availability_status}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="available">{t('propertyForm.availNow')}</option>
                    <option value="booked">{t('propertyForm.availBooked')}</option>
                    <option value="unavailable">{t('propertyForm.availUnavailable')}</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">{t('propertyForm.amenities')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {AMENITIES_OPTIONS.map(amenity => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                      className="w-4 h-4 text-dark-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-light-blue-500"
                    />
                    <span className="text-sm text-gray-700">{t(`amenities.${amenity}`)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Media</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.uploadImages')}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={onSelectImages}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-light-blue-50 file:text-dark-blue-600 hover:file:bg-light-blue-100"
                  />
                  {imageFiles.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                      {imageFiles.map((file, index) => (
                        <div key={index} className="relative group">
                          <img src={URL.createObjectURL(file)} alt="" className="w-full h-32 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removeSelectedImage(index)}
                            className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.uploadVideo')}
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={onSelectVideo}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-light-blue-50 file:text-dark-blue-600 hover:file:bg-light-blue-100"
                  />
                  {videoFile && (
                    <div className="relative mt-3">
                      <video src={URL.createObjectURL(videoFile)} className="w-full h-40 object-cover rounded-lg" controls />
                      <button type="button" onClick={clearVideo} className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('propertyForm.legacyAddMedia')}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.type === 'video' ? (
                          <video src={file.url} className="w-full h-32 object-cover rounded-lg" controls />
                        ) : (
                          <img src={file.url} alt={file.alt || `media-${index}`} className="w-full h-32 object-cover rounded-lg" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeMediaFile(index)}
                          className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                          {file.type}
                        </div>
                        <div className="mt-2">
                          <label className="block text-xs text-gray-200">Alt text</label>
                          <input
                            type="text"
                            value={file.alt || ''}
                            onChange={(e) => {
                              const newAlt = e.target.value;
                              setMediaFiles(prev => prev.map((m, i) => i === index ? { ...m, alt: newAlt } : m));
                            }}
                            className="w-full mt-1 text-xs px-2 py-1 rounded bg-white/90"
                            placeholder="Short description for accessibility"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addMediaFile}
                    className="flex items-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-light-blue-500 hover:text-dark-blue-500 transition"
                  >
                    <Plus className="w-5 h-5" />
                    <span>{t('propertyForm.addMediaUrl')}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-5 h-5 text-dark-blue-500 border-gray-300 rounded focus:ring-2 focus:ring-light-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  {t('propertyForm.markFeatured')}
                </span>
              </label>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-8 py-3.5 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition shadow-lg shadow-dark-blue-500/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? t('propertyForm.saving') : t('propertyForm.savePending')}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-8 py-3.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
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

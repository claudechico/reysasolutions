import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { propertiesApi, PropertyDto, categoriesApi, favoritesApi } from '../lib/api';
import { formatPrice } from '../lib/format';
import { MapPin, BedDouble, Bath, Square, Search, SlidersHorizontal, Heart, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
export default function Properties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(8); // show 8 per page when paginating (2 columns x 4 rows)
  const [total, setTotal] = useState<number>(0);
  const [usePagination, setUsePagination] = useState<boolean>(false);
  const [serverLikelyPaged, setServerLikelyPaged] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string | number>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState<Record<string | number, boolean>>({});
  const { t } = useTranslation();

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || '',
    // type removed in favor of categories fetched from backend
    type: searchParams.get('type') || '',
    category: searchParams.get('category') || '',
    categoryId: searchParams.get('categoryId') || '',
    listing_type: searchParams.get('listing_type') || '',
    status: searchParams.get('status') || '', // Filter by status: for_sale, for_rent
    minPrice: '',
    maxPrice: '',
    bedrooms: '',
    bathrooms: ''
  });
  const [categories, setCategories] = useState<Array<{ id: string | number; name: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await categoriesApi.list();
        setCategories(res.categories || []);
      } catch (e: any) {
        console.error('Failed to load categories', e);
        // Connection refused usually means backend is not running
        if (e?.message?.includes('Failed to fetch') || e?.message?.includes('ERR_CONNECTION_REFUSED')) {
          console.warn('Backend API server appears to be unavailable. Make sure the backend is running on port 5558.');
        }
      }
    })();
    loadProperties(page);
    loadFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;
    const userRole = String((user as any).role || '').toLowerCase();
    if (userRole !== 'users') return;
    
    try {
      const res = await favoritesApi.list();
      const favoritePropertyIds = new Set(
        (res.favorites || []).map((f: any) => f.property?.id || f.propertyId)
      );
      setFavoriteIds(favoritePropertyIds);
    } catch (e) {
      console.error('Failed to load favorites', e);
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, propertyId: string | number) => {
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    
    const userRole = String((user as any).role || '').toLowerCase();
    if (userRole !== 'users') return;

    setFavoriteLoading(prev => ({ ...prev, [propertyId]: true }));
    try {
      const isFavorited = favoriteIds.has(propertyId);
      if (isFavorited) {
        // Find the favorite ID and remove it
        const res = await favoritesApi.list();
        const favorite = (res.favorites || []).find((f: any) => 
          (f.property?.id || f.propertyId) === propertyId
        );
        if (favorite) {
          await favoritesApi.remove(favorite.id);
        }
        setFavoriteIds(prev => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
      } else {
        await favoritesApi.create({ propertyId });
        setFavoriteIds(prev => new Set([...prev, propertyId]));
      }
    } catch (e: any) {
      console.error('Failed to toggle favorite', e);
      alert(e?.message || 'Failed to update favorite');
    } finally {
      setFavoriteLoading(prev => {
        const next = { ...prev };
        delete next[propertyId];
        return next;
      });
    }
  };

  const buildQueryParams = (p: number) => {
    const q: Record<string, any> = { page: p, limit };
    // include only non-empty filters
    Object.entries(filters).forEach(([k, v]) => {
      if (v === null || v === undefined) return;
      const s = String(v).trim();
      if (s === '') return;
      // Convert numeric fields to numbers
      if (k === 'categoryId' || k === 'bedrooms' || k === 'bathrooms' || k === 'minPrice' || k === 'maxPrice') {
        const n = Number(s);
        if (!Number.isNaN(n)) {
          q[k] = n;
        }
      } else {
        q[k] = s;
      }
    });
    return q;
  };

  const loadProperties = async (p: number = 1, append: boolean = false) => {
    console.log('[Properties] loadProperties called', { page: p, filters, search: searchParams.toString() });
    console.log('[Properties] Status filter value:', filters.status);
    setLoading(true);
    try {
      // Check if we need client-side filtering (bedrooms, bathrooms, price)
      // Location can be sent to API, but we'll also do client-side filtering for city matching
      const needsClientFiltering = !!(filters.bedrooms?.trim() || filters.bathrooms?.trim() || filters.minPrice?.trim() || filters.maxPrice?.trim());
      
      let params: Record<string, any>;
      if (needsClientFiltering || filters.location?.trim()) {
        // Fetch a larger set for client-side filtering (especially for location/city search)
        params = { page: 1, limit: 1000 };
        if (filters.categoryId) {
          params.categoryId = filters.categoryId;
        }
        if (filters.status) {
          params.status = filters.status;
        }
        // Also send location to API if backend supports it
        if (filters.location?.trim()) {
          params.location = filters.location.trim();
        }
      } else {
        params = buildQueryParams(p);
      }
      
      console.log('[Properties] built query params ->', params);
      console.log('[Properties] Status in query params:', params.status);
      let res: any;
      if (params.categoryId) {
        // call category-specific endpoint and pass other params
        const cid = params.categoryId;
        delete params.categoryId;
        console.log('[Properties] calling getByCategory', cid, params);
        res = await propertiesApi.getByCategory(cid, params as any);
      } else {
        console.log('[Properties] calling list', params);
        res = await propertiesApi.list(params as any);
      }
      if (import.meta.env.DEV) {
        console.log('[Properties] API response', res);
        console.log('[Properties] Debug -> params used for request:', params);
        console.log('[Properties] Debug -> res.pagination:', res?.pagination);
        console.log('[Properties] All properties received:', res?.properties?.length || 0);
      }
      const allProperties = res?.properties || [];
      // Reset serverLikelyPaged when initiating a fresh load (unless appending)
      if (!append) setServerLikelyPaged(false);
      
      // Filter to show only approved properties (moderationStatus === 'approved')
      let approvedProperties = allProperties.filter((property: any) => {
        const moderationStatus = property?.moderationStatus;
        // Only show properties with moderationStatus === 'approved'
        return moderationStatus && String(moderationStatus).toLowerCase() === 'approved';
      });
      
      // Additional client-side filtering by status if status filter is set
      if (filters.status && filters.status.trim() !== '') {
        const statusFilter = filters.status.trim().toLowerCase();
        approvedProperties = approvedProperties.filter((property: any) => {
          const propertyStatus = String(property?.status || '').toLowerCase();
          return propertyStatus === statusFilter;
        });
        console.log('[Properties] After status filtering:', {
          statusFilter,
          remainingCount: approvedProperties.length
        });
      }
      
      // Client-side filtering by location (searches in location, city, address, state)
      if (filters.location && filters.location.trim() !== '') {
        const locationFilter = filters.location.trim().toLowerCase();
        approvedProperties = approvedProperties.filter((property: any) => {
          // Search in multiple fields: location, city, address, state
          const searchableText = [
            property?.location,
            property?.city,
            property?.address,
            property?.state,
            property?.city + ' ' + property?.state, // Combined city and state
            property?.location + ' ' + property?.city // Combined location and city
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return searchableText.includes(locationFilter);
        });
        console.log('[Properties] After location/city filtering:', {
          locationFilter,
          remainingCount: approvedProperties.length
        });
      }
      
      // Client-side filtering by bedrooms
      if (filters.bedrooms && filters.bedrooms.trim() !== '') {
        const bedroomsFilter = Number(filters.bedrooms);
        if (!Number.isNaN(bedroomsFilter)) {
          approvedProperties = approvedProperties.filter((property: any) => {
            const propertyBedrooms = Number(property?.bedrooms || 0);
            return propertyBedrooms >= bedroomsFilter;
          });
          console.log('[Properties] After bedrooms filtering:', {
            bedroomsFilter,
            remainingCount: approvedProperties.length
          });
        }
      }
      
      // Client-side filtering by bathrooms
      if (filters.bathrooms && filters.bathrooms.trim() !== '') {
        const bathroomsFilter = Number(filters.bathrooms);
        if (!Number.isNaN(bathroomsFilter)) {
          approvedProperties = approvedProperties.filter((property: any) => {
            const propertyBathrooms = Number(property?.bathrooms || 0);
            return propertyBathrooms >= bathroomsFilter;
          });
          console.log('[Properties] After bathrooms filtering:', {
            bathroomsFilter,
            remainingCount: approvedProperties.length
          });
        }
      }
      
      // Client-side filtering by price range
      if (filters.minPrice && filters.minPrice.trim() !== '') {
        const minPriceFilter = Number(filters.minPrice);
        if (!Number.isNaN(minPriceFilter)) {
          approvedProperties = approvedProperties.filter((property: any) => {
            const propertyPrice = Number(property?.price || 0);
            return propertyPrice >= minPriceFilter;
          });
        }
      }
      
      if (filters.maxPrice && filters.maxPrice.trim() !== '') {
        const maxPriceFilter = Number(filters.maxPrice);
        if (!Number.isNaN(maxPriceFilter)) {
          approvedProperties = approvedProperties.filter((property: any) => {
            const propertyPrice = Number(property?.price || 0);
            return propertyPrice <= maxPriceFilter;
          });
        }
      }
      
      console.log('[Properties] Approved properties after all filtering:', approvedProperties.length);
      
      // If the API returned pagination metadata we should respect it (server-side paging)
      const serverTotal = res?.pagination?.total;
      const isServerPaged = typeof serverTotal === 'number' && params && params.limit && params.limit < 1000;
      const isServerLikelyPaged = !res?.pagination && params && params.limit && params.limit < 1000 && allProperties.length === params.limit;

      console.log('[Properties] Debug -> serverTotal:', serverTotal, 'isServerPaged:', isServerPaged, 'isServerLikelyPaged:', isServerLikelyPaged, 'limit:', params?.limit);

      if (isServerPaged) {
        // Use server-provided total to drive pagination
        const totalCount = serverTotal as number;
        console.log('[Properties] Using server-side pagination. server total:', totalCount);
        setTotal(totalCount);
        setUsePagination(totalCount >= 8);
        // Properties returned by the server are already the current page; show them after filtering by moderation
        const start = (p - 1) * limit;
        const end = start + limit;
        // If server returned only a page, approvedProperties already contains that page; map directly
        const paginatedProperties = approvedProperties.slice(0, limit);
        if (import.meta.env.DEV) {
          console.log('[Properties] Server returned a page. approvedProperties (after moderation) length:', approvedProperties.length, 'paginated length:', paginatedProperties.length);
        }
        if (append) {
          setProperties(prev => [...prev, ...paginatedProperties]);
          setPage(prev => prev + 1);
        } else {
          setProperties(paginatedProperties);
          setPage(p);
        }
      } else {
        // Client-side data (we fetched a large set) — decide pagination based on total count
        console.log('[Properties] Client-side data. approvedProperties length:', approvedProperties.length);
        // If server likely paged (no pagination metadata but returned exactly 'limit' items), offer load more behaviour
        if (isServerLikelyPaged) {
          setServerLikelyPaged(true);
        }
        if (approvedProperties.length < 8) {
          setUsePagination(false);
          setProperties(approvedProperties);
          setTotal(approvedProperties.length);
          setPage(1);
        } else {
          setUsePagination(true);
          // Apply pagination after filtering
          const start = (p - 1) * limit;
          const end = start + limit;
          const paginatedProperties = approvedProperties.slice(start, end);
          console.log('[Properties] Client-side pagination active. total:', approvedProperties.length, 'page:', p, 'start:', start, 'end:', end, 'pageLength:', paginatedProperties.length);
          if (append) {
            setProperties(prev => [...prev, ...paginatedProperties]);
            setPage(prev => prev + 1);
            setTotal(prev => prev + paginatedProperties.length);
          } else {
            setProperties(paginatedProperties);
            setTotal(approvedProperties.length);
            setPage(p);
          }
        }
      }
    } catch (e: any) {
      console.error('Failed to load properties', e);
      // Connection refused usually means backend is not running
      if (e?.message?.includes('Failed to fetch') || e?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend API server appears to be unavailable. Make sure the backend is running on port 5558.');
      }
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // If the URL search params change (e.g. user navigates to /properties?category=...&categoryId=...)
  // reload properties and sync filters so the page reflects the query string.
  useEffect(() => {
    const s = searchParams.toString();
    console.log('[Properties] searchParams changed ->', s);
    // sync filters from URL
    setFilters(prev => ({
      ...prev,
      location: searchParams.get('location') || prev.location,
      type: searchParams.get('type') || prev.type,
      category: searchParams.get('category') || prev.category,
      categoryId: searchParams.get('categoryId') || prev.categoryId,
      listing_type: searchParams.get('listing_type') || prev.listing_type,
      status: searchParams.get('status') || prev.status,
    }));
    // reload first page for new params
    setPage(1);
    loadProperties(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = () => {
    // Reset to first page when searching
    setPage(1);
    // update URL search params so links are shareable
    const sp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v != null && String(v).trim() !== '') sp.set(k, String(v));
    });
    // push params to URL without reloading
    const query = sp.toString();
    if (query) {
      navigate({ pathname: '/properties', search: `?${query}` });
    } else {
      navigate('/properties');
    }
    loadProperties(1);
  };

  const totalPages = usePagination ? Math.max(1, Math.ceil(total / limit)) : 1;

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    // When switching pages via numbered pagination, perform a fresh load
    loadProperties(p, false);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      type: '',
      category: '',
      categoryId: '',
      listing_type: '',
      status: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: ''
    });
    setTimeout(() => loadProperties(), 100);
  };

  // Helper to render a single property card (kept in one place for both layouts)
  const renderPropertyCard = (property: PropertyDto) => (
    <div
      key={String(property.id)}
      onClick={() => navigate(`/properties/${property.id}`)}
      className="card-elevated overflow-hidden group cursor-pointer hover-lift animate-fade-in"
    >
      <div className="relative overflow-hidden">
        {(() => {
          const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:5558';
          const toUrl = (path: string) => path.startsWith('http') ? path : `${base}/${path.startsWith('uploads') ? path : `uploads/${path}`}`;
          const firstImageFromArray = (arr: any[]) => {
            if (!Array.isArray(arr) || arr.length === 0) return '';
            const item = arr[0];
            if (typeof item === 'string') return toUrl(item);
            if (item?.path) return toUrl(item.path);
            if (item?.media_url && (!item.media_type || item.media_type === 'image')) return toUrl(item.media_url);
            return '';
          };
          const cover = firstImageFromArray((property as any).images)
            || firstImageFromArray((property as any).media)
            || (property as any).image_url
            || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
          const placeholder = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
          return (
            <img
              src={cover}
              alt={property.title}
              className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => { if ((e.currentTarget as HTMLImageElement).src !== placeholder) (e.currentTarget as HTMLImageElement).src = placeholder; }}
            />
          );
        })()}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        {(property as any).featured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm">
            ⭐ Featured
          </div>
        )}
        <div className="absolute top-4 right-4 flex items-center space-x-2">
          <div className="bg-white/95 backdrop-blur-md text-dark-blue-600 px-4 py-2 rounded-xl text-sm font-bold shadow-xl">
            Tsh {formatPrice((property as any).price)}
          </div>
          {user && String((user as any).role || '').toLowerCase() === 'users' && (
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(e, property.id); }}
              disabled={favoriteLoading[property.id]}
              className="bg-white p-2.5 rounded-full shadow-lg hover:bg-red-50 transition-all disabled:opacity-50"
              title={favoriteIds.has(property.id) ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart 
                className={`w-5 h-5 transition-all ${
                  favoriteIds.has(property.id) 
                    ? 'text-red-600 fill-red-600' 
                    : 'text-gray-400 hover:text-red-600'
                }`}
              />
            </button>
          )}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{(property as any).title}</h3>
        <div className="flex items-center text-gray-600 mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">{(property as any).city}, {(property as any).state}</span>
        </div>
        <div className="flex items-center justify-between text-gray-600 border-t border-gray-100 pt-4">
          <div className="flex items-center">
            <BedDouble className="w-4 h-4 mr-1 text-light-blue-500" />
            <span className="text-sm font-medium">{(property as any).bedrooms}</span>
          </div>
          <div className="flex items-center">
            <Bath className="w-4 h-4 mr-1 text-light-blue-500" />
            <span className="text-sm font-medium">{(property as any).bathrooms}</span>
          </div>
          <div className="flex items-center">
            <Square className="w-4 h-4 mr-1 text-light-blue-500" />
            <span className="text-sm font-medium">{(property as any).area} sqft</span>
          </div>
          <div className="flex items-center">
            <Eye className="w-4 h-4 mr-1 text-light-blue-500" />
            <span className="text-sm font-medium">{(property as any).view_count || (property as any).views || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-16 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-[90rem] w-11/12 md:w-10/12 mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('nav.browse3')}
          </h1>
          <p className="text-xl text-gray-600">
          {t('nav.browse4')}
          </p>
        </div>

        <div className="card-elevated p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gradient">{t('property.searchFilter')}</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-light-blue-50 text-dark-blue-600 hover:bg-light-blue-100 transition font-medium"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>{showFilters ? t('property.hideFilters') : t('property.showFilters')}</span>
            </button>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2 lg:col-span-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  placeholder={t('property.searchPlaceholder')}
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <select
              name="categoryId"
              value={filters.categoryId}
              onChange={handleFilterChange}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
            >
              <option value="">{t('property.filters.allCategories')}</option>
              {categories.map(c => (
                <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-light-blue-500 focus:border-transparent outline-none"
            >
              <option value="">{t('property.filters.allTypes')}</option>
              <option value="for_sale">{t('property.filters.forSale')}</option>
              <option value="for_rent">{t('property.filters.forRent')}</option>
            </select>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-gray-200">
              <input
                type="number"
                name="minPrice"
                placeholder={t('property.minPrice')}
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="input-professional"
              />
              <input
                type="number"
                name="maxPrice"
                placeholder={t('property.maxPrice')}
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="input-professional"
              />
              <input
                type="number"
                name="bedrooms"
                placeholder={t('property.minBedrooms')}
                value={filters.bedrooms}
                onChange={handleFilterChange}
                className="input-professional"
              />
              <input
                type="number"
                name="bathrooms"
                placeholder={t('property.minBathrooms')}
                value={filters.bathrooms}
                onChange={handleFilterChange}
                className="input-professional"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:space-x-4">
            <button
              onClick={handleSearch}
              className="btn-primary flex-1 flex items-center justify-center space-x-1.5 sm:space-x-2 py-2 sm:py-3 text-sm sm:text-base"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{t('property.search')}</span>
            </button>
            <button
              onClick={clearFilters}
              className="btn-secondary px-4 sm:px-8 py-2 sm:py-3 text-sm sm:text-base"
            >
              {t('property.clearAll')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('property.loading')}</p>
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="card-elevated overflow-hidden group cursor-pointer hover-lift animate-fade-in"
                >
                  <div className="relative overflow-hidden">
                    {(() => {
                      const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:5558';
                      const toUrl = (path: string) => path.startsWith('http') ? path : `${base}/${path.startsWith('uploads') ? path : `uploads/${path}`}`;
                      const firstImageFromArray = (arr: any[]) => {
                        if (!Array.isArray(arr) || arr.length === 0) return '';
                        const item = arr[0];
                        if (typeof item === 'string') return toUrl(item);
                        if (item?.path) return toUrl(item.path);
                        if (item?.media_url && (!item.media_type || item.media_type === 'image')) return toUrl(item.media_url);
                        return '';
                      };
                      // Prefer uploaded media over possibly stale external image_url
                      const cover = firstImageFromArray((property as any).images)
                        || firstImageFromArray((property as any).media)
                        || property.image_url
                        || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                      const placeholder = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                      return (
                        <img
                          src={cover}
                          alt={property.title}
                          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { if ((e.currentTarget as HTMLImageElement).src !== placeholder) (e.currentTarget as HTMLImageElement).src = placeholder; }}
                        />
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {property.featured && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm">
                        ⭐ Featured
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <div className="bg-white/95 backdrop-blur-md text-dark-blue-600 px-4 py-2 rounded-xl text-sm font-bold shadow-xl">
                        Tsh {formatPrice(property.price)}
                      </div>
                      {user && String((user as any).role || '').toLowerCase() === 'users' && (
                        <button
                          onClick={(e) => toggleFavorite(e, property.id)}
                          disabled={favoriteLoading[property.id]}
                          className="bg-white p-2.5 rounded-full shadow-lg hover:bg-red-50 transition-all disabled:opacity-50"
                          title={favoriteIds.has(property.id) ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Heart 
                            className={`w-5 h-5 transition-all ${
                              favoriteIds.has(property.id) 
                                ? 'text-red-600 fill-red-600' 
                                : 'text-gray-400 hover:text-red-600'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{property.city}, {property.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 border-t border-gray-100 pt-4">
                      <div className="flex items-center">
                        <BedDouble className="w-4 h-4 mr-1 text-light-blue-500" />
                        <span className="text-sm font-medium">{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1 text-light-blue-500" />
                        <span className="text-sm font-medium">{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Square className="w-4 h-4 mr-1 text-light-blue-500" />
                        <span className="text-sm font-medium">{property.area} sqft</span>
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 mr-1 text-light-blue-500" />
                        <span className="text-sm font-medium">{property.view_count || property.views || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // If we are not paginating (fewer than 8 items), render columns of up to 4 items each.
          !usePagination ? (
            properties.length > 0 ? (
              <div className="flex flex-wrap gap-6 sm:gap-8">
                {(() => {
                  const cols: PropertyDto[][] = [];
                  for (let i = 0; i < properties.length; i += 4) {
                    cols.push(properties.slice(i, i + 4));
                  }
                  return cols.map((col, idx) => (
                    <div key={idx} className="flex flex-col gap-6 w-full sm:w-auto">
                      {col.map(p => renderPropertyCard(p))}
                    </div>
                  ));
                })()}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('property.noPropertiesFound')}</h3>
                <p className="text-gray-600 mb-6">{t('property.tryAdjustingFilters')}</p>
                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-6 py-3 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition shadow-lg shadow-light-blue-500/30"
                >
                  Clear Filters
                </button>
              </div>
            )
          ) : (
            // Paginated view (usePagination === true) - render as 2 columns x up to 4 rows
            properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                {properties.map(p => renderPropertyCard(p))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('property.noPropertiesFound')}</h3>
                <p className="text-gray-600 mb-6">{t('property.tryAdjustingFilters')}</p>
                <button
                  onClick={clearFilters}
                  className="bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-6 py-3 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition shadow-lg shadow-light-blue-500/30"
                >
                  Clear Filters
                </button>
              </div>
            )
          )
        )}
        {/* Pagination controls placed at the bottom of the page */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center space-x-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-2 rounded bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Prev
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const p = idx + 1;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  className={`px-3 py-2 rounded border ${p === page ? 'bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white' : 'bg-white hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-2 rounded bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
        {/* Show Load more when backend likely paginates but doesn't provide pagination metadata */}
        {serverLikelyPaged && (
          <div className="mt-6 flex items-center justify-center">
            <button
              onClick={() => loadProperties(page + 1, true)}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-light-blue-500 to-dark-blue-600 text-white font-semibold shadow-lg hover:opacity-95"
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

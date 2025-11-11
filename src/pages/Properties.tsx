import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { propertiesApi, PropertyDto, categoriesApi, favoritesApi } from '../lib/api';
import { formatPrice } from '../lib/format';
import { MapPin, BedDouble, Bath, Square, Search, SlidersHorizontal, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
export default function Properties() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(9); // show 9 per page
  const [total, setTotal] = useState<number>(0);
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
      // allow numeric categoryId to be passed as number
      if (k === 'categoryId') {
        // if it's numeric string, pass as number
        const n = Number(s);
        q[k] = Number.isNaN(n) ? s : n;
      } else {
        q[k] = s;
      }
    });
    return q;
  };

  const loadProperties = async (p: number = 1) => {
    console.log('[Properties] loadProperties called', { page: p, filters, search: searchParams.toString() });
    setLoading(true);
    try {
      const params = buildQueryParams(p);
      console.log('[Properties] built query params ->', params);
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
      console.log('[Properties] API response', res);
      const list = res?.properties || [];
      setProperties(list);
      setTotal(res?.total || 0);
      setPage(p);
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

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    loadProperties(p);
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      type: '',
      category: '',
      categoryId: '',
      minPrice: '',
      maxPrice: '',
      bedrooms: '',
      bathrooms: ''
    });
    setTimeout(() => loadProperties(), 100);
  };

  return (
  <div className="min-h-screen pt-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('nav.browse3')}
          </h1>
          <p className="text-xl text-gray-600">
          {t('nav.browse4')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Search & Filter</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
            </button>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="md:col-span-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="location"
                  placeholder="Search by city, state, or address"
                  value={filters.location}
                  onChange={handleFilterChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
            <select
              name="categoryId"
              value={filters.categoryId}
              onChange={handleFilterChange}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">{t('property.filters.allCategories')}</option>
              {categories.map(c => (
                <option key={String(c.id)} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-gray-200">
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={handleFilterChange}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <input
                type="number"
                name="bedrooms"
                placeholder="Min Bedrooms"
                value={filters.bedrooms}
                onChange={handleFilterChange}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <input
                type="number"
                name="bathrooms"
                placeholder="Min Bathrooms"
                value={filters.bathrooms}
                onChange={handleFilterChange}
                className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          )}

          <div className="flex space-x-4">
            <button
              onClick={handleSearch}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2"
            >
              <Search className="w-5 h-5" />
              <span>Search</span>
            </button>
            <button
              onClick={clearFilters}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Clear All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading properties...</p>
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="mb-6 text-gray-600">
              Found {properties.length} {properties.length === 1 ? 'property' : 'properties'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group cursor-pointer"
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
                    {property.featured && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                        Featured
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex items-center space-x-2">
                      <div className="bg-white text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
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
                        <BedDouble className="w-4 h-4 mr-1 text-blue-600" />
                        <span className="text-sm font-medium">{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1 text-blue-600" />
                        <span className="text-sm font-medium">{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Square className="w-4 h-4 mr-1 text-blue-600" />
                        <span className="text-sm font-medium">{property.area} sqft</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your search filters</p>
            <button
              onClick={clearFilters}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30"
            >
              Clear Filters
            </button>
          </div>
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
                  className={`px-3 py-2 rounded border ${p === page ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}
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
      </div>
    </div>
  );
}

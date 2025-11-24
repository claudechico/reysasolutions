import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { favoritesApi, PropertyDto } from '../lib/api';
import { formatPrice } from '../lib/format';
import { Heart, MapPin, BedDouble, Bath, Square } from 'lucide-react';

export default function Favorites() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Array<{ id: string | number; property: PropertyDto }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Only users with role "users" can view favorites
    const userRole = String((user as any).role || '').toLowerCase();
    if (userRole !== 'users') {
      navigate('/properties');
      return;
    }
    loadFavorites();
  }, [user, navigate]);

  const loadFavorites = async () => {
    const res = await favoritesApi.list();
    setFavorites(res.favorites || []);
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string | number) => {
    await favoritesApi.remove(String(favoriteId));
    loadFavorites();
  };

  if (loading) {
    return (
  <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading favorites...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-600 mb-8">Properties you've saved for later</p>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((favorite) => {
              const property = favorite.property;
              return (
                <div
                  key={favorite.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group relative"
                >
                  <button
                    onClick={() => removeFavorite(favorite.id)}
                    className="absolute top-4 right-4 z-10 bg-white p-2 rounded-full shadow-lg hover:bg-red-50 transition group"
                  >
                    <Heart className="w-5 h-5 text-red-600 fill-red-600" />
                  </button>

                  <div
                    className="relative overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/properties/${property.id}`)}
                  >
                    {(() => {
                      const base = (import.meta as any).env.VITE_API_URL || 'http://localhost:5558';
                      const toUrl = (path: string) => path?.startsWith('http') ? path : `${base}/${path?.startsWith('uploads') ? path : `uploads/${path}`}`;
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
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                        Featured
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 bg-white text-dark-blue-600 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      Tsh {formatPrice(property.price)}
                      {property.price_per && property.price_per !== 'one_time' && `/${property.price_per}`}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-light-blue-100 text-dark-blue-600 rounded">
                        {property.listing_type === 'buy' ? 'For Sale' : property.listing_type === 'rent' ? 'For Rent' : 'Vacation'}
                      </span>
                    </div>
                    <h3
                      className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-dark-blue-500"
                      onClick={() => navigate(`/properties/${property.id}`)}
                    >
                      {property.title}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{property.city}, {property.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 border-t border-gray-100 pt-4">
                      <div className="flex items-center">
                        <BedDouble className="w-4 h-4 mr-1 text-dark-blue-500" />
                        <span className="text-sm font-medium">{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Bath className="w-4 h-4 mr-1 text-dark-blue-500" />
                        <span className="text-sm font-medium">{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center">
                        <Square className="w-4 h-4 mr-1 text-dark-blue-500" />
                        <span className="text-sm font-medium">{property.area} sqft</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              Start browsing properties and save your favorites for later
            </p>
            <button
              onClick={() => navigate('/properties')}
              className="bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition"
            >
              Browse Properties
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { Search, MapPin, BedDouble, Bath, Square, TrendingUp, Shield, Award, Users, Eye, Home as HomeIcon, Building2, Hotel, LandPlot, Building, Store, Briefcase, Factory, Warehouse } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi, PropertyDto, categoriesApi, CategoryDto, usersApi } from '../lib/api';
import { formatPrice } from '../lib/format';
import AdvertisementBanner from '../components/AdvertisementBanner';
import { useTranslation } from 'react-i18next';
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



function resolvePropertyImage(property: PropertyDto) {
  // Prefer uploaded images first
  if (property.images && Array.isArray(property.images) && property.images.length > 0) {
    const first = property.images[0];
    if (!first) return null;
    if (typeof first === 'string') return toUrl(first) || null;
    if (first && typeof first === 'object') {
      const imgObj = first as { path?: string; media_url?: string; url?: string; filename?: string };
      if (imgObj.path) return toUrl(imgObj.path) || null;
      if (imgObj.media_url) return toUrl(imgObj.media_url) || null;
      if (imgObj.url) return toUrl(imgObj.url) || null;
      if (imgObj.filename) return toUrl(`/uploads/properties/images/${imgObj.filename}`) || null;
    }
  }

  // Check media array (alternative name)
  const propertyWithMedia = property as PropertyDto & { media?: Array<string | { path?: string; media_url?: string; url?: string; filename?: string }> };
  if (propertyWithMedia.media && Array.isArray(propertyWithMedia.media) && propertyWithMedia.media.length > 0) {
    const first = propertyWithMedia.media[0];
    if (typeof first === 'string') return toUrl(first) || null;
    if (first && typeof first === 'object') {
      if (first.path) return toUrl(first.path) || null;
      if (first.media_url) return toUrl(first.media_url) || null;
      if (first.url) return toUrl(first.url) || null;
      if (first.filename) return toUrl(`/uploads/properties/images/${first.filename}`) || null;
    }
  }

  // Fall back to explicit image_url last
  if (property.image_url) {
    const u = toUrl(property.image_url);
    if (u) return u;
  }

  return null;
}

// Function to get category-specific icon
function getCategoryIcon(categoryName: string) {
  const name = categoryName.toLowerCase().trim();
  
  if (name.includes('house') || name.includes('home') || name.includes('villa')) {
    return HomeIcon;
  } else if (name.includes('apartment') || name.includes('flat') || name.includes('condo')) {
    return Building2;
  } else if (name.includes('hotel') || name.includes('resort')) {
    return Hotel;
  } else if (name.includes('plot') || name.includes('land') || name.includes('viwanja')) {
    return LandPlot;
  } else if (name.includes('commercial') || name.includes('shop') || name.includes('store')) {
    return Store;
  } else if (name.includes('office')) {
    return Briefcase;
  } else if (name.includes('factory') || name.includes('industrial')) {
    return Factory;
  } else if (name.includes('warehouse') || name.includes('storage')) {
    return Warehouse;
  } else if (name.includes('building')) {
    return Building;
  }
  
  // Default icon
  return MapPin;
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyDto[]>([]);
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [stats, setStats] = useState({
    propertiesListed: 0,
    happyClients: 0,
    expertAgents: 0,
    yearsExperience: '15+'
  });
  const { t } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    // if the signed-in user is an admin, send them to the admin dashboard
    // unless the URL explicitly includes `skipAdminRedirect=1` (used when admin clicks Home)
    const params = new URLSearchParams(location.search || '');
    const skip = params.get('skipAdminRedirect') === '1' || params.get('view') === 'public';
    if (user) {
      const userRole = user as { role?: string };
      const role = String(userRole?.role || '').toLowerCase();
      if (role === 'admin' && !skip) {
        navigate('/admin');
        return;
      }
    }

    // Always load these regardless of login status
    loadProperties();
    loadCategories();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProperties = async () => {
    try {
      const res = await propertiesApi.list({ page: 1, limit: 4 });
      if (import.meta.env.DEV) {
        console.log('[Home] API response:', res);
        console.log('[Home] All properties received:', res?.properties?.length || 0);
      }
      if (res?.properties) {
        // Filter to show only approved properties (moderationStatus === 'approved')
        const approvedProperties = res.properties.filter((property: PropertyDto & { moderationStatus?: string }) => {
          const moderationStatus = property?.moderationStatus;
          // Only show properties with moderationStatus === 'approved'
          return moderationStatus && String(moderationStatus).toLowerCase() === 'approved';
        });
        if (import.meta.env.DEV) {
          console.log('[Home] Approved properties after filtering:', approvedProperties.length);
        }
        setProperties(approvedProperties);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load properties', err);
        // Connection refused usually means backend is not running
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
          console.warn('Backend API server appears to be unavailable. Make sure the backend is running on port 5558.');
        }
      }
    }
  };

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.list();
      if (res?.categories) setCategories(res.categories);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load categories', err);
        // Connection refused usually means backend is not running
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED')) {
          console.warn('Backend API server appears to be unavailable. Make sure the backend is running on port 5558.');
        }
      }
    }
  };

  const loadStats = async () => {
    try {
      // Fetch total properties count from backend (only approved properties)
      let propertiesCount = 0;
      try {
        const propsRes = await propertiesApi.list({ page: 1, limit: 1000 }).catch(() => null);
        if (propsRes?.properties) {
          // Count only approved properties
          const approvedCount = propsRes.properties.filter((property: PropertyDto & { moderationStatus?: string }) => {
            const moderationStatus = property?.moderationStatus;
            return moderationStatus && String(moderationStatus).toLowerCase() === 'approved';
          }).length;
          propertiesCount = approvedCount;
        } else if (propsRes?.total) {
          propertiesCount = Number(propsRes.total);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('Failed to load property count', e);
        }
      }

      // Count users (clients) from backend table using public count endpoint (no auth required)
      let clientsCount = 0;
      try {
        const clientsRes = await usersApi.count({ role: 'users' }).catch((e) => {
          if (import.meta.env.DEV) {
            console.warn('Failed to load clients count:', e);
          }
          return null;
        });
        // Backend returns 'count' not 'total'
        if (clientsRes?.count !== undefined) {
          clientsCount = Number(clientsRes.count);
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('Failed to load clients count', e);
        }
        clientsCount = 0;
      }

      // Count agents (owners + agents) from backend tables using public count endpoint (no auth required)
      let agentsCount = 0;
      try {
        // Count owners
        const ownersRes = await usersApi.count({ role: 'owner' }).catch((e) => {
          if (import.meta.env.DEV) {
            console.warn('Failed to load owners count:', e);
          }
          return null;
        });
        const ownersCount = ownersRes?.count !== undefined ? Number(ownersRes.count) : 0;

        // Count agents
        const agentsRes = await usersApi.count({ role: 'agent' }).catch((e) => {
          if (import.meta.env.DEV) {
            console.warn('Failed to load agents count:', e);
          }
          return null;
        });
        const agentsRoleCount = agentsRes?.count !== undefined ? Number(agentsRes.count) : 0;

        agentsCount = ownersCount + agentsRoleCount;
      } catch (e) {
        if (import.meta.env.DEV) {
          console.error('Failed to load agents count', e);
        }
        agentsCount = 0;
      }

      // Update stats with real counts from backend
      setStats({
        propertiesListed: propertiesCount,
        happyClients: clientsCount,
        expertAgents: agentsCount,
        yearsExperience: '15+'
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Failed to load statistics', err);
      }
    }
  };

  

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (categoryId) {
      // include both id and name when available for robust filtering
      const cat = categories.find(c => String(c.id) === String(categoryId));
      if (cat) {
        params.append('categoryId', String(cat.id));
        params.append('category', String(cat.name));
      } else {
        params.append('categoryId', String(categoryId));
      }
    }
    navigate(`/properties?${params.toString()}`);
  };

  const features = [
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: t('nav.smart'),
      description: t('nav.smart2')
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: t('nav.trustedService'),
      description: t('nav.trustedServiceDesc')
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: t('nav.premiumQuality'),
      description: t('nav.premiumQualityDesc')
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t('nav.expertTeam'),
      description: t('nav.expertTeamDesc')
    }
  ];

  return (
    <div>
  <section id="home" className="pt-12 sm:pt-16 md:pt-20 pb-6 sm:pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-dark-blue-700 via-dark-blue-500 to-light-blue-300">
        <div className="max-w-[90rem] mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight px-2 text-balance">
              {t('nav.dream')}
            </h3>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-light-blue-100 max-w-2xl mx-auto mb-4 sm:mb-6 md:mb-8 px-2 leading-relaxed text-pretty">
           {t('nav.dream2')}
            </p>

            <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-lg rounded-2xl sm:rounded-3xl shadow-2xl shadow-light-blue-500/20 p-4 sm:p-6 md:p-8 border border-white/20 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-light-blue-500" />
                    <input
                      type="text"
                      placeholder={t('nav.location')}
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="input-professional pl-10 sm:pl-12 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="input-professional text-sm sm:text-base"
                >
                  <option value="">{t('nav.allCategories')}</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleSearch}
                  className="btn-primary flex items-center justify-center space-x-1.5 sm:space-x-2 text-sm sm:text-base px-4 sm:px-6 py-2.5 sm:py-3"
                >
                  <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{t('nav.search')}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-8 sm:mt-12 md:mt-16">
            <div className="card-elevated p-4 sm:p-6 text-center hover-lift animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-2 sm:mb-3 leading-tight">
                {stats.propertiesListed > 0 ? stats.propertiesListed.toLocaleString() : '10K+'}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed">{t('nav.propertiesListed')}</div>
            </div>
            <div className="card-elevated p-4 sm:p-6 text-center hover-lift animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-2 sm:mb-3 leading-tight">
                {stats.happyClients > 0 ? stats.happyClients.toLocaleString() : '5K+'}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed">{t('nav.happyClients')}</div>
            </div>
            <div className="card-elevated p-4 sm:p-6 text-center hover-lift animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-2 sm:mb-3 leading-tight">
                {stats.expertAgents > 0 ? stats.expertAgents.toLocaleString() : '500+'}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed">{t('nav.expertAgents')}</div>
            </div>
            <div className="card-elevated p-4 sm:p-6 text-center hover-lift animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gradient mb-2 sm:mb-3 leading-tight">
                {stats.yearsExperience}
              </div>
              <div className="text-xs sm:text-sm font-medium text-gray-600 leading-relaxed">{t('nav.yearsExperience')}</div>
            </div>
          </div>
          </div>
      </section>

      <AdvertisementBanner />

      <section id="categories" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-[90rem] mx-auto">
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">{t('nav.browse')}</h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto px-4">{t('nav.browse2')}</p>
          </div>

                {categories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5 md:gap-6 lg:gap-8">
              {categories.map((c) => {
                const IconComponent = getCategoryIcon(c.name);
                return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/properties?category=${encodeURIComponent(String(c.name))}&categoryId=${encodeURIComponent(String(c.id))}`)}
                    className="card-elevated p-5 sm:p-6 md:p-7 lg:p-8 cursor-pointer hover-lift group min-w-0 flex flex-col items-center text-center"
                >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-light-blue-500 to-dark-blue-500 rounded-xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform shadow-lg flex-shrink-0 mx-auto">
                      <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gradient mb-2 sm:mb-3 leading-tight break-words w-full">{c.name}</h3>
                    {c.description && <p className="text-sm sm:text-base text-gray-600 leading-relaxed line-clamp-2 break-words w-full">{c.description}</p>}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">{t('nav.noCategories')}</p>
            </div>
          )}
        </div>
      </section>

      <section id="properties" className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[90rem] mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {t('nav.featured')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
                {t('nav.mot')}
            </p>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="card-elevated overflow-hidden group cursor-pointer hover-lift animate-fade-in"
                >
                  <div className="relative overflow-hidden h-48 sm:h-56 md:h-64">
                    <img
                      src={resolvePropertyImage(property) || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800'}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        const ph = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                        if ((e.currentTarget as HTMLImageElement).src !== ph) (e.currentTarget as HTMLImageElement).src = ph;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {property.featured && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl backdrop-blur-sm">
                        ⭐ {t('nav.featured')}
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-dark-blue-600 px-4 py-2 rounded-xl text-sm font-bold shadow-xl">
                      Tsh {formatPrice(property.price)}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-light-blue-600 transition-colors">{property.title}</h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-2 text-light-blue-500" />
                      <span className="text-sm font-medium">{property.city}, {property.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-600 border-t border-gray-100 pt-4">
                      <div className="flex items-center space-x-1">
                        <BedDouble className="w-4 h-4 text-light-blue-500" />
                        <span className="text-sm font-semibold">{property.bedrooms}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bath className="w-4 h-4 text-light-blue-500" />
                        <span className="text-sm font-semibold">{property.bathrooms}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Square className="w-4 h-4 text-light-blue-500" />
                        <span className="text-sm font-semibold">{property.area}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4 text-light-blue-500" />
                        <span className="text-sm font-semibold">{property.view_count || property.views || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">{t('nav.noProperties')}</p>
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/properties')}
              className="btn-primary px-10 py-4 text-lg"
            >
              {t('nav.view')}
            </button>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 leading-tight">
              {t('nav.choose')}
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
              {t('nav.choose2')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-elevated p-5 sm:p-6 md:p-8 group hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-to-br from-light-blue-500 to-dark-blue-500 text-white w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-5 md:mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl shadow-light-blue-500/40">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3 group-hover:text-gradient transition-colors leading-tight">{feature.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-light-blue-500 via-dark-blue-500 to-dark-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDMuMzE0LTIuNjg2IDYtNiA2cy02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiA2IDIuNjg2IDYgNnoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-5 md:mb-6 text-shadow-lg leading-tight px-2">
            {t('nav.ready')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white/90 mb-6 sm:mb-8 md:mb-10 leading-relaxed px-2">
            {t('nav.ready2')}
          </p>
          <div className="flex flex-row sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center px-2">
            <button
              onClick={() => navigate('/contact')}
              className="btn-secondary bg-white text-dark-blue-600 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 text-xs sm:text-sm md:text-base lg:text-lg font-bold whitespace-nowrap"
            >
              {t('nav.scheduleConsultation')}
            </button>
            <button
              onClick={() => navigate('/properties')}
              className="bg-white/10 backdrop-blur-md text-white border-2 border-white/30 px-4 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 rounded-lg sm:rounded-xl hover:bg-white/20 transition-all font-bold text-xs sm:text-sm md:text-base lg:text-lg shadow-xl hover:scale-105 whitespace-nowrap"
            >
              {t('nav.browse3')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

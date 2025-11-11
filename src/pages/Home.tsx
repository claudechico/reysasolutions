import { Search, MapPin, BedDouble, Bath, Square, TrendingUp, Shield, Award, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi, PropertyDto, categoriesApi, CategoryDto, adminUsersApi } from '../lib/api';
import { formatPrice } from '../lib/format';
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
    if (first.path) return toUrl(first.path) || null;
    if (first.media_url) return toUrl(first.media_url) || null;
    if (first.url) return toUrl(first.url) || null;
    if (first.filename) return toUrl(`/uploads/properties/images/${first.filename}`) || null;
  }

  // Check media array (alternative name)
  const anyProp: any = property as any;
  if (anyProp.media && Array.isArray(anyProp.media) && anyProp.media.length > 0) {
    const first = anyProp.media[0];
    if (typeof first === 'string') return toUrl(first) || null;
    if (first.path) return toUrl(first.path) || null;
    if (first.media_url) return toUrl(first.media_url) || null;
    if (first.url) return toUrl(first.url) || null;
    if (first.filename) return toUrl(`/uploads/properties/images/${first.filename}`) || null;
  }

  // Fall back to explicit image_url last
  if (property.image_url) {
    const u = toUrl(property.image_url as any);
    if (u) return u;
  }

  return null;
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
  useEffect(() => {
    // if the signed-in user is an admin, send them to the admin dashboard
    if (user) {
      const role = String((user as any).role || '').toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
        return;
      }
    }

    loadProperties();
    loadCategories();
    loadStats();
  }, []);

  const loadProperties = async () => {
    try {
      const res = await propertiesApi.list({ page: 1, limit: 4 });
      if (res?.properties) setProperties(res.properties);
    } catch (err: any) {
      console.error('Failed to load properties', err);
      // Connection refused usually means backend is not running
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend API server appears to be unavailable. Make sure the backend is running on port 5558.');
      }
    }
  };

  const loadCategories = async () => {
    try {
      const res = await categoriesApi.list();
      if (res?.categories) setCategories(res.categories);
    } catch (err: any) {
      console.error('Failed to load categories', err);
      // Connection refused usually means backend is not running
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend API server appears to be unavailable. Make sure the backend is running on port 5558.');
      }
    }
  };

  const loadStats = async () => {
    try {
      // Try to get analytics data first for properties
      const analyticsRes: any = await adminUsersApi.analytics().catch(() => null);
      
      let propertiesCount = 0;
      if (analyticsRes?.analytics?.totalProperties) {
        propertiesCount = Number(analyticsRes.analytics.totalProperties);
      } else {
        // Fetch total properties count from backend
        try {
          const propsRes: any = await propertiesApi.list({ page: 1, limit: 1 }).catch(() => null);
          propertiesCount = propsRes?.total || 0;
        } catch (e) {
          console.error('Failed to load property count', e);
        }
      }

      // Count users (clients) from backend table using count endpoint
      let clientsCount = 0;
      try {
        const clientsRes: any = await adminUsersApi.count({ role: 'users' }).catch(() => null);
        if (clientsRes?.total !== undefined) {
          clientsCount = Number(clientsRes.total);
        }
      } catch (e) {
        console.error('Failed to load clients count', e);
      }

      // Count agents (owners + agents) from backend tables using count endpoint
      let agentsCount = 0;
      try {
        // Count owners
        const ownersRes: any = await adminUsersApi.count({ role: 'owner' }).catch(() => null);
        const ownersCount = ownersRes?.total ? Number(ownersRes.total) : 0;

        // Count agents
        const agentsRes: any = await adminUsersApi.count({ role: 'agent' }).catch(() => null);
        const agentsRoleCount = agentsRes?.total ? Number(agentsRes.total) : 0;

        agentsCount = ownersCount + agentsRoleCount;
      } catch (e) {
        console.error('Failed to load agents count', e);
      }

      // Update stats with real counts from backend
      setStats({
        propertiesListed: propertiesCount,
        happyClients: clientsCount,
        expertAgents: agentsCount,
        yearsExperience: '15+'
      });
    } catch (err: any) {
      console.error('Failed to load statistics', err);
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
      title: 'Trusted Service',
      description: 'Transparent process with legal support at every step'
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: 'Premium Quality',
      description: 'Curated selection of high-quality properties'
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'Expert Team',
      description: 'Professional agents with years of experience'
    }
  ];

  return (
    <div>
  <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 via-blue-700 to-blue-300">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {t('nav.dream')}
              
            </h3>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
           {t('nav.dream2')}
            </p>

            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl shadow-blue-600/10 p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Location"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30"
                >
                  <Search className="w-5 h-5" />
                  <span className="font-medium">Search</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            <div className="bg-white rounded-xl p-6 text-center shadow-lg shadow-blue-600/5 border border-gray-100">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                {stats.propertiesListed > 0 ? stats.propertiesListed.toLocaleString() : '10K+'}
              </div>
              <div className="text-gray-600">Properties Listed</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-lg shadow-blue-600/5 border border-gray-100">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                {stats.happyClients > 0 ? stats.happyClients.toLocaleString() : '5K+'}
              </div>
              <div className="text-gray-600">Happy Clients</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-lg shadow-blue-600/5 border border-gray-100">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                {stats.expertAgents > 0 ? stats.expertAgents.toLocaleString() : '500+'}
              </div>
              <div className="text-gray-600">Expert Agents</div>
            </div>
            <div className="bg-white rounded-xl p-6 text-center shadow-lg shadow-blue-600/5 border border-gray-100">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-2">
                {stats.yearsExperience}
              </div>
              <div className="text-gray-600">Years Experience</div>
            </div>
          </div>
          </div>
      </section>

      <section id="categories" className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{t('nav.browse')}</h2>
            <p className="text-gray-600">{t('nav.browse2')}</p>
          </div>

                {categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/properties?category=${encodeURIComponent(String(c.name))}&categoryId=${encodeURIComponent(String(c.id))}`)}
                  className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-2xl shadow hover:shadow-lg transition cursor-pointer border border-gray-100"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{c.name}</h3>
                  {c.description && <p className="text-sm text-gray-600 mt-2">{c.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">No categories available.</p>
            </div>
          )}
        </div>
      </section>

      <section id="properties" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('nav.featured')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {t('nav.mot')}
            </p>
          </div>

          {properties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {properties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => navigate(`/properties/${property.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group cursor-pointer"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={resolvePropertyImage(property) || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800'}
                      alt={property.title}
                      className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        const ph = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                        if ((e.currentTarget as HTMLImageElement).src !== ph) (e.currentTarget as HTMLImageElement).src = ph;
                      }}
                    />
                    {property.featured && (
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                        Featured
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white text-blue-700 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                      Tsh {formatPrice(property.price)}
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
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No properties available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <button
              onClick={() => navigate('/properties')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 font-medium"
            >
           {t('nav.view')}
            </button>
          </div>
        </div>
      </section>

      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('nav.choose')}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('nav.choose2')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group"
              >
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-600/30">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('nav.ready')}
          </h2>
          <p className="text-xl text-blue-100 mb-8">
          {t('nav.ready2')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/contact')}
              className="bg-white text-blue-700 px-8 py-4 rounded-lg hover:bg-blue-50 transition font-medium shadow-xl"
            >
              Schedule Consultation
            </button>
            <button
              onClick={() => navigate('/properties')}
              className="bg-blue-700 text-white px-8 py-4 rounded-lg hover:bg-blue-800 transition font-medium border-2 border-white/20"
            >
              {t('nav.browse3')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

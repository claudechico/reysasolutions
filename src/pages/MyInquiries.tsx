import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { propertiesApiExtended, inquiriesApi, usersApi } from '../lib/api';
import { MessageCircle, Mail, User, Calendar, MapPin, Eye, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

function MyInquiriesContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<Record<string | number, any[]>>({});
  const [userCache, setUserCache] = useState<Record<string | number, any>>({});
  const [loading, setLoading] = useState(true);
  const [loadingInquiries, setLoadingInquiries] = useState<Record<string | number, boolean>>({});

  useEffect(() => {
    if (user) {
      loadProperties();
    }
  }, [user]);

  const loadProperties = async () => {
    try {
      const userRole = String((user as any).role || '').toLowerCase();
      // Only owners and agents can view inquiries
      if (userRole !== 'owner' && userRole !== 'agent') {
        navigate('/dashboard');
        return;
      }

      const res = await propertiesApiExtended.getByUser((user as any).id, { page: 1, limit: 1000 });
      const userProperties = (res as any)?.properties || [];
      setProperties(userProperties);
      
      // Load inquiries for all properties
      await Promise.all(
        userProperties.map((property: any) => loadInquiriesForProperty(property.id))
      );
    } catch (err) {
      console.error('Failed to load properties', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInquiriesForProperty = async (propertyId: string | number) => {
    setLoadingInquiries(prev => ({ ...prev, [propertyId]: true }));
    try {
      const res = await inquiriesApi.listByProperty(propertyId);
      const inquiriesList = res.inquiries || [];
      
      // Fetch user information for inquiries that have userId but no name/email
      const userIdsToFetch = new Set<number>();
      inquiriesList.forEach((inquiry: any) => {
        if (inquiry.userId && !inquiry.name && !inquiry.email && !userCache[inquiry.userId]) {
          userIdsToFetch.add(inquiry.userId);
        }
      });

      // Fetch user information in parallel
      if (userIdsToFetch.size > 0) {
        const userPromises = Array.from(userIdsToFetch).map(async (userId) => {
          try {
            const userRes = await usersApi.get(userId);
            return { userId, user: userRes.user };
          } catch (err) {
            console.error(`Failed to fetch user ${userId}`, err);
            return { userId, user: null };
          }
        });

        const userResults = await Promise.all(userPromises);
        const newUserCache: Record<string | number, any> = {};
        userResults.forEach(({ userId, user }) => {
          if (user) {
            newUserCache[userId] = user;
          }
        });
        setUserCache(prev => ({ ...prev, ...newUserCache }));
      }

      setInquiries(prev => ({
        ...prev,
        [propertyId]: inquiriesList
      }));
    } catch (err) {
      console.error(`Failed to load inquiries for property ${propertyId}`, err);
      setInquiries(prev => ({
        ...prev,
        [propertyId]: []
      }));
    } finally {
      setLoadingInquiries(prev => {
        const next = { ...prev };
        delete next[propertyId];
        return next;
      });
    }
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'N/A';
    }
  };

  const totalInquiries = Object.values(inquiries).reduce((sum, propInquiries) => sum + propInquiries.length, 0);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading inquiries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-gray-600 hover:text-dark-blue-500 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">My Property Inquiries</h1>
          <p className="text-gray-600">View and manage inquiries from potential customers about your properties</p>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-r from-light-blue-500 to-dark-blue-600 rounded-2xl p-6 mb-8 text-white shadow-xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold mb-1">{properties.length}</div>
              <div className="text-light-blue-100 text-sm">Total Properties</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">{totalInquiries}</div>
              <div className="text-light-blue-100 text-sm">Total Inquiries</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-1">
                {properties.filter(p => (inquiries[p.id] || []).length > 0).length}
              </div>
              <div className="text-light-blue-100 text-sm">Properties with Inquiries</div>
            </div>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600 mb-6">You haven't listed any properties yet.</p>
            <button
              onClick={() => navigate('/dashboard/properties/new')}
              className="bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-6 py-3 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition shadow-lg shadow-light-blue-500/30"
            >
              List Your First Property
            </button>
          </div>
        ) : totalInquiries === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inquiries Yet</h3>
            <p className="text-gray-600 mb-6">You haven't received any inquiries on your properties.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {properties.map((property) => {
              const propertyInquiries = inquiries[property.id] || [];
              if (propertyInquiries.length === 0) return null;

              return (
                <div key={property.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-light-blue-50 to-white p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h2>
                        <div className="flex items-center text-gray-600 text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span>{property.city}{property.state ? `, ${property.state}` : ''}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/properties/${property.id}`)}
                        className="flex items-center space-x-2 text-light-blue-600 hover:text-light-blue-700 transition font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Property</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Inquiries ({propertyInquiries.length})
                      </h3>
                      {loadingInquiries[property.id] && (
                        <Loader2 className="w-5 h-5 animate-spin text-light-blue-500" />
                      )}
                    </div>

                    <div className="space-y-4">
                      {propertyInquiries.map((inquiry: any) => (
                        <div
                          key={inquiry.id}
                          className="border border-gray-200 rounded-xl p-5 hover:border-light-blue-300 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="bg-gradient-to-br from-light-blue-500 to-dark-blue-500 text-white w-12 h-12 rounded-xl flex items-center justify-center">
                                <User className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {(() => {
                                    // Priority: inquiry.name > cached user info > inquiry.user > userId lookup > Anonymous
                                    if (inquiry.name) return inquiry.name;
                                    
                                    // Check cached user info from userId
                                    if (inquiry.userId && userCache[inquiry.userId]) {
                                      const cachedUser = userCache[inquiry.userId];
                                      return cachedUser.name || cachedUser.full_name || cachedUser.email || 'Anonymous';
                                    }
                                    
                                    // Check if user object is included in inquiry
                                    if (inquiry.user) {
                                      const user = inquiry.user;
                                      return user.name || user.full_name || user.email || 'Anonymous';
                                    }
                                    
                                    return 'Anonymous';
                                  })()}
                                </h4>
                                {(() => {
                                  // Priority: inquiry.email > cached user email > inquiry.user email
                                  let email = inquiry.email;
                                  
                                  if (!email && inquiry.userId && userCache[inquiry.userId]) {
                                    email = userCache[inquiry.userId].email;
                                  }
                                  
                                  if (!email && inquiry.user?.email) {
                                    email = inquiry.user.email;
                                  }
                                  
                                  if (email) {
                                    return (
                                      <div className="flex items-center text-sm text-gray-600 mt-1">
                                        <Mail className="w-3 h-3 mr-1" />
                                        <span>{email}</span>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center text-xs text-gray-500 mb-1">
                                <Calendar className="w-3 h-3 mr-1" />
                                <span>{formatDate(inquiry.createdAt || inquiry.created_at)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-2">
                              <MessageCircle className="w-5 h-5 text-light-blue-500 flex-shrink-0 mt-0.5" />
                              <p className="text-gray-700 whitespace-pre-wrap">{inquiry.message}</p>
                            </div>
                          </div>

                          {inquiry.user && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-xs text-gray-500">
                                From registered user: {inquiry.user.name || inquiry.user.full_name || inquiry.user.email}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyInquiries() {
  return (
    <ProtectedRoute>
      <MyInquiriesContent />
    </ProtectedRoute>
  );
}


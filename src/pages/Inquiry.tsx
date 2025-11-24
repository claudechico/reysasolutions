import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertiesApi, inquiriesApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, ArrowLeft, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Inquiry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    message: ''
  });

  useEffect(() => {
    if (id) {
      loadProperty();
    }
  }, [id]);

  const loadProperty = async () => {
    try {
      // Check if user is logged in and has correct role
      if (!user) {
        setError('Please login first to make an inquiry');
        setLoading(false);
        return;
      }

      const userRole = String((user as any).role || '').toLowerCase();
      if (userRole !== 'users') {
        setError('Only regular users can make inquiries. Agents and owners cannot make inquiries.');
        setLoading(false);
        return;
      }

      const res = await propertiesApi.getById(id!);
      if (res?.property) {
        setProperty(res.property);
        // Check if user is owner or agent of this property
        const propertyOwnerId = res.property.ownerId || res.property.owner?.id;
        const propertyAgentId = res.property.agentId || res.property.agent?.id;
        const userId = (user as any).id;
        
        if (propertyOwnerId === userId || propertyAgentId === userId) {
          setError('You cannot inquire on your own property');
        }
      }
    } catch (err) {
      console.error('Failed to load property', err);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.message.trim()) {
      setError('Message is required');
      return;
    }

    // Ensure user is logged in and has role 'users'
    if (!user) {
      setError('Please login first to make an inquiry');
      navigate('/login');
      return;
    }

    const userRole = String((user as any).role || '').toLowerCase();
    if (userRole !== 'users') {
      setError('Only regular users can make inquiries');
      return;
    }

    setSubmitting(true);
    try {
      // Include user's name and email from their account
      const payload: { message: string; name?: string; email?: string } = {
        message: formData.message.trim()
      };
      
      // Add user's name and email if available
      if (user) {
        const userName = (user as any).name || (user as any).full_name;
        const userEmail = (user as any).email;
        if (userName) payload.name = userName;
        if (userEmail) payload.email = userEmail;
      }

      await inquiriesApi.create(id!, payload);
      setSubmitted(true);
      setFormData({ message: '' });
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate(`/properties/${id}`);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to submit inquiry', err);
      const errorMessage = err?.message || err?.body?.message || 'Failed to submit inquiry. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in as a registered user to make an inquiry. Please login or register first.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/login')}
                className="flex-1 bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-6 py-3 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition shadow-lg shadow-light-blue-500/30"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="flex-1 border-2 border-dark-blue-500 text-dark-blue-500 px-6 py-3 rounded-lg hover:bg-light-blue-50 transition"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userRole = String((user as any).role || '').toLowerCase();
  if (userRole !== 'users') {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
            <p className="text-gray-600 mb-6">
              Only regular users can make inquiries. Agents and owners cannot make inquiries on properties.
            </p>
            <button
              onClick={() => navigate(`/properties/${id}`)}
              className="bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-6 py-3 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition shadow-lg shadow-light-blue-500/30"
            >
              Back to Property
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">The property you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/properties')}
            className="bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-6 py-3 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition"
          >
            Browse Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(`/properties/${id}`)}
          className="flex items-center space-x-2 text-gray-600 hover:text-dark-blue-500 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Property</span>
        </button>

        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Property Info Header */}
          <div className="bg-gradient-to-r from-light-blue-500 to-dark-blue-600 p-6 sm:p-8 text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2">Make an Inquiry</h1>
            <p className="text-center text-light-blue-100">Send a message to the property owner/agent</p>
          </div>

          {/* Property Details */}
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Property Title</p>
                <p className="font-semibold text-gray-900">{property.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Price</p>
                <p className="font-semibold text-gray-900">Tsh {property.price?.toLocaleString() || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-semibold text-gray-900">
                  {property.city}{property.state ? `, ${property.state}` : ''}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {property.listing_type === 'buy' ? 'For Sale' : property.listing_type === 'rent' ? 'For Rent' : property.listing_type}
                </p>
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="p-6 sm:p-8">
            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Inquiry Submitted!</h2>
                <p className="text-gray-600 mb-6">
                  Your inquiry has been sent successfully. The property owner/agent will contact you soon.
                </p>
                <p className="text-sm text-gray-500">Redirecting back to property page...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="bg-light-blue-50 border border-light-blue-200 rounded-xl p-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">Logged in as:</span> {user.name || user.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Your name and email are already associated with your account.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Message *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-light-blue-500 focus:border-light-blue-500 outline-none transition-all resize-none"
                    placeholder="Tell the property owner/agent about your interest, ask questions, or request more information..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-8 py-4 rounded-xl hover:from-dark-blue-500 hover:to-dark-blue-600 transition-all duration-300 shadow-lg shadow-light-blue-500/30 hover:shadow-xl font-semibold flex items-center justify-center space-x-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Send Inquiry</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/properties/${id}`)}
                    className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { propertiesApi, PropertyDto, reviewsApi, ReviewDto } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, BedDouble, Bath, Square, ArrowLeft, Calendar, Home, Star } from 'lucide-react';

export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    const res = await propertiesApi.getById(id!);
    if (res?.property) setProperty(res.property);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const res = await reviewsApi.list(id);
        setReviews(res.reviews || []);
        // compute average and count locally in case API doesn't return summary
        const count = (res.reviews || []).length;
        const avg = count > 0 ? (res.reviews!.reduce((s, r) => s + (r.rating || 0), 0) / count) : 0;
        setAvgRating(Number(avg.toFixed(2)));
        setReviewsCount(count);
      } catch {}
    })();
  }, [id]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setReviewError('');
    setReviewLoading(true);
    try {
      await reviewsApi.create(id, { rating, comment });
      setComment('');
      setRating(5);
      const res = await reviewsApi.list(id);
      setReviews(res.reviews || []);
    } catch (e: any) {
      setReviewError(e?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property not found</h2>
          <button
            onClick={() => navigate('/properties')}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
          >
            Back to Properties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <button
            onClick={() => navigate('/properties')}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Properties</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="relative h-96">
            <img
              src={property.image_url || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=1200'}
              alt={property.title}
              className="w-full h-full object-cover"
            />
            {property.featured && (
              <div className="absolute top-6 left-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                Featured Property
              </div>
            )}
            <div className="absolute bottom-6 left-6 bg-white text-blue-700 px-8 py-3 rounded-full text-2xl font-bold shadow-xl">
              Tsh {(property.price ?? 0).toLocaleString()}
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-4xl font-bold text-gray-900">{property.title}</h1>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">Tsh {(property.price ?? 0).toLocaleString()}</div>
                    {property.price_per && property.price_per !== 'one_time' && (
                      <div className="text-sm text-gray-600">per {property.price_per}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center text-gray-600 mb-6">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  <span className="text-lg">{property.location}, {property.city}, {property.state}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <BedDouble className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                    <p className="text-sm text-gray-600">Bedrooms</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Bath className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                    <p className="text-sm text-gray-600">Bathrooms</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Square className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.area}</p>
                    <p className="text-sm text-gray-600">Sq. Feet</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-4 text-center">
                    <Home className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.property_type}</p>
                    <p className="text-sm text-gray-600">Type</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="lg:col-span-2">
                      <p className="text-gray-600 leading-relaxed">
                        {property.description || 'This beautiful property offers comfortable living spaces and modern amenities. Located in a prime area with easy access to local attractions, shopping, and dining. Perfect for families or individuals looking for their dream home.'}
                      </p>
                    </div>
                    {(property.latitude != null && property.longitude != null) && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                        <div className="h-56 w-full">
                          <iframe
                            title="map"
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            scrolling="no"
                            src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(property.longitude)-0.01}%2C${Number(property.latitude)-0.01}%2C${Number(property.longitude)+0.01}%2C${Number(property.latitude)+0.01}&layer=mapnik&marker=${property.latitude}%2C${property.longitude}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Star className="w-6 h-6 text-yellow-500 mr-2" /> Reviews
                </h2>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-semibold text-gray-900">{avgRating || '0.0'}</div>
                    <div className="text-yellow-500 text-lg">{'★'.repeat(Math.round(avgRating))}{'☆'.repeat(Math.max(0, 5 - Math.round(avgRating)))}</div>
                    <div className="text-sm text-gray-600">({reviewsCount} review{reviewsCount === 1 ? '' : 's'})</div>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        if (!user) {
                          navigate('/login');
                          return;
                        }
                        const el = document.getElementById('review-form');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      className="text-sm text-blue-700 hover:underline"
                    >
                      Write a review
                    </button>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <p className="text-gray-600">No reviews yet. Be the first to review this property.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={String(r.id)} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-1">
                          <div className="text-sm font-semibold text-gray-900">{r.user?.name ? `by ${r.user.name}` : 'by Guest'}</div>
                          <div className="text-yellow-500">{'★'.repeat(r.rating)}{'☆'.repeat(Math.max(0, 5 - r.rating))}</div>
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{r.comment}</p>
                        <div className="text-xs text-gray-400 mt-2">{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</div>
                      </div>
                    ))}
                  </div>
                )}

                {user ? (
                  <form id="review-form" onSubmit={submitReview} className="mt-6 space-y-4">
                  {reviewError && (
                    <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-2 rounded-lg text-sm">{reviewError}</div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your rating</label>
                    <select
                      value={rating}
                      onChange={(e) => setRating(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {[5,4,3,2,1].map(v => (
                        <option key={v} value={v}>{v} star{v>1?'s':''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your review</label>
                    <textarea
                      required
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Share details of your experience..."
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={reviewLoading}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50"
                    >
                      {reviewLoading ? 'Submitting...' : 'Submit Review'}
                    </button>
                  </div>
                </form>
                ) : (
                  <div className="mt-4">
                    <p className="text-gray-600 mb-3">You must be <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline">logged in</button> to post a review.</p>
                  </div>
                )}
              </div>

                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Details</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Listed Date</p>
                        <p className="font-semibold text-gray-900">
                          {/* created_at may not exist on DTO; fallback to now */}
                          {new Date((property as any).created_at || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Home className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="font-semibold text-gray-900 capitalize">{property.status}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border border-blue-100 sticky top-24">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Interested in this property?</h3>
                  <p className="text-gray-600 mb-6">Contact us to schedule a viewing or get more information.</p>

                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 font-medium mb-3"
                  >
                    Schedule Viewing
                  </button>

                  <button
                    onClick={() => navigate('/contact')}
                    className="w-full border-2 border-blue-600 text-blue-600 px-6 py-3.5 rounded-lg hover:bg-blue-50 transition font-medium"
                  >
                    Contact Agent
                  </button>

                  <button
                    onClick={() => {
                      if (user) {
                        const el = document.getElementById('review-form');
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        else window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      } else {
                        navigate('/login');
                      }
                    }}
                    className="w-full mt-4 bg-blue-700 text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition font-medium"
                  >
                    Add Review
                  </button>

                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                      Property ID: {String(property.id).substring(0, 8)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

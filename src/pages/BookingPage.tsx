import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { propertiesApi, PropertyDto, bookingsApi } from '../lib/api';
import { Calendar, Users, ArrowLeft, AlertCircle } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { formatPrice } from '../lib/format';

export default function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<PropertyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [bookingData, setBookingData] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Only users with role "users" can make bookings
    const userRole = String((user as any).role || '').toLowerCase();
    if (userRole !== 'users') {
      navigate('/properties');
      return;
    }
    loadProperty();
  }, [id, user, navigate]);

  const loadProperty = async () => {
    const res = await propertiesApi.getById(id!);
    if (res?.property) {
      setProperty(res.property);
    } else {
      navigate('/properties');
    }
    setLoading(false);
  };

  const calculateTotal = () => {
    if (!bookingData.checkIn || !bookingData.checkOut || !property) return 0;

    const checkIn = new Date(bookingData.checkIn);
    const checkOut = new Date(bookingData.checkOut);
    const days = differenceInDays(checkOut, checkIn);

    if (days <= 0) return 0;

    let multiplier = days;
    if (property.price_per === 'week') {
      multiplier = days / 7;
    } else if (property.price_per === 'month') {
      multiplier = days / 30;
    }

  const priceNum = typeof property.price === 'number' ? property.price : Number(property.price || 0);
  return priceNum * Math.max(1, multiplier);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBookingLoading(true);

    if (!bookingData.checkIn || !bookingData.checkOut) {
      setError('Please select check-in and check-out dates');
      setBookingLoading(false);
      return;
    }

    const totalPrice = calculateTotal();
    if (totalPrice <= 0) {
      setError('Invalid date range');
      setBookingLoading(false);
      return;
    }
    try {
      await bookingsApi.create({
        propertyId: id!,
        startDate: bookingData.checkIn,
        endDate: bookingData.checkOut,
        durationType: 'days',
        totalAmount: totalPrice,
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard/bookings'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Failed to create booking');
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
  <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return null;
  }

  return (
  <div className="min-h-screen pt-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <button
            onClick={() => navigate(`/properties/${id}`)}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Property</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">Book Your Stay</h1>

              {success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-medium">Booking request submitted successfully! Redirecting...</p>
                </div>
              )}

              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-in Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        required
                        min={format(new Date(), 'yyyy-MM-dd')}
                        value={bookingData.checkIn}
                        onChange={(e) => setBookingData({ ...bookingData, checkIn: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Check-out Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        required
                        min={bookingData.checkIn || format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                        value={bookingData.checkOut}
                        onChange={(e) => setBookingData({ ...bookingData, checkOut: e.target.value })}
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      required
                      min="1"
                      value={bookingData.guests}
                      onChange={(e) => setBookingData({ ...bookingData, guests: parseInt(e.target.value) })}
                      className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading || success}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3.5 rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/30 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading ? 'Processing...' : 'Request Booking'}
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
              <div className="mb-6">
                <img
                  src={property.image_url || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=400'}
                  alt={property.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{property.title}</h3>
              <p className="text-gray-600 mb-4">{property.city}, {property.state}</p>

              <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">Price per {property.price_per === 'one_time' ? 'stay' : property.price_per}</span>
                  <span className="font-bold text-gray-900">${formatPrice(property.price)}</span>
                </div>

                {bookingData.checkIn && bookingData.checkOut && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-gray-600">
                        {differenceInDays(new Date(bookingData.checkOut), new Date(bookingData.checkIn))} {property.price_per === 'day' ? 'days' : 'days'}
                      </span>
                      <span className="text-gray-900">${formatPrice(calculateTotal())}</span>
                    </div>

                    <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-blue-600">${formatPrice(calculateTotal())}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> This is a booking request. The property owner will review and confirm your booking.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

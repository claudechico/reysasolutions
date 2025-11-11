import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { bookingsApi, BookingDto } from '../lib/api';
import { Calendar, MapPin, Users, DollarSign, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatPrice } from '../lib/format';
import { format } from 'date-fns';

export default function MyBookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-bookings' | 'property-bookings'>('my-bookings');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadBookings();
  }, [user, activeTab]);

  const loadBookings = async () => {
    setLoading(true);
    const params = activeTab === 'my-bookings' ? {} : { all: 'true', ownProperties: 'true' } as any;
    const res = await bookingsApi.list(params);
    setBookings(res?.data?.bookings || []);
    setLoading(false);
  };

  const updateBookingStatus = async (_bookingId: string, _status: string) => {
    // Map frontend status to API calls
    if (!_bookingId) return;
    try {
      // optional confirm dialogs for destructive actions
      if (_status === 'declined' && !confirm('Are you sure you want to decline this booking?')) return;
      if (_status === 'cancelled' && !confirm('Are you sure you want to cancel this booking?')) return;

      setLoading(true);
      if (_status === 'confirmed') {
        await bookingsApi.confirm(_bookingId);
      } else if (_status === 'declined') {
        await bookingsApi.decline(_bookingId);
      } else if (_status === 'cancelled' || _status === 'canceled') {
        await bookingsApi.cancel(_bookingId);
      } else {
        // unknown status - just reload
        console.warn('Unknown booking status action', _status);
      }
      // reload bookings after action
      await loadBookings();
    } catch (err: any) {
      console.error('Failed to update booking status', err);
      alert('Failed to update booking: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'declined': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-5 h-5" />;
      case 'pending': return <Clock className="w-5 h-5" />;
      case 'declined': return <XCircle className="w-5 h-5" />;
      case 'cancelled': return <XCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
  <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
  <div className="min-h-screen pt-24 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Bookings</h1>

        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'my-bookings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            My Bookings
          </button>
          <button
            onClick={() => setActiveTab('property-bookings')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'property-bookings'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Property Bookings
          </button>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-1">
                    <img
                      src={(booking as any).properties?.image_url || booking.property?.image_url || 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=400'}
                      alt={(booking as any).properties?.title || booking.property?.title || 'Property'}
                      className="w-full h-48 object-cover rounded-lg cursor-pointer"
                      onClick={() => navigate(`/properties/${(booking as any).properties?.id || booking.property?.id}`)}
                    />
                  </div>

                  <div className="lg:col-span-2">
                    <h3
                      className="text-xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600"
                      onClick={() => navigate(`/properties/${(booking as any).properties?.id || booking.property?.id}`)}
                    >
                      {(booking as any).properties?.title || booking.property?.title || 'Untitled property'}
                    </h3>
                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span className="text-sm">{((booking as any).properties?.city || booking.property?.city) || ''}{(((booking as any).properties?.city || booking.property?.city) && ((booking as any).properties?.state || booking.property?.state)) ? ', ' : ''}{((booking as any).properties?.state || booking.property?.state) || ''}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm">
                          {format(new Date((booking as any).check_in || (booking as any).startDate), 'MMM dd, yyyy')} - {format(new Date((booking as any).check_out || (booking as any).endDate), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <Users className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm">{(booking as any).guests || (booking as any).numGuests || 1} Guests</span>
                      </div>
                      <div className="flex items-center text-gray-700">
                        <DollarSign className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="text-sm font-semibold">Tsh {formatPrice(((booking as any).total_price ?? (booking as any).totalAmount) || 0)}</span>
                      </div>
                    </div>

                    {activeTab === 'property-bookings' && (booking as any).guest && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          <strong>Guest:</strong> {(booking as any).guest?.name || 'Guest'}
                          {((booking as any).guest?.phoneNumber) && ` • ${(booking as any).guest?.phoneNumber}`}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-1 flex flex-col justify-between">
                    <div>
                      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="font-medium capitalize">{booking.status}</span>
                      </div>
                    </div>

                    {activeTab === 'property-bookings' && booking.status === 'pending' && (
                      <div className="space-y-2 mt-4">
                        <button
                          onClick={() => updateBookingStatus(String(booking.id), 'confirmed')}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => updateBookingStatus(String(booking.id), 'declined')}
                          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                        >
                          Decline
                        </button>
                      </div>
                    )}

                    {activeTab === 'my-bookings' && booking.status === 'pending' && (
                      <button
                        onClick={() => updateBookingStatus(String(booking.id), 'cancelled')}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition mt-4"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-6">
              {activeTab === 'my-bookings'
                ? 'Start exploring properties and make your first booking'
                : 'No one has booked your properties yet'}
            </p>
            {activeTab === 'my-bookings' && (
              <button
                onClick={() => navigate('/properties')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
              >
                Browse Properties
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

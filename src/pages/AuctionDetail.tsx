import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auctionsApi, AuctionDto } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, ArrowLeft, Calendar, Gavel, Phone, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../lib/format';

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

function resolveAuctionImage(auction: AuctionDto) {
  if (auction.images && Array.isArray(auction.images) && auction.images.length > 0) {
    const first = auction.images[0];
    
    // Handle base64 data URLs
    if (typeof first === 'string' && first.startsWith('data:image/')) {
      return first;
    }
    
    // If it's a regular string URL
    if (typeof first === 'string') {
      return toUrl(first) || null;
    }
    
    // If it's an object with image properties
    if (first && typeof first === 'object') {
      const imgObj = first as { path?: string; media_url?: string; url?: string; filename?: string };
      if (imgObj.path) return toUrl(imgObj.path) || null;
      if (imgObj.media_url) return toUrl(imgObj.media_url) || null;
      if (imgObj.url) return toUrl(imgObj.url) || null;
      if (imgObj.filename) return toUrl(`/uploads/auctions/images/${imgObj.filename}`) || null;
    }
  }
  return null;
}

function getStatusColor(status?: string) {
  switch (status) {
    case 'active':
      return 'from-green-500 to-emerald-500';
    case 'pending':
      return 'from-yellow-500 to-orange-500';
    case 'ended':
      return 'from-gray-500 to-gray-600';
    case 'cancelled':
      return 'from-red-500 to-red-600';
    default:
      return 'from-gray-500 to-gray-600';
  }
}

function getStatusLabel(status?: string, t: any) {
  switch (status) {
    case 'active':
      return t('auctions.active');
    case 'pending':
      return t('auctions.pending');
    case 'ended':
      return t('auctions.ended');
    case 'cancelled':
      return t('auctions.cancelled');
    default:
      return status || 'Unknown';
  }
}

export default function AuctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [auction, setAuction] = useState<AuctionDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuction();
  }, [id]);

  const loadAuction = async () => {
    try {
      const res = await auctionsApi.get(id!);
      if (res?.auction) setAuction(res.auction);
    } catch (error) {
      console.error('Failed to load auction', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('auctions.loading')}</p>
        </div>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('auctions.notFound')}</h2>
          <button
            onClick={() => navigate('/auctions')}
            className="bg-gradient-to-r from-dark-blue-500 to-dark-blue-600 text-white px-6 py-3 rounded-lg hover:from-dark-blue-600 hover:to-dark-blue-700 transition"
          >
            {t('auctions.backToAuctions')}
          </button>
        </div>
      </div>
    );
  }

  const imageUrl = resolveAuctionImage(auction);
  const isCreator = user && auction.createdBy && String(user.id) === String(auction.createdBy);
  const status = auction.status || 'pending';

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <button
            onClick={() => navigate('/auctions')}
            className="flex items-center space-x-2 text-gray-600 hover:text-dark-blue-500 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{t('auctions.backToAuctions')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={auction.title}
                  className="w-full h-96 object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                  }}
                />
              ) : (
                <div className="w-full h-96 bg-gradient-to-br from-light-blue-500 via-dark-blue-500 to-purple-600 flex items-center justify-center">
                  <Gavel className="w-24 h-24 text-white opacity-50" />
                </div>
              )}
            </div>

            {/* Title and Status */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{auction.title}</h1>
                <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getStatusColor(status)} text-white font-semibold text-sm`}>
                  {getStatusLabel(status, t)}
                </div>
              </div>
              
              {auction.description && (
                <p className="text-gray-600 text-lg leading-relaxed mb-6">{auction.description}</p>
              )}

              {/* Auction Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                {auction.startingPrice && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-light-blue-100 p-3 rounded-xl">
                      <DollarSign className="w-6 h-6 text-light-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('auctions.startingPrice')}</p>
                      <p className="text-xl font-bold text-gray-900">Tsh {formatPrice(auction.startingPrice)}</p>
                    </div>
                  </div>
                )}

                {auction.currentBid && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-3 rounded-xl">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('auctions.currentBid')}</p>
                      <p className="text-xl font-bold text-gray-900">Tsh {formatPrice(auction.currentBid)}</p>
                    </div>
                  </div>
                )}

                {auction.startDate && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('auctions.startDate')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(auction.startDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {auction.endDate && (
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 p-3 rounded-xl">
                      <Clock className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{t('auctions.endDate')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(auction.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Property Link */}
              {auction.property && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-2">{t('auctions.relatedProperty')}</p>
                  <button
                    onClick={() => navigate(`/properties/${auction.propertyId}`)}
                    className="text-light-blue-600 hover:text-light-blue-700 font-semibold hover:underline"
                  >
                    {auction.property.title}
                  </button>
                </div>
              )}
            </div>

            {/* Contact Information */}
            {auction.phoneNumber && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('auctions.contactInfo')}</h2>
                <a
                  href={`tel:${auction.phoneNumber.replace(/\s+/g, '')}`}
                  className="inline-flex items-center space-x-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-semibold"
                >
                  <Phone className="w-5 h-5" />
                  <span>{auction.phoneNumber}</span>
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-light-blue-50 to-white rounded-2xl p-6 border border-light-blue-100 sticky top-24">
              <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auctions.auctionInfo')}</h3>
              
              <div className="space-y-4 mb-6">
                {auction.startingPrice && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('auctions.startingPrice')}</p>
                    <p className="text-2xl font-bold text-gray-900">Tsh {formatPrice(auction.startingPrice)}</p>
                  </div>
                )}

                {auction.currentBid && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('auctions.currentBid')}</p>
                    <p className="text-2xl font-bold text-green-600">Tsh {formatPrice(auction.currentBid)}</p>
                  </div>
                )}

                {auction.bidIncrement && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('auctions.bidIncrement')}</p>
                    <p className="text-lg font-semibold text-gray-900">Tsh {formatPrice(auction.bidIncrement)}</p>
                  </div>
                )}

                {auction.reservePrice && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">{t('auctions.reservePrice')}</p>
                    <p className="text-lg font-semibold text-gray-900">Tsh {formatPrice(auction.reservePrice)}</p>
                  </div>
                )}
              </div>

              {auction.startDate && auction.endDate && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500 mb-2">{t('auctions.timeRemaining')}</p>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {t('auctions.starts')}: {new Date(auction.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">
                        {t('auctions.ends')}: {new Date(auction.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {isCreator && (
                  <>
                    <button
                      onClick={() => navigate(`/dashboard/auctions/${auction.id}/edit`)}
                      className="w-full bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white px-6 py-3 rounded-lg hover:from-dark-blue-500 hover:to-dark-blue-600 transition font-medium"
                    >
                      {t('auctions.edit')}
                    </button>
                  </>
                )}

                {auction.phoneNumber && (
                  <a
                    href={`tel:${auction.phoneNumber.replace(/\s+/g, '')}`}
                    className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition font-medium"
                  >
                    <Phone className="w-5 h-5" />
                    <span>{t('auctions.call')}</span>
                  </a>
                )}
              </div>

              {/* Creator Info */}
              {auction.creator && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">{t('auctions.createdBy')}</p>
                  <p className="font-semibold text-gray-900">{(auction.creator as any)?.name || 'Unknown'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


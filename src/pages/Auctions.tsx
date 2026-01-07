import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auctionsApi, AuctionDto } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Edit, Trash2, Eye, Calendar, Phone, DollarSign, Gavel, MapPin, Clock, Trophy } from 'lucide-react';
import { formatPrice } from '../lib/format';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5558';

function toUrl(path?: string) {
  if (!path) return '';
  const s = String(path).trim();
  if (!s) return '';
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('//')) return s;
  if (s.startsWith('data:image/')) return s; // Base64 images
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

export default function Auctions() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  function getStatusLabel(status?: string) {
    switch (status) {
      case 'active':
        return t('auctions.status.active');
      case 'pending':
        return t('auctions.status.pending');
      case 'ended':
        return t('auctions.status.ended');
      case 'cancelled':
        return t('auctions.status.cancelled');
      default:
        return 'Unknown';
    }
  }
  const [auctions, setAuctions] = useState<AuctionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadAuctions();
  }, [page, filterStatus]);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (filterStatus) {
        if (filterStatus === 'active') {
          params.active = true;
        } else {
          params.status = filterStatus;
        }
      }
      const res = await auctionsApi.list(params);
      setAuctions(res.auctions || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load auctions', err);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm(t('auctions.confirmDelete'))) return;
    try {
      await auctionsApi.remove(id);
      loadAuctions();
    } catch (err: any) {
      alert(err?.message || t('auctions.deleteError'));
    }
  };

  const canCreate = () => {
    if (!user) return false;
    const role = String((user as any).role || '').toLowerCase();
    return role === 'admin';
  };

  const canEditDelete = (auction: AuctionDto) => {
    if (!user) return false;
    const role = String((user as any).role || '').toLowerCase();
    return role === 'admin';
  };

  const isAuctionActive = (auction: AuctionDto) => {
    if (!auction.startDate || !auction.endDate) return false;
    const now = new Date();
    const start = new Date(auction.startDate);
    const end = new Date(auction.endDate);
    return now >= start && now <= end && auction.status === 'active';
  };

  const getAuctionStatus = (auction: any) => {
    try {
      if (auction?.endDate && new Date(auction.endDate) < new Date()) return 'ended';
    } catch (e) { /* ignore bad date */ }
    return (auction?.status || 'active').toLowerCase();
  };

  // detect admin route (we already toggle body.admin elsewhere)
  const isAdminPage = typeof document !== 'undefined' && document.body.classList.contains('admin');

  return (
    <div className="min-h-screen pt-24 bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Gavel className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{t('auctions.title')}</h1>
                  <p className="text-gray-600 mt-1">{t('auctions.subtitle')}</p>
                </div>
              </div>
            </div>
            {canCreate() && (
              <button
                onClick={() => navigate('/admin/auctions/new')}
                className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-6 py-3.5 rounded-xl hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105 flex items-center space-x-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>{t('auctions.createButton')}</span>
              </button>
            )}
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center space-x-3 bg-white rounded-xl p-2 shadow-md border border-gray-100 inline-flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('')}
              className={`px-5 py-2.5 rounded-lg transition-all font-medium text-sm ${
                filterStatus === ''
                  ? 'bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('auctions.all')}
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-5 py-2.5 rounded-lg transition-all font-medium text-sm ${
                filterStatus === 'active'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('auctions.status.active')}
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-5 py-2.5 rounded-lg transition-all font-medium text-sm ${
                filterStatus === 'pending'
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('auctions.status.pending')}
            </button>
            <button
              onClick={() => setFilterStatus('ended')}
              className={`px-5 py-2.5 rounded-lg transition-all font-medium text-sm ${
                filterStatus === 'ended'
                  ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t('auctions.status.ended')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-500 mx-auto mb-6"></div>
            <p className="text-gray-600 text-lg">{t('auctions.loading')}</p>
          </div>
        ) : auctions.length > 0 ? (
          <>
            <div className="mb-6 text-gray-600">
              {t('auctions.found', { count: auctions.length })}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {auctions.map((auction) => {
                const imageUrl = resolveAuctionImage(auction);
                const placeholder = 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';
                const location = auction.property 
                  ? `${auction.property.city || ''}${auction.property.city && auction.property.state ? ', ' : ''}${auction.property.state || ''}`.trim()
                  : '';
                const isActive = isAuctionActive(auction);
                const status = getAuctionStatus(auction);
                
                return (
                  <div
                    key={auction.id}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 group cursor-pointer"
                  >
                    <div className="relative overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={auction.title}
                          className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            if ((e.currentTarget as HTMLImageElement).src !== placeholder) {
                              (e.currentTarget as HTMLImageElement).src = placeholder;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-56 bg-gradient-to-br from-orange-100 to-red-100 flex items-center justify-center">
                          <Gavel className="w-16 h-16 text-gray-300" />
                        </div>
                      )}
                      <div className={`absolute top-4 left-4 bg-gradient-to-r ${getStatusColor(auction.status)} text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg`}>
                        {getStatusLabel(auction.status)}
                      </div>
                      <div className="absolute top-4 right-4 flex items-center space-x-2">
                        {auction.currentBid && (
                          <div className="bg-white text-dark-blue-500 px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">
                            Tsh {formatPrice(auction.currentBid)}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute bottom-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{t('auctions.liveNow')}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{auction.title}</h3>
                      {location && (
                        <div className="flex items-center text-gray-600 mb-4">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="text-sm">{location}</span>
                        </div>
                      )}
                      {auction.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{auction.description}</p>
                      )}
                      <div className="space-y-2 mb-4">
                        {auction.startingPrice && (
                          <div className="flex items-center justify-between text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                            <span className="text-sm font-medium">{t('auctions.startingPrice')}:</span>
                            <span className="text-sm font-bold text-dark-blue-600">Tsh {formatPrice(auction.startingPrice)}</span>
                          </div>
                        )}
                        {auction.currentBid && auction.currentBid > (auction.startingPrice || 0) && (
                          <div className="flex items-center justify-between text-gray-700 bg-green-50 px-3 py-2 rounded-lg">
                            <span className="text-sm font-medium flex items-center">
                              <Trophy className="w-4 h-4 mr-1 text-green-600" />
                              {t('auctions.currentBid')}:
                            </span>
                            <span className="text-sm font-bold text-green-600">Tsh {formatPrice(auction.currentBid)}</span>
                          </div>
                        )}
                        {auction.startDate && (
                          <div className="flex items-center text-gray-700 bg-gray-50 px-3 py-2 rounded-lg">
                            <Calendar className="w-4 h-4 mr-2 text-light-blue-500 flex-shrink-0" />
                            <span className="text-xs">
                              {new Date(auction.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {auction.endDate ? ` - ${new Date(auction.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-gray-600 border-t border-gray-100 pt-4">
                        {auction.phoneNumber && (
                          <a
                            href={`tel:${auction.phoneNumber.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center hover:text-light-blue-500 transition-colors"
                            title="Call now"
                          >
                            <Phone className="w-4 h-4 mr-1 text-light-blue-500" />
                            <span className="text-sm font-medium">{t('auctions.call')}</span>
                          </a>
                        )}
                        <button
                          onClick={() => navigate(`/auctions/${auction.id}`)}
                          className="flex items-center text-light-blue-500 hover:text-light-blue-600 transition-colors font-medium text-sm"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          <span>{t('auctions.viewDetails')}</span>
                        </button>
                      </div>
                      {user && canEditDelete(auction) && (
                        <div className="flex space-x-2 pt-4 border-t border-gray-100 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/auctions/${auction.id}/edit`);
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-light-blue-500 text-white rounded-lg hover:bg-light-blue-600 transition font-medium text-sm"
                          >
                            <Edit className="w-4 h-4" />
                            <span>{t('auctions.edit')}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(auction.id);
                            }}
                            className="flex-1 flex items-center justify-center space-x-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>{t('auctions.delete')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {Math.ceil(total / limit) > 1 && (
              <div className="flex items-center justify-center space-x-3 mt-8">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="px-6 py-2.5 rounded-lg bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-light-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-gray-700"
                >
                  {t('dashboard.prev')}
                </button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, Math.ceil(total / limit)) }).map((_, idx) => {
                    const pageNum = page <= 3 ? idx + 1 : page - 2 + idx;
                    if (pageNum > Math.ceil(total / limit)) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg font-medium transition ${
                          page === pageNum
                            ? 'bg-gradient-to-r from-light-blue-500 to-dark-blue-500 text-white shadow-lg'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <span className="text-gray-600 font-medium">
                  {t('dashboard.page', { current: page, total: Math.ceil(total / limit) })}
                </span>
                <button
                  onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
                  disabled={page >= Math.ceil(total / limit)}
                  className="px-6 py-2.5 rounded-lg bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-light-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-gray-700"
                >
                  {t('dashboard.next')}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gavel className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">{t('auctions.notFound')}</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">{t('auctions.notFoundDesc')}</p>
            {canCreate() && (
              <button
                onClick={() => navigate('/admin/auctions/new')}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-3 rounded-lg hover:from-orange-600 hover:to-red-600 transition shadow-lg shadow-orange-500/30 flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>{t('auctions.createFirst')}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AdminSidebar from '../components/AdminSidebar';
import {
  usersApi,
  propertiesApi,
  paymentsApi,
  bookingsApi,
  adminUsersApi,
  adminListingsApi,
  adminBookingsApi,
} from '../lib/api';
import { formatPrice } from '../lib/format';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  CheckCircle,
  XCircle,
  Eye,
  MapPin,
  DollarSign,
  Users,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5558';
const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=800';

type ChartDatum = {
  name: string;
  bookings: number;
  revenue: number;
  properties: number;
  users: number;
};

type ChartBuilderInput = {
  revenueSeries?: Array<{ month?: string; amount?: number; total?: number }>;
  bookingsSeries?: Array<{ month?: string; count?: number; total?: number }>;
  totals: { users: number; properties: number; bookings: number; revenue: number };
};

const normalizeMonthKey = (value: unknown, index: number) => {
  if (typeof value !== 'string' || !value.trim()) {
    return `m-${index}`;
  }
  return value.trim().toLowerCase();
};

const formatMonthLabel = (value: unknown, index: number) => {
  if (typeof value !== 'string' || !value.trim()) {
    return `M${index + 1}`;
  }

  const raw = value.trim();

  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [year, month] = raw.split('-');
    return format(new Date(Number(year), Number(month) - 1, 1), 'MMM');
  }

  if (/^\d{2}\/\d{4}$/.test(raw)) {
    const [month, year] = raw.split('/');
    return format(new Date(Number(year), Number(month) - 1, 1), 'MMM');
  }

  if (raw.length > 3) {
    return raw.slice(0, 3);
  }

  return raw;
};

const createFallbackMonths = (count = 6) => {
  const now = new Date();
  const months: Array<{ key: string; label: string }> = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const current = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: normalizeMonthKey(format(current, 'yyyy-MM'), i),
      label: format(current, 'MMM'),
    });
  }
  return months;
};

const distributeValue = (total: number, length: number, index: number) => {
  if (!length) return 0;
  if (total <= 0) {
    return Math.max(0, Math.round(12 + index * 3 + (index % 2 === 0 ? 2 : -1)));
  }
  const base = total / length;
  const variation = ((index - (length - 1) / 2) / Math.max(length, 1)) * base * 0.6;
  return Math.max(0, Math.round(base + variation));
};

const buildChartData = ({ revenueSeries, bookingsSeries, totals }: ChartBuilderInput): ChartDatum[] => {
  const revenueMap = new Map<string, number>();
  const bookingsMap = new Map<string, number>();

  if (Array.isArray(revenueSeries)) {
    revenueSeries.forEach((item, idx) => {
      const key = normalizeMonthKey(item?.month, idx);
      revenueMap.set(key, Number(item?.amount ?? item?.total ?? 0));
    });
  }

  if (Array.isArray(bookingsSeries)) {
    bookingsSeries.forEach((item, idx) => {
      const key = normalizeMonthKey(item?.month, idx);
      bookingsMap.set(key, Number(item?.count ?? item?.total ?? 0));
    });
  }

  const months =
    Array.isArray(revenueSeries) && revenueSeries.length > 0
      ? revenueSeries.map((item, idx) => ({
          key: normalizeMonthKey(item?.month, idx),
          label: formatMonthLabel(item?.month, idx),
        }))
      : Array.isArray(bookingsSeries) && bookingsSeries.length > 0
      ? bookingsSeries.map((item, idx) => ({
          key: normalizeMonthKey(item?.month, idx),
          label: formatMonthLabel(item?.month, idx),
        }))
      : createFallbackMonths();

  return months.map((month, idx) => {
    const bookingsVal =
      bookingsMap.get(month.key) ?? distributeValue(totals.bookings, months.length, idx);
    const revenueVal =
      revenueMap.get(month.key) ?? distributeValue(totals.revenue, months.length, idx);
    const propertiesVal = distributeValue(
      Math.max(totals.properties, totals.bookings),
      months.length,
      idx
    );
    const usersVal = distributeValue(Math.max(totals.users, totals.bookings), months.length, idx);

    return {
      name: month.label,
      bookings: bookingsVal,
      revenue: revenueVal,
      properties: propertiesVal,
      users: usersVal,
    };
  });
};

const resolveImageUrl = (property: any) => {
  if (!property) return FALLBACK_IMAGE;

  const toUrl = (input: string | undefined | null) => {
    if (!input || typeof input !== 'string') return '';
    if (input.startsWith('http://') || input.startsWith('https://')) return input;
    if (input.startsWith('/')) return `${API_BASE_URL}${input}`;
    if (input.startsWith('uploads')) return `${API_BASE_URL}/${input}`;
    return `${API_BASE_URL}/uploads/${input}`;
  };

  const imageCandidates: Array<string | undefined> = [];

  if (Array.isArray(property.images) && property.images.length) {
    const first = property.images[0];
    if (typeof first === 'string') imageCandidates.push(first);
    else if (first) imageCandidates.push(first.url || first.path || first.src || first.image_url);
  }

  if (Array.isArray(property.gallery) && property.gallery.length) {
    const first = property.gallery[0];
    if (typeof first === 'string') imageCandidates.push(first);
    else if (first) imageCandidates.push(first.url || first.path || first.src);
  }

  imageCandidates.push(
    property.featured_image,
    property.featuredImage,
    property.thumbnail,
    property.cover_image,
    property.mainImage,
    property.image_url,
    property.imageUrl
  );

  for (const candidate of imageCandidates) {
    const resolved = toUrl(candidate);
    if (resolved) return resolved;
  }

  return FALLBACK_IMAGE;
};

const formatDateSafe = (value: any, includeTime = false) => {
  if (!value) return 'N/A';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'N/A';
  return format(dt, includeTime ? 'MMM dd, yyyy HH:mm' : 'MMM dd, yyyy');
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pendingProperties, setPendingProperties] = useState<any[]>([]);
  const [recentProperties, setRecentProperties] = useState<any[]>([]);
  const [totals, setTotals] = useState({ users: 0, properties: 0, bookings: 0, revenue: 0 });
  const [chartData, setChartData] = useState<ChartDatum[]>([]);
  const [actionLoading, setActionLoading] = useState<Record<string | number, boolean>>({});
  const [lastRefresh, setLastRefresh] = useState<string>('');

  const loadData = async (withSpinner = true) => {
    if (withSpinner) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const [profileRes, propsRes] = await Promise.all([
        usersApi.getProfile(),
        propertiesApi.list({ page: 1, limit: 500 }),
      ]);

      if (!profileRes || String((profileRes as any).role || '').toLowerCase() !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setProfile(profileRes as any);

      const allProperties = Array.isArray((propsRes as any)?.properties)
        ? ((propsRes as any).properties as any[])
        : [];

      const orderedProperties = allProperties
        .slice()
        .sort((a, b) => {
          const left = new Date(
            a?.created_at || a?.createdAt || a?.created || a?.updated_at || a?.updatedAt || 0
          ).getTime();
          const right = new Date(
            b?.created_at || b?.createdAt || b?.created || b?.updated_at || b?.updatedAt || 0
          ).getTime();
          return right - left;
        });

      setPendingProperties(orderedProperties.filter((item: any) => !item?.is_approved));
      setRecentProperties(orderedProperties.slice(0, 5));

      let totalsPayload = {
        users: 0,
        properties: orderedProperties.length,
        bookings: 0,
        revenue: 0,
      };

      let revenueSeries: ChartBuilderInput['revenueSeries'];
      let bookingsSeries: ChartBuilderInput['bookingsSeries'];

      // Try to get analytics data
      const analyticsRes: any = await adminUsersApi.analytics().catch(() => null);
      const analyticsData = analyticsRes?.analytics;

      // Always fetch users and bookings directly to ensure accurate counts
      const [paymentsRes, bookingsRes, adminBookingsRes, usersRes] = await Promise.all([
        paymentsApi.list({ limit: 2000 }).catch(() => null),
        bookingsApi.list({ page: 1, limit: 2000, all: 'true' }).catch(() => null),
        adminBookingsApi.list({ page: 1, limit: 2000 }).catch(() => null),
        adminUsersApi.list({ page: 1, limit: 1 }).catch(() => null),
      ]);

      // Calculate revenue
      totalsPayload.revenue =
        paymentsRes?.payments?.reduce(
          (sum: number, payment: any) => sum + (Number(payment.amount) || 0),
          0
        ) || 0;

      // Get bookings count - try multiple sources
      const bookingsFromRegular = bookingsRes?.data?.bookings?.length || 0;
      const adminBookingsResAny = adminBookingsRes as any;
      const bookingsResAny = bookingsRes as any;
      const bookingsFromAdmin = adminBookingsResAny?.bookings?.length || 0;
      const bookingsFromPagination = adminBookingsResAny?.pagination?.total || bookingsResAny?.pagination?.total;
      totalsPayload.bookings = bookingsFromPagination 
        ? Number(bookingsFromPagination) 
        : Math.max(bookingsFromAdmin, bookingsFromRegular);

      // Get users count - try pagination first, then fetch all
      const usersResAny = usersRes as any;
      if (usersResAny?.pagination?.total !== undefined) {
        totalsPayload.users = Number(usersResAny.pagination.total);
      } else {
        // Fallback: fetch all users to count them
        try {
          const allUsersRes: any = await adminUsersApi.list({ page: 1, limit: 10000 }).catch(() => null);
          totalsPayload.users = allUsersRes?.users?.length || 0;
        } catch (e) {
          console.error('Failed to fetch user count', e);
          totalsPayload.users = 0;
        }
      }

      // Use analytics data if available and values are non-zero, otherwise use direct API data
      if (analyticsData) {
        const analyticsUsers = Number(analyticsData.totalUsers || 0);
        const analyticsBookings = Number(analyticsData.totalBookings || 0);
        const analyticsRevenue = Number(analyticsData.revenue || 0);
        
        // Use analytics values if they're greater than 0, otherwise use direct API values
        totalsPayload = {
          users: analyticsUsers > 0 ? analyticsUsers : totalsPayload.users,
          properties: Number(analyticsData.totalProperties || orderedProperties.length || 0),
          bookings: analyticsBookings > 0 ? analyticsBookings : totalsPayload.bookings,
          revenue: analyticsRevenue > 0 ? analyticsRevenue : totalsPayload.revenue,
        };
        
        revenueSeries = Array.isArray(analyticsData.revenueByMonth) ? analyticsData.revenueByMonth : undefined;
        bookingsSeries = Array.isArray(analyticsData.bookingsByMonth) ? analyticsData.bookingsByMonth : undefined;
      }

      setTotals(totalsPayload);
      setChartData(buildChartData({ revenueSeries, bookingsSeries, totals: totalsPayload }));
      setLastRefresh(new Date().toISOString());
    } catch (error) {
      console.error('Failed to load admin dashboard data', error);
      navigate('/dashboard');
    } finally {
      if (withSpinner) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData(true);
  }, [user, navigate]);

  const handleApproval = async (propertyId: string | number, approve: boolean) => {
    setActionLoading((prev) => ({ ...prev, [propertyId]: true }));
    try {
      if (approve) {
        await adminListingsApi.approve(propertyId as any);
      } else {
        await adminListingsApi.decline(propertyId as any);
      }

      setPendingProperties((prev) => prev.filter((item) => item.id !== propertyId));
      setRecentProperties((prev) =>
        prev
          .map((item) =>
            item.id === propertyId ? { ...item, is_approved: approve ? 1 : item.is_approved } : item
          )
          .filter((item) => (approve ? true : item.id !== propertyId))
      );

      await loadData(false);
    } catch (err: any) {
      console.error('Approval update failed', err);
      alert('Failed to update listing approval: ' + (err?.message || 'Unknown error'));
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[propertyId];
        return next;
      });
    }
  };

  const statTrends = useMemo(() => {
    if (!chartData.length) {
      return { users: 0, properties: 0, bookings: 0, revenue: 0 };
    }

    const compute = (key: Exclude<keyof ChartDatum, 'name'>) => {
      const firstValue = Number(chartData[0][key] ?? 0);
      const lastValue = Number(chartData[chartData.length - 1][key] ?? 0);
      if (!firstValue && !lastValue) return 0;
      if (!firstValue) return lastValue > 0 ? 100 : 0;
      return Math.round(((lastValue - firstValue) / Math.max(firstValue, 1)) * 100);
    };

    return {
      users: compute('users'),
      properties: compute('properties'),
      bookings: compute('bookings'),
      revenue: compute('revenue'),
    };
  }, [chartData]);

  const statCards = useMemo(
    () => [
      {
        id: 'users',
        label: 'Total Users',
        value: totals.users,
        gradient: 'from-sky-500 to-blue-600',
        icon: Users,
        delta: statTrends.users,
        formatter: (v: number) => v.toLocaleString(),
      },
      {
        id: 'properties',
        label: 'Total Properties',
        value: totals.properties,
        gradient: 'from-emerald-500 to-emerald-600',
        icon: Building2,
        delta: statTrends.properties,
        formatter: (v: number) => v.toLocaleString(),
      },
      {
        id: 'bookings',
        label: 'Total Bookings',
        value: totals.bookings,
        gradient: 'from-amber-500 to-amber-600',
        icon: Calendar,
        delta: statTrends.bookings,
        formatter: (v: number) => v.toLocaleString(),
      },
      {
        id: 'revenue',
        label: 'Revenue',
        value: totals.revenue,
        gradient: 'from-indigo-500 to-indigo-600',
        icon: DollarSign,
        delta: statTrends.revenue,
        formatter: (v: number) => `$${formatPrice(v)}`,
      },
    ],
    [totals, statTrends]
  );

  const chartDataset = useMemo(
    () =>
      chartData.map((item) => ({
        ...item,
        revenueScaled: Math.max(0, Math.round(item.revenue / 1000)),
      })),
    [chartData]
  );

  const tooltipFormatter = (value: any, name: string, props: any) => {
    const numeric = Number(value || 0);
    if (name === 'Revenue (K)') {
      return [`$${formatPrice(Number(props?.payload?.revenue ?? 0))}`, 'Revenue'];
    }
    return [`${Math.round(numeric)}`, name];
  };

  const goToProperty = (id: string | number) => {
    window.open(`/properties/${id}`, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile || String(profile.role || '').toLowerCase() !== 'admin') {
    return null;
  }

  const lastRefreshLabel = lastRefresh ? formatDateSafe(lastRefresh, true) : 'Not synced yet';
  const pendingCount = pendingProperties.length;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <AdminSidebar />
      <div className="flex-1 ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shadow-2xl">
          <div className="absolute -top-24 right-6 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 hidden h-40 w-40 rounded-full bg-white/10 blur-2xl lg:block" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/90">
                <ShieldCheck className="h-4 w-4" />
                Admin Control Center
              </span>
              <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                Welcome back, {profile?.name || 'Admin'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-white/80">
                Monitor platform performance, moderate incoming listings, and keep the marketplace healthy in one place.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => loadData(false)}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/20 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/30 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span>{refreshing ? 'Refreshing…' : 'Sync data'}</span>
                </button>
                <div className="flex items-center gap-2 text-sm text-white/80">
                  <Clock className="h-4 w-4" />
                  <span>Last sync: {lastRefreshLabel}</span>
                </div>
              </div>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2 rounded-2xl bg-white/15 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs font-medium text-white/80">
                <span>Moderation summary</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  <AlertCircle className="h-3 w-3" />
                  live
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Pending approvals</span>
                <span className="font-semibold">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/90">
                <span>Revenue YTD</span>
                <span>Tsh {formatPrice(totals.revenue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-white/90">
                <span>Bookings</span>
                <span>{totals.bookings.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            const displayValue = card.formatter
              ? card.formatter(card.value)
              : card.value.toLocaleString();
            const positive = card.delta >= 0;
            return (
              <div
                key={card.id}
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${card.gradient} p-6 text-white shadow-xl transition hover:shadow-2xl`}
              >
                <div className="mb-5 flex items-center justify-between">
                  <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="flex flex-col items-end text-xs font-semibold text-white/80">
                    <span className="flex items-center gap-1">
                      <ArrowUpRight
                        className={`h-4 w-4 ${positive ? '' : 'rotate-180 opacity-90'}`}
                      />
                      {Math.abs(card.delta)}%
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-white/60">
                      vs last month
                    </span>
                  </div>
                </div>
                <div className="text-sm text-white/70">{card.label}</div>
                <div className="mt-1 text-3xl font-bold">{displayValue}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
          <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Performance overview</h2>
              <p className="text-sm text-gray-500">
                Combined view of marketplace momentum over the past months.
              </p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartDataset} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280' }}
                  tickFormatter={(val) => (val >= 1000 ? `${Math.round(val / 1000)}k` : val)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59,130,246,0.08)' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                  }}
                  formatter={tooltipFormatter}
                />
                <Legend />
                <Bar dataKey="users" name="Users" fill="#38bdf8" radius={[10, 10, 0, 0]} />
                <Bar dataKey="properties" name="Properties" fill="#22c55e" radius={[10, 10, 0, 0]} />
                <Bar dataKey="bookings" name="Bookings" fill="#f97316" radius={[10, 10, 0, 0]} />
                <Bar
                  dataKey="revenueScaled"
                  name="Revenue (K)"
                  fill="#6366f1"
                  radius={[10, 10, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Recent properties</h2>
                <p className="text-sm text-gray-500">
                  The five most recent listings submitted to the platform.
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/properties')}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
              >
                Manage all
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>

            {recentProperties.length ? (
              <div className="space-y-4">
                {recentProperties.map((property) => {
                  const rawStatus =
                    property?.is_approved ?? property?.approved ?? property?.status ?? 'pending';
                  const normalizedStatus = (() => {
                    const str = String(rawStatus).toLowerCase();
                    if (str === 'true' || str === 'approved' || str === '1') return 'approved';
                    if (str === 'rejected' || str === 'declined') return 'rejected';
                    return 'pending';
                  })();
                  const isPending = normalizedStatus === 'pending';
                  const statusClasses =
                    normalizedStatus === 'approved'
                      ? 'bg-emerald-50 text-emerald-600'
                      : normalizedStatus === 'rejected'
                      ? 'bg-rose-50 text-rose-600'
                      : 'bg-amber-50 text-amber-700';
                  const ownerName =
                    property?.profiles?.full_name ||
                    property?.profiles?.name ||
                    (property?.owner && typeof property.owner === 'object'
                      ? property.owner.full_name || property.owner.name
                      : property?.owner) ||
                    'N/A';
                  const processing = Boolean(actionLoading[property.id]);

                  return (
                    <div
                      key={property.id}
                      className="flex flex-col gap-5 rounded-2xl border border-gray-100 p-5 transition hover:border-blue-200 hover:shadow-lg md:flex-row"
                    >
                      <div className="w-full overflow-hidden rounded-xl bg-gray-100 md:w-40">
                        <img
                          src={resolveImageUrl(property)}
                          alt={property.title}
                          className="h-40 w-full object-cover"
                          onClick={() => goToProperty(property.id)}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
                                {property.listing_type === 'buy'
                                  ? 'For Sale'
                                  : property.listing_type === 'rent'
                                  ? 'For Rent'
                                  : 'Listing'}
                              </span>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                {property.property_type || 'Property'}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses}`}>
                                {normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
                              </span>
                            </div>
                            <h3 className="mt-2 text-lg font-semibold text-gray-900">
                              {property.title || 'Untitled property'}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                              <MapPin className="h-4 w-4 text-blue-500" />
                              <span>
                                {property.location || property.address || '—'}
                                {property.city ? `, ${property.city}` : ''}
                                {property.state ? `, ${property.state}` : ''}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => goToProperty(property.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-blue-500 hover:text-blue-600"
                          >
                            View property
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            <span className="font-semibold text-gray-900">
                                Tsh {formatPrice(property.price || 0)}
                              {property.price_per && property.price_per !== 'one_time'
                                ? `/${property.price_per}`
                                : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Owner</span>
                            <p className="font-medium text-gray-900">{ownerName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Submitted</span>
                            <p className="font-medium text-gray-900">
                              {formatDateSafe(property.created_at || property.createdAt)}
                            </p>
                          </div>
                        </div>

                        {isPending && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              disabled={processing}
                              onClick={() => handleApproval(property.id, true)}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              {processing ? 'Processing…' : 'Approve'}
                            </button>
                            <button
                              disabled={processing}
                              onClick={() => handleApproval(property.id, false)}
                              className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {processing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              {processing ? 'Processing…' : 'Reject'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
                No properties have been submitted yet.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-xl">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Pending approvals</h2>
                <p className="text-sm text-gray-500">
                  {pendingCount > 0
                    ? `${pendingCount} listing${pendingCount > 1 ? 's are' : ' is'} waiting for your review.`
                    : 'All caught up — nothing to approve right now.'}
                </p>
              </div>
            </div>

            {pendingCount ? (
              <div className="space-y-4">
                {pendingProperties.map((property) => {
                  const processing = Boolean(actionLoading[property.id]);
                  const ownerName =
                    property?.profiles?.full_name ||
                    property?.profiles?.name ||
                    (property?.owner && typeof property.owner === 'object'
                      ? property.owner.full_name || property.owner.name
                      : property?.owner) ||
                    'N/A';

                  return (
                    <div
                      key={property.id}
                      className="grid gap-6 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-6 transition hover:border-blue-200 hover:shadow-lg lg:grid-cols-[200px,1fr,180px]"
                    >
                      <div className="overflow-hidden rounded-xl bg-gray-100">
                        <img
                          src={resolveImageUrl(property)}
                          alt={property.title}
                          className="h-44 w-full object-cover"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-600">
                            {property.listing_type === 'buy'
                              ? 'For Sale'
                              : property.listing_type === 'rent'
                              ? 'For Rent'
                              : 'Listing'}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                            {property.property_type || 'Property'}
                          </span>
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                            Pending review
                          </span>
                        </div>

                        <h3 className="mt-2 text-xl font-semibold text-gray-900">
                          {property.title || 'Untitled property'}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                          {property.description || 'No description provided.'}
                        </p>

                        <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            <span>
                              {property.location || property.address || '—'}
                              {property.city ? `, ${property.city}` : ''}
                              {property.state ? `, ${property.state}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                            <span className="font-semibold text-gray-900">
                              Tsh {formatPrice(property.price || 0)}
                              {property.price_per && property.price_per !== 'one_time'
                                ? `/${property.price_per}`
                                : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Owner</span>
                            <p className="font-medium text-gray-900">{ownerName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Submitted</span>
                            <p className="font-medium text-gray-900">
                              {formatDateSafe(property.created_at || property.createdAt, true)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Bedrooms</span>
                            <p className="font-medium text-gray-900">{property.bedrooms || '—'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Bathrooms</span>
                            <p className="font-medium text-gray-900">{property.bathrooms || '—'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => goToProperty(property.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-100"
                        >
                          <Eye className="h-4 w-4" />
                          Preview listing
                        </button>
                        <button
                          disabled={processing}
                          onClick={() => handleApproval(property.id, true)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                          {processing ? 'Processing…' : 'Approve'}
                        </button>
                        <button
                          disabled={processing}
                          onClick={() => handleApproval(property.id, false)}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          {processing ? 'Processing…' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
                Fantastic! There are no pending approvals right now.
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

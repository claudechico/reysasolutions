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
  usersSeries?: Array<{ month?: string; count?: number }>;
  propertiesSeries?: Array<{ month?: string; count?: number }>;
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

const buildChartData = ({ revenueSeries, bookingsSeries, usersSeries, propertiesSeries, totals }: ChartBuilderInput): ChartDatum[] => {
  const revenueMap = new Map<string, number>();
  const bookingsMap = new Map<string, number>();
  const usersMap = new Map<string, number>();
  const propertiesMap = new Map<string, number>();

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

  if (Array.isArray(usersSeries)) {
    usersSeries.forEach((item, idx) => {
      const key = normalizeMonthKey(item?.month, idx);
      usersMap.set(key, Number(item?.count ?? 0));
    });
  }

  if (Array.isArray(propertiesSeries)) {
    propertiesSeries.forEach((item, idx) => {
      const key = normalizeMonthKey(item?.month, idx);
      propertiesMap.set(key, Number(item?.count ?? 0));
    });
  }

  // Collect all unique months from all series
  const allMonthsSet = new Set<string>();
  [revenueSeries, bookingsSeries, usersSeries, propertiesSeries].forEach(series => {
    if (Array.isArray(series)) {
      series.forEach((item, idx) => {
        allMonthsSet.add(normalizeMonthKey(item?.month, idx));
      });
    }
  });

  // Create months array - prefer actual data, fallback to last 6 months if no data
  let months: Array<{ key: string; label: string }>;
  if (allMonthsSet.size > 0) {
    // Sort months chronologically
    const sortedMonths = Array.from(allMonthsSet).sort();
    months = sortedMonths.map((key, idx) => {
      // Find the original month string from any series
      const originalMonth = 
        revenueSeries?.find((_, i) => normalizeMonthKey(revenueSeries[i]?.month, i) === key)?.month ||
        bookingsSeries?.find((_, i) => normalizeMonthKey(bookingsSeries[i]?.month, i) === key)?.month ||
        usersSeries?.find((_, i) => normalizeMonthKey(usersSeries[i]?.month, i) === key)?.month ||
        propertiesSeries?.find((_, i) => normalizeMonthKey(propertiesSeries[i]?.month, i) === key)?.month ||
        key;
      return {
        key,
        label: formatMonthLabel(originalMonth, idx),
      };
    });
  } else {
    months = createFallbackMonths();
  }

  return months.map((month, idx) => {
    // Use actual data from maps, only fallback to distribution if no data exists
    const bookingsVal = bookingsMap.get(month.key) ?? 0;
    const revenueVal = revenueMap.get(month.key) ?? 0;
    const propertiesVal = propertiesMap.get(month.key) ?? 0;
    const usersVal = usersMap.get(month.key) ?? 0;

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
        propertiesApi.list({ page: 1, limit: 1000 }), // Increased limit to ensure we get all properties
      ]);
      
      console.log('[AdminDashboard] API response properties count:', (propsRes as any)?.properties?.length || 0);

      if (!profileRes || String((profileRes as any).role || '').toLowerCase() !== 'admin') {
        navigate('/dashboard');
        return;
      }

      setProfile(profileRes as any);

      const allProperties = Array.isArray((propsRes as any)?.properties)
        ? ((propsRes as any).properties as any[])
        : [];

      console.log('[AdminDashboard] Total properties fetched from API:', allProperties.length);

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

      // Helper function to check if property is approved (handles different formats)
      const isApprovedCheck = (item: any): boolean => {
        // Check moderationStatus first (new field from backend)
        if (item.moderationStatus) {
          return String(item.moderationStatus).toLowerCase() === 'approved';
        }
        // Check approvedAt field - if it exists, property is approved
        if (item.approvedAt) {
          return true;
        }
        // Fallback to is_approved field
        return item.is_approved === true || 
               item.is_approved === 1 || 
               item.is_approved === '1' || 
               String(item.is_approved).toLowerCase() === 'true' ||
               item.status === 'approved';
      };
      
      // Count only approved properties for the stat card
      const approvedProperties = orderedProperties.filter((item: any) => isApprovedCheck(item));
      console.log('[AdminDashboard] Approved properties count:', approvedProperties.length);
      console.log('[AdminDashboard] Approved properties details:', approvedProperties.map(p => ({
        id: p.id,
        title: p.title,
        moderationStatus: p.moderationStatus,
        is_approved: p.is_approved,
        status: p.status
      })));
      
      setPendingProperties(orderedProperties.filter((item: any) => !isApprovedCheck(item)));
      // Show only approved properties in recent properties section
      const recentApprovedProperties = approvedProperties.slice(0, 5);
      console.log('[AdminDashboard] Recent approved properties to display:', recentApprovedProperties.length);
      console.log('[AdminDashboard] Recent properties owner data:', recentApprovedProperties.map(p => ({
        id: p.id,
        title: p.title,
        owner: p.owner,
        profiles: p.profiles,
        agentId: p.agentId
      })));
      setRecentProperties(recentApprovedProperties);
      
      let totalsPayload = {
        users: 0,
        properties: approvedProperties.length,
        bookings: 0,
        revenue: 0,
      };

      let revenueSeries: ChartBuilderInput['revenueSeries'];
      let bookingsSeries: ChartBuilderInput['bookingsSeries'];
      let usersSeries: Array<{ month: string; count: number }> = [];
      let propertiesSeries: Array<{ month: string; count: number }> = [];

      // Try to get analytics data
      const analyticsRes: any = await adminUsersApi.analytics().catch(() => null);
      const analyticsData = analyticsRes?.analytics;

      // Always fetch users and bookings directly to ensure accurate counts
      const [paymentsRes, bookingsRes, adminBookingsRes, usersRes] = await Promise.all([
        paymentsApi.list({ limit: 2000 }).catch(() => null),
        bookingsApi.list({ page: 1, limit: 2000, all: 'true' }).catch(() => null),
        adminBookingsApi.list({ page: 1, limit: 2000 }).catch(() => null),
        adminUsersApi.list({ page: 1, limit: 10000 }).catch(() => null),
      ]);

      // Calculate revenue and group by month
      const payments = paymentsRes?.payments || [];
      totalsPayload.revenue = payments.reduce(
        (sum: number, payment: any) => sum + (Number(payment.amount) || 0),
        0
      );

      // Group revenue by month
      const revenueByMonthMap = new Map<string, number>();
      payments.forEach((payment: any) => {
        const date = payment.created_at || payment.createdAt || payment.date;
        if (date) {
          const monthKey = format(new Date(date), 'yyyy-MM');
          const current = revenueByMonthMap.get(monthKey) || 0;
          revenueByMonthMap.set(monthKey, current + (Number(payment.amount) || 0));
        }
      });
      revenueSeries = Array.from(revenueByMonthMap.entries()).map(([month, amount]) => ({
        month,
        amount,
        total: amount,
      }));

      // Get bookings and group by month
      const bookingsFromRegular = bookingsRes?.data?.bookings || [];
      const adminBookingsResAny = adminBookingsRes as any;
      const bookingsResAny = bookingsRes as any;
      const bookingsFromAdmin = adminBookingsResAny?.bookings || [];
      const allBookings = [...bookingsFromAdmin, ...bookingsFromRegular];
      
      // Remove duplicates by ID
      const uniqueBookings = Array.from(
        new Map(allBookings.map((b: any) => [b.id, b])).values()
      );
      
      totalsPayload.bookings = uniqueBookings.length;
      
      // Group bookings by month
      const bookingsByMonthMap = new Map<string, number>();
      uniqueBookings.forEach((booking: any) => {
        const date = booking.created_at || booking.createdAt || booking.date || booking.booking_date;
        if (date) {
          const monthKey = format(new Date(date), 'yyyy-MM');
          const current = bookingsByMonthMap.get(monthKey) || 0;
          bookingsByMonthMap.set(monthKey, current + 1);
        }
      });
      bookingsSeries = Array.from(bookingsByMonthMap.entries()).map(([month, count]) => ({
        month,
        count,
        total: count,
      }));

      // Get users count and group by month
      const usersResAny = usersRes as any;
      const allUsers = usersResAny?.users || [];
      totalsPayload.users = allUsers.length;

      // Group users by month
      const usersByMonthMap = new Map<string, number>();
      allUsers.forEach((user: any) => {
        const date = user.created_at || user.createdAt || user.created;
        if (date) {
          const monthKey = format(new Date(date), 'yyyy-MM');
          const current = usersByMonthMap.get(monthKey) || 0;
          usersByMonthMap.set(monthKey, current + 1);
        }
      });
      usersSeries = Array.from(usersByMonthMap.entries()).map(([month, count]) => ({
        month,
        count,
      }));

      // Group approved properties by month
      const propertiesByMonthMap = new Map<string, number>();
      approvedProperties.forEach((property: any) => {
        const date = property.created_at || property.createdAt || property.created;
        if (date) {
          const monthKey = format(new Date(date), 'yyyy-MM');
          const current = propertiesByMonthMap.get(monthKey) || 0;
          propertiesByMonthMap.set(monthKey, current + 1);
        }
      });
      propertiesSeries = Array.from(propertiesByMonthMap.entries()).map(([month, count]) => ({
        month,
        count,
      }));

      // Use analytics data if available and values are non-zero, otherwise use direct API data
      if (analyticsData) {
        const analyticsUsers = Number(analyticsData.totalUsers || 0);
        const analyticsBookings = Number(analyticsData.totalBookings || 0);
        const analyticsRevenue = Number(analyticsData.revenue || 0);
        
        // Use analytics values if they're greater than 0, otherwise use direct API values
        // For properties, always use approved count (not total from analytics)
        totalsPayload = {
          users: analyticsUsers > 0 ? analyticsUsers : totalsPayload.users,
          properties: approvedProperties.length, // Always count only approved properties
          bookings: analyticsBookings > 0 ? analyticsBookings : totalsPayload.bookings,
          revenue: analyticsRevenue > 0 ? analyticsRevenue : totalsPayload.revenue,
        };
        
        // Prefer analytics monthly data if available
        if (Array.isArray(analyticsData.revenueByMonth) && analyticsData.revenueByMonth.length > 0) {
          revenueSeries = analyticsData.revenueByMonth;
        }
        if (Array.isArray(analyticsData.bookingsByMonth) && analyticsData.bookingsByMonth.length > 0) {
          bookingsSeries = analyticsData.bookingsByMonth;
        }
      }

      setTotals(totalsPayload);
      setChartData(buildChartData({ 
        revenueSeries, 
        bookingsSeries, 
        usersSeries,
        propertiesSeries,
        totals: totalsPayload 
      }));
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

  // Helper function to check if property is approved (handles different formats)
  const isPropertyApproved = (property: any): boolean => {
    // Check moderationStatus first (new field from backend)
    if (property.moderationStatus) {
      return String(property.moderationStatus).toLowerCase() === 'approved';
    }
    // Fallback to is_approved field
    return property.is_approved === true || 
           property.is_approved === 1 || 
           property.is_approved === '1' || 
           String(property.is_approved).toLowerCase() === 'true' ||
           property.status === 'approved';
  };

  const handleApproval = async (propertyId: string | number, approve: boolean) => {
    setActionLoading((prev) => ({ ...prev, [propertyId]: true }));
    try {
      let response;
      if (approve) {
        response = await adminListingsApi.approve(propertyId as any);
      } else {
        response = await adminListingsApi.decline(propertyId as any);
      }

      // Log response for debugging
      console.log(`${approve ? 'Approve' : 'Decline'} response:`, response);

      // Update local state with the property object from response if available
      const responseAny = response as any;
      if (responseAny?.property) {
        const updatedProperty = responseAny.property;
        console.log('Updated property from response:', updatedProperty);
        
        // Update pending properties - remove if approved, update if declined
        setPendingProperties((prev) => {
          if (approve) {
            return prev.filter((item) => item.id !== propertyId);
          } else {
            return prev.map((item) =>
              item.id === propertyId ? { ...item, ...updatedProperty } : item
            );
          }
        });

        // Update recent properties with the updated property object
        setRecentProperties((prev) =>
          prev.map((item) =>
            item.id === propertyId ? { ...item, ...updatedProperty } : item
          )
        );
      } else {
        // Fallback: update manually if response doesn't have property object
        setPendingProperties((prev) => prev.filter((item) => item.id !== propertyId));
        setRecentProperties((prev) =>
          prev
            .map((item) =>
              item.id === propertyId ? { ...item, is_approved: approve ? 1 : item.is_approved, status: approve ? 'approved' : 'declined' } : item
            )
            .filter((item) => (approve ? true : item.id !== propertyId))
        );
      }

      // Only reload if we didn't get the property from response
      if (!responseAny?.property) {
        await loadData(false);
      }
    } catch (err: any) {
      console.error('Approval update failed', err);
      alert('Failed to update listing approval: ' + (err?.message || 'Unknown error'));
      // Reload on error to get fresh data
      await loadData(false);
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
        gradient: 'from-sky-500 to-dark-blue-500',
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
        gradient: 'from-indigo-500 to-dark-blue-600',
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
      <div className="min-h-screen pt-24 flex items-center justify-center bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue-500 mx-auto mb-4" />
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
    <div className="flex min-h-screen bg-gradient-to-br from-light-blue-50 via-white to-light-blue-50">
      <AdminSidebar />
      <div className="flex-1 lg:ml-64" style={{ paddingTop: 'var(--app-nav-height)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 pt-16 lg:pt-0 pb-6 sm:pb-8 lg:pb-12 space-y-6 sm:space-y-8 lg:space-y-10">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-dark-blue-500 via-dark-blue-600 to-violet-600 p-4 sm:p-6 lg:p-8 text-white shadow-2xl">
          <div className="absolute -top-24 right-6 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 hidden h-40 w-40 rounded-full bg-white/10 blur-2xl lg:block" />

          <div className="relative z-10 flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-2 sm:px-3 py-1 text-xs font-medium uppercase tracking-wide text-white/90">
                <ShieldCheck className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-xs">Admin Control Center</span>
              </span>
              <h1 className="mt-3 sm:mt-4 text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold text-white">
                Welcome back, {profile?.name || 'Admin'}
              </h1>
              <p className="mt-2 sm:mt-3 max-w-2xl text-xs sm:text-sm text-white/80">
                Monitor platform performance, moderate incoming listings, and keep the marketplace healthy in one place.
              </p>
              <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-2 sm:gap-4">
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
            <div className="flex w-full lg:max-w-xs flex-col gap-2 rounded-xl sm:rounded-2xl bg-white/15 p-3 sm:p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs font-medium text-white/80">
                <span>Moderation summary</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">
                  <AlertCircle className="h-3 w-3" />
                  live
                </span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>Pending approvals</span>
                <span className="font-semibold">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm text-white/90">
                <span>Revenue YTD</span>
                <span className="text-xs sm:text-sm">Tsh {formatPrice(totals.revenue)}</span>
              </div>
              <div className="flex items-center justify-between text-xs sm:text-sm text-white/90">
                <span>Bookings</span>
                <span>{totals.bookings.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {statCards.map((card) => {
            const Icon = card.icon;
            const displayValue = card.formatter
              ? card.formatter(card.value)
              : card.value.toLocaleString();
            const positive = card.delta >= 0;
            return (
              <div
                key={card.id}
                className={`relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-gradient-to-br ${card.gradient} p-4 sm:p-6 text-white shadow-xl transition hover:shadow-2xl`}
              >
                <div className="mb-4 sm:mb-5 flex items-center justify-between">
                  <div className="rounded-lg sm:rounded-xl bg-white/20 p-2 sm:p-3 backdrop-blur-sm">
                    <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                  </div>
                  <div className="flex flex-col items-end text-xs font-semibold text-white/80">
                    <span className="flex items-center gap-1">
                      <ArrowUpRight
                        className={`h-3 w-3 sm:h-4 sm:w-4 ${positive ? '' : 'rotate-180 opacity-90'}`}
                      />
                      {Math.abs(card.delta)}%
                    </span>
                    <span className="text-[10px] uppercase tracking-wide text-white/60 hidden sm:block">
                      vs last month
                    </span>
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-white/70">{card.label}</div>
                <div className="mt-1 text-xl sm:text-2xl lg:text-3xl font-bold">{displayValue}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-xl">
          <div className="mb-4 sm:mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Performance overview</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Combined view of marketplace momentum over the past months.
              </p>
            </div>
          </div>
          <div className="h-64 sm:h-80 overflow-x-auto">
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

        <div className="space-y-6 sm:space-y-8">
          <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-xl">
            <div className="mb-4 sm:mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Recent properties</h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  The five most recent listings submitted to the platform.
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/properties')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 transition hover:border-light-blue-500 hover:text-dark-blue-500"
              >
                Manage all
                <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
              </button>
            </div>

            {recentProperties.length ? (
              <div className="space-y-4">
                {recentProperties.map((property) => {
                  // Check moderationStatus first, then fallback to other fields
                  const rawStatus =
                    property?.moderationStatus ?? 
                    property?.is_approved ?? 
                    property?.approved ?? 
                    property?.status ?? 
                    'pending';
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
                    (property?.agent && typeof property.agent === 'object' ? (property.agent.name || property.agent.full_name) : property?.agent) ||
                    (property?.profiles?.full_name) || 
                    (property.owner && typeof property.owner === 'object' ? (property.owner.name || property.owner.full_name) : property.owner) || 
                    'N/A';
                  const processing = Boolean(actionLoading[property.id]);

                  return (
                    <div
                      key={property.id}
                      className="flex flex-col gap-4 sm:gap-5 rounded-xl sm:rounded-2xl border border-gray-100 p-4 sm:p-5 transition hover:border-blue-200 hover:shadow-lg md:flex-row"
                    >
                      <div className="w-full overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 md:w-40 flex-shrink-0">
                        <img
                          src={resolveImageUrl(property)}
                          alt={property.title}
                          className="h-32 sm:h-40 w-full object-cover cursor-pointer"
                          onClick={() => goToProperty(property.id)}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                              <span className="rounded-full bg-light-blue-50 px-2 py-0.5 text-dark-blue-500">
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
                            <h3 className="mt-2 text-base sm:text-lg font-semibold text-gray-900 truncate">
                              {property.title || 'Untitled property'}
                            </h3>
                            <div className="mt-1 flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-light-blue-500 flex-shrink-0" />
                              <span className="truncate">
                                {property.location || property.address || '—'}
                                {property.city ? `, ${property.city}` : ''}
                                {property.state ? `, ${property.state}` : ''}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => goToProperty(property.id)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:border-light-blue-500 hover:text-dark-blue-500"
                          >
                            View property
                            <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </button>
                        </div>

                        <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-900 truncate">
                                Tsh {formatPrice(property.price || 0)}
                              {property.price_per && property.price_per !== 'one_time'
                                ? `/${property.price_per}`
                                : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Owner</span>
                            <p className="font-medium text-gray-900 truncate">{ownerName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Submitted</span>
                            <p className="font-medium text-gray-900">
                              {formatDateSafe(property.created_at || property.createdAt)}
                            </p>
                          </div>
                        </div>

                        {isPending && (
                          <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
                            <button
                              disabled={processing}
                              onClick={() => handleApproval(property.id, true)}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs sm:text-sm font-medium text-emerald-600 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {processing ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                              {processing ? 'Processing…' : 'Approve'}
                            </button>
                            <button
                              disabled={processing}
                              onClick={() => handleApproval(property.id, false)}
                              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs sm:text-sm font-medium text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {processing ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
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
              <div className="rounded-xl sm:rounded-2xl border border-dashed border-gray-300 p-8 sm:p-10 text-center text-xs sm:text-sm text-gray-500">
                No properties have been submitted yet.
              </div>
            )}
          </div>

          <div className="rounded-2xl sm:rounded-3xl border border-gray-100 bg-white p-4 sm:p-6 shadow-xl">
            <div className="mb-4 sm:mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">Pending approvals</h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {pendingCount > 0
                    ? `${pendingCount} listing${pendingCount > 1 ? 's are' : ' is'} waiting for your review.`
                    : 'All caught up — nothing to approve right now.'}
                </p>
              </div>
            </div>

            {pendingCount ? (
              <div className="space-y-4 sm:space-y-6">
                {pendingProperties.map((property) => {
                  const processing = Boolean(actionLoading[property.id]);
                  const ownerName =
                    (property?.agent && typeof property.agent === 'object' ? (property.agent.name || property.agent.full_name) : property?.agent) ||
                    (property?.profiles?.full_name) || 
                    (property.owner && typeof property.owner === 'object' ? (property.owner.name || property.owner.full_name) : property.owner) || 
                    'N/A';
                  
                  // Check if property is approved using helper function
                  const isApproved = isPropertyApproved(property);
                  // Check moderationStatus first, then fallback to status
                  const rawStatus = property?.moderationStatus || property?.status || (isApproved ? 'approved' : 'pending');
                  const normalizedStatus = (() => {
                    const str = String(rawStatus).toLowerCase();
                    if (str === 'true' || str === 'approved' || str === '1' || isApproved) return 'approved';
                    if (str === 'rejected' || str === 'declined') return 'rejected';
                    return 'pending';
                  })();
                  
                  const statusClasses =
                    normalizedStatus === 'approved'
                      ? 'bg-emerald-100 text-emerald-700'
                      : normalizedStatus === 'rejected'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700';
                  const statusText =
                    normalizedStatus === 'approved'
                      ? 'Approved'
                      : normalizedStatus === 'rejected'
                      ? 'Rejected'
                      : 'Pending review';

                  return (
                    <div
                      key={property.id}
                      className="flex flex-col lg:grid lg:grid-cols-[200px,1fr,180px] gap-4 sm:gap-6 rounded-xl sm:rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-4 sm:p-6 transition hover:border-blue-200 hover:shadow-lg"
                    >
                      <div className="overflow-hidden rounded-lg sm:rounded-xl bg-gray-100 w-full lg:w-auto">
                        <img
                          src={resolveImageUrl(property)}
                          alt={property.title}
                          className="h-48 sm:h-44 w-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
                          <span className="rounded-full bg-light-blue-50 px-2 py-0.5 text-dark-blue-500">
                            {property.listing_type === 'buy'
                              ? 'For Sale'
                              : property.listing_type === 'rent'
                              ? 'For Rent'
                              : 'Listing'}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                            {property.property_type || 'Property'}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 ${statusClasses}`}>
                            {statusText}
                          </span>
                        </div>

                        <h3 className="mt-2 text-lg sm:text-xl font-semibold text-gray-900 truncate">
                          {property.title || 'Untitled property'}
                        </h3>
                        <p className="mt-2 line-clamp-2 text-xs sm:text-sm text-gray-600">
                          {property.description || 'No description provided.'}
                        </p>

                        <div className="mt-3 sm:mt-4 grid gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-light-blue-500 flex-shrink-0" />
                            <span className="truncate">
                              {property.location || property.address || '—'}
                              {property.city ? `, ${property.city}` : ''}
                              {property.state ? `, ${property.state}` : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-900 truncate">
                              Tsh {formatPrice(property.price || 0)}
                              {property.price_per && property.price_per !== 'one_time'
                                ? `/${property.price_per}`
                                : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Owner</span>
                            <p className="font-medium text-gray-900 truncate">{ownerName}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Submitted</span>
                            <p className="font-medium text-gray-900 text-xs sm:text-sm">
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

                      <div className="flex flex-col gap-2 lg:flex-col">
                        <button
                          onClick={() => goToProperty(property.id)}
                          className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-light-blue-100 bg-light-blue-50 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-dark-blue-500 transition hover:border-blue-200 hover:bg-light-blue-100"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span>Preview listing</span>
                        </button>
                        {normalizedStatus === 'pending' && (
                          <>
                            <button
                              disabled={processing}
                              onClick={() => handleApproval(property.id, true)}
                              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {processing ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                              {processing ? 'Processing…' : 'Approve'}
                            </button>
                            <button
                              disabled={processing}
                              onClick={() => handleApproval(property.id, false)}
                              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {processing ? (
                                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              )}
                              {processing ? 'Processing…' : 'Reject'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl sm:rounded-2xl border border-dashed border-gray-300 p-8 sm:p-10 text-center text-xs sm:text-sm text-gray-500">
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

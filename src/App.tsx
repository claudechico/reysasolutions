import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Home from './pages/Home';
import Properties from './pages/Properties';
import PropertyDetailEnhanced from './pages/PropertyDetailEnhanced';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PropertyFormEnhanced from './pages/PropertyFormEnhanced';
import BookingPage from './pages/BookingPage';
import MyBookings from './pages/MyBookings';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/AdminDashboard';
import AdminManageUsers from './pages/AdminManageUsers';
import AdminManageProperties from './pages/AdminManageProperties';
import AdminCategories from './pages/AdminCategories';
import AdminPayments from './pages/AdminPayments';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminProfile from './pages/AdminProfile';
import AdminCMS from './pages/AdminCMS';
import AdminModeration from './pages/AdminModeration';
import AdminBookings from './pages/AdminBookings';
import Profile from './pages/Profile';
import Payment from './pages/Payment';
import Subscriptions from './pages/Subscriptions';
import ForgotPassword from './pages/ForgotPassword';
import VerifyOTP from './pages/VerifyOTP';
import Advertisements from './pages/Advertisements';
import AdvertisementForm from './pages/AdvertisementForm';
import Auctions from './pages/Auctions';
import AuctionForm from './pages/AuctionForm';
import AuctionDetail from './pages/AuctionDetail';
import LiveChat from './components/LiveChat';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InnerApp />
      </AuthProvider>
    </BrowserRouter>
  );
}

function InnerApp() {
  const location = useLocation();
  const hideFooter = location.pathname.startsWith('/admin');
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      <main className={`flex-grow flex flex-col pt-[var(--app-nav-height)] ${isAdmin ? 'md:pt-[calc(var(--app-nav-height)+0.5rem)]' : ''}`}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/properties/:id" element={<PropertyDetailEnhanced />} />
              <Route path="/advertisements" element={<Advertisements />} />
              <Route path="/auctions" element={<Auctions />} />
              <Route path="/auctions/:id" element={<AuctionDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/properties/new"
                element={
                  <ProtectedRoute>
                    <PropertyFormEnhanced />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/properties/:id/edit"
                element={
                  <ProtectedRoute>
                    <PropertyFormEnhanced />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book/:id"
                element={
                  <ProtectedRoute>
                    <BookingPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/advertisements/new"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AdvertisementForm />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/dashboard/advertisements/:id/edit"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AdvertisementForm />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/advertisements/new"
                element={
                  <AdminProtectedRoute>
                    <AdvertisementForm />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/advertisements/:id/edit"
                element={
                  <AdminProtectedRoute>
                    <AdvertisementForm />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/dashboard/auctions/new"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AuctionForm />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/dashboard/auctions/:id/edit"
                element={
                  <RoleProtectedRoute allowedRoles={['admin']}>
                    <AuctionForm />
                  </RoleProtectedRoute>
                }
              />
              <Route
                path="/admin/auctions/new"
                element={
                  <AdminProtectedRoute>
                    <AuctionForm />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/auctions/:id/edit"
                element={
                  <AdminProtectedRoute>
                    <AuctionForm />
                  </AdminProtectedRoute>
                }
              />
              <Route path="/payment" element={<Payment />} />
              <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={<AdminProtectedRoute><AdminManageUsers /></AdminProtectedRoute>}
              />
              <Route
                path="/admin/properties"
                element={<AdminProtectedRoute><AdminManageProperties /></AdminProtectedRoute>}
              />
              <Route
                path="/admin/categories"
                element={<AdminProtectedRoute><AdminCategories /></AdminProtectedRoute>}
              />
              <Route
                path="/admin/payments"
                element={<AdminProtectedRoute><AdminPayments /></AdminProtectedRoute>}
              />
              <Route
                path="/admin/bookings"
                element={<AdminProtectedRoute><AdminBookings /></AdminProtectedRoute>}
              />
              <Route
                path="/admin/analytics"
                element={<AdminProtectedRoute><AdminAnalytics /></AdminProtectedRoute>}
              />
              <Route
                path="/admin/profile"
                element={<AdminProtectedRoute><AdminProfile /></AdminProtectedRoute>}
              />
              <Route
                path="/admin/cms"
                element={<AdminProtectedRoute><AdminCMS /></AdminProtectedRoute>}
              />
              <Route
                path="/admin/moderation"
                element={<AdminProtectedRoute><AdminModeration /></AdminProtectedRoute>}
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/verify-otp/:token" element={<VerifyOTP />} />
              {/* Catch-all route - only redirects if route truly doesn't exist */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          {!hideFooter && <Footer />}
          <LiveChat />
        </div>
      );
}

export default App;

import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerRoute, VendorRoute, AdminRoute } from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import AiCalculatorPage from './pages/AiCalculatorPage';
import HowItWorksPage from './pages/HowItWorksPage';
import ContactPage from './pages/ContactPage';
import ComingSoonPage from './pages/ComingSoonPage';
import UserTypeSelection from './pages/UserTypeSelection';
import CustomerSignup from './pages/CustomerSignup';
import SignInPage from './pages/SignInPage';
import ResultsPage from './pages/ResultsPage';
import VendorProfilePage from './pages/VendorProfilePage';
import ComparePage from './pages/ComparePage';
import PackagesPage from './pages/PackagesPage';
import TendersPage from './pages/TendersPage';
import JobsPage from './pages/JobsPage';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminVerification from './pages/admin/AdminVerification';
import AdminBriefs from './pages/admin/AdminBriefs';
import AdminUsers from './pages/admin/AdminUsers';
import AdminDisputes from './pages/admin/AdminDisputes';
import AdminPayments from './pages/admin/AdminPayments';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminContent from './pages/admin/AdminContent';
import AdminSettings from './pages/admin/AdminSettings';
import VendorSignup from './pages/vendor/VendorSignup';
import VendorDashboard from './pages/vendor/VendorDashboard';

const hideNavbarFooterPaths = [
  '/admin',
  '/vendor/dashboard',
  '/signin',
  '/user-type',
  '/signup',
  '/contractor/dashboard',
  '/customer/dashboard',
];

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const hideChrome = hideNavbarFooterPaths.some(p => location.pathname.startsWith(p));

  return (
    <div className="flex flex-col min-h-screen">
      {!hideChrome && <Navbar />}
      <main className="flex-grow">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/ai-calculator" element={<AiCalculatorPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/vendor/profile/:vendorId" element={<VendorProfilePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/packages" element={<PackagesPage />} />
          <Route path="/tenders" element={<TendersPage />} />
          <Route path="/jobs" element={<JobsPage />} />

          {/* Coming Soon */}
          <Route path="/freelancers" element={<ComingSoonPage />} />
          <Route path="/market-insight" element={<ComingSoonPage />} />
          <Route path="/ai-services" element={<ComingSoonPage />} />

          {/* Auth */}
          <Route path="/user-type" element={<UserTypeSelection />} />
          <Route path="/signup/customer" element={<CustomerSignup />} />
          <Route path="/vendor/signup" element={<VendorSignup />} />
          <Route path="/vendor/signup/:type" element={<VendorSignup />} />
          <Route path="/signin" element={<SignInPage />} />

          {/* Customer */}
          <Route path="/customer/dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />

          {/* Vendor */}
          <Route path="/vendor/dashboard/*" element={<VendorRoute><VendorDashboard /></VendorRoute>} />

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="verification" element={<AdminVerification />} />
            <Route path="briefs" element={<AdminBriefs />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="disputes" element={<AdminDisputes />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="content" element={<AdminContent />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </main>
      {!hideChrome && <Footer />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

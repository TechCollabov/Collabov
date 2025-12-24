import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerRoute, ContractorRoute, VendorRoute, AdminRoute } from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import AiCalculatorPage from './pages/AiCalculatorPage';
import AiServicesPage from './pages/AiServicesPage';
import IndustriesPage from './pages/IndustriesPage';
import VendorsPage from './pages/VendorsPage';
import SearchResults from './pages/SearchResults';
import HowItWorksPage from './pages/HowItWorksPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import UserTypeSelection from './pages/UserTypeSelection';
import CustomerSignup from './pages/CustomerSignup';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import VendorComparison from './pages/customer/VendorComparison';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminServices from './pages/admin/AdminServices';
import AdminTeams from './pages/admin/AdminTeams';
import AdminBlog from './pages/admin/AdminBlog';
import AdminSettings from './pages/admin/AdminSettings';
import VendorSignup from './pages/vendor/VendorSignup';
import ServiceProviderSelection from './pages/vendor/ServiceProviderSelection';
import IndependentSignup from './pages/vendor/IndependentSignup';
import ContractorDashboard from './pages/contractor/ContractorDashboard';
import ContractorProfileSetup from './pages/contractor/ContractorProfileSetup';
import VendorLogin from './pages/vendor/VendorLogin';
import VendorDashboard from './pages/vendor/VendorDashboard';
import SignInPage from './pages/SignInPage';

// Lazy load the PostJobPage to avoid any import issues
const PostJobPage = React.lazy(() => import('./pages/customer/PostJobPage'));

function AppContent() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {!location.pathname.startsWith('/admin') &&
       !location.pathname.startsWith('/vendor/dashboard') &&
       !location.pathname.startsWith('/sign-in') &&
       !location.pathname.startsWith('/sign-up') &&
       !location.pathname.startsWith('/contractor/dashboard') &&
       !location.pathname.startsWith('/customer/dashboard') &&
       <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/ai-calculator" element={<AiCalculatorPage />} />
          <Route path="/ai-services" element={<AiServicesPage />} />
          <Route path="/industries" element={<IndustriesPage />} />
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/sign-up" element={<UserTypeSelection />} />
          <Route path="/sign-up/vendor" element={<VendorSignup />} />
          <Route path="/sign-up/customer" element={<CustomerSignup />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/vendor/role-selection" element={<ServiceProviderSelection />} />
          <Route path="/independent/signup" element={<IndependentSignup />} />
          <Route path="/contractor/profile-setup" element={<ContractorRoute><ContractorProfileSetup /></ContractorRoute>} />
          <Route path="/contractor/dashboard" element={<ContractorRoute><ContractorDashboard /></ContractorRoute>} />
          <Route path="/vendor/dashboard/*" element={<VendorRoute><VendorDashboard /></VendorRoute>} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/customer/dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />
          <Route path="/customer/compare" element={<CustomerRoute><VendorComparison /></CustomerRoute>} />
          <Route path="/customer/post-job" element={
            <CustomerRoute>
              <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>}>
                <PostJobPage />
              </React.Suspense>
            </CustomerRoute>
          } />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
            <Route index element={<AdminDashboard />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="teams" element={<AdminTeams />} />
            <Route path="blog" element={<AdminBlog />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Routes>
      </main>
      {!location.pathname.startsWith('/admin') &&
       !location.pathname.startsWith('/vendor/dashboard') &&
       !location.pathname.startsWith('/sign-in') &&
       !location.pathname.startsWith('/sign-up') &&
       !location.pathname.startsWith('/contractor/dashboard') &&
       !location.pathname.startsWith('/customer/dashboard') &&
       <Footer />}
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
import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import FreelancerSignup from './pages/vendor/FreelancerSignup';
import FreelancerDashboard from './pages/freelancer/FreelancerDashboard';
import FreelancerProfileSetup from './pages/freelancer/FreelancerProfileSetup';
import VendorLogin from './pages/vendor/VendorLogin';
import VendorDashboard from './pages/vendor/VendorDashboard';
import SignInPage from './pages/SignInPage';

// Lazy load the PostJobPage to avoid any import issues
const PostJobPage = React.lazy(() => import('./pages/customer/PostJobPage'));

function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen">
      {!location.pathname.startsWith('/admin') && 
       !location.pathname.startsWith('/vendor/dashboard') && 
       !location.pathname.startsWith('/vendor/login') && 
       !location.pathname.startsWith('/vendor/signup') && 
       !location.pathname.startsWith('/freelancer/dashboard') && 
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
          <Route path="/vendor/signup" element={<VendorSignup />} />
          <Route path="/vendor/role-selection" element={<ServiceProviderSelection />} />
          <Route path="/freelancer/signup" element={<FreelancerSignup />} />
          <Route path="/freelancer/dashboard" element={<FreelancerDashboard />} />
          <Route path="/freelancer/profile-setup" element={<FreelancerProfileSetup />} />
          <Route path="/freelancer/login" element={<VendorLogin />} />
          <Route path="/vendor/login" element={<VendorLogin />} />
          <Route path="/vendor/dashboard/*" element={<VendorDashboard />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/user-type" element={<UserTypeSelection />} />
          <Route path="/customer/signup" element={<CustomerSignup />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/customer/compare" element={<VendorComparison />} />
          <Route path="/customer/post-job" element={
            <React.Suspense fallback={<div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>}>
              <PostJobPage />
            </React.Suspense>
          } />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
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
       !location.pathname.startsWith('/vendor/login') && 
       !location.pathname.startsWith('/vendor/signup') && 
       !location.pathname.startsWith('/freelancer/dashboard') && 
       !location.pathname.startsWith('/customer/dashboard') && 
       <Footer />}
    </div>
  );
}

export default App;
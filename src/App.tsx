import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerRoute, VendorRoute, AdminRoute, ContractorRoute } from './components/auth/ProtectedRoute';
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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ResultsPage from './pages/ResultsPage';
import VendorProfilePage from './pages/VendorProfilePage';
import ComparePage from './pages/ComparePage';
import PackagesPage from './pages/PackagesPage';
import TendersPage from './pages/TendersPage';
import JobsPage from './pages/JobsPage';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import PostJobPage from './pages/customer/PostJobPage';
import BYOVPage from './pages/customer/BYOVPage';
import ContractorDashboard from './pages/contractor/ContractorDashboard';
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
import OAuthConsentPage from './pages/OAuthConsentPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import IR35GuidancePage from './pages/IR35GuidancePage';
import PlaceholderPage from './pages/PlaceholderPage';
import MessagingPage from './pages/MessagingPage';
import ProposalTriagePage from './pages/ProposalTriagePage';
import DiscoveryBriefPage from './pages/DiscoveryBriefPage';
import SOWWizardPage from './pages/SOWWizardPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import EngagementWorkspacePage from './pages/EngagementWorkspacePage';
import ReviewPage from './pages/ReviewPage';
import MyVendorsPage from './pages/customer/MyVendorsPage';
import EvidenceBuilderPage from './pages/vendor/dashboard/EvidenceBuilder';

const hideNavbarFooterPaths = [
  '/admin',
  '/vendor/dashboard',
  '/signin',
  '/forgot-password',
  '/reset-password',
  '/user-type',
  '/signup',
  '/contractor/dashboard',
  '/customer/post-job',
  '/customer/dashboard',
  '/oauth/consent',
  '/messages',
  '/proposals',
  '/sow-wizard',
  '/discovery-brief',
  '/project',
  '/engagement',
  '/review',
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

          {/* Sprint 2 — Proposal & Contract flows */}
          <Route path="/proposals" element={<CustomerRoute><ProposalTriagePage /></CustomerRoute>} />
          <Route path="/discovery-brief" element={<CustomerRoute><DiscoveryBriefPage /></CustomerRoute>} />
          <Route path="/sow-wizard" element={<CustomerRoute><SOWWizardPage /></CustomerRoute>} />
          <Route path="/messages" element={<MessagingPage />} />

          {/* Sprint 3 — Engagement flows */}
          <Route path="/project/:engagementId" element={<ProjectDetailPage />} />
          <Route path="/engagement/:engagementId" element={<EngagementWorkspacePage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/customer/my-vendors" element={<CustomerRoute><MyVendorsPage /></CustomerRoute>} />

          {/* Legal & Info */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/ir35-guidance" element={<IR35GuidancePage />} />
          <Route path="/ir35" element={<IR35GuidancePage />} />

          {/* Placeholder pages */}
          <Route path="/careers" element={<PlaceholderPage title="Careers at Collabov" description="We're building the team. Check back soon for open roles." />} />
          <Route path="/blog" element={<PlaceholderPage title="Collabov Blog" description="Insights on IT outsourcing, IR35, and building remote teams. Coming soon." />} />
          <Route path="/help" element={<PlaceholderPage title="Help Centre" description="Our help centre is being built. For urgent support, email support@collabov.com" />} />
          <Route path="/faq" element={<PlaceholderPage title="Frequently Asked Questions" description="Common questions about Collabov, answered." />} />
          <Route path="/partner" element={<PlaceholderPage title="Partner Programme" description="Our partner programme is launching soon. Register your interest at partners@collabov.com" />} />
          <Route path="/security" element={<PlaceholderPage title="Security at Collabov" description="We take platform security seriously. Full security documentation coming soon." />} />
          <Route path="/coming-soon" element={<ComingSoonPage />} />

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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/oauth/consent" element={<OAuthConsentPage />} />

          {/* Customer */}
          <Route path="/customer/dashboard" element={<CustomerRoute><CustomerDashboard /></CustomerRoute>} />
          <Route path="/customer/post-job" element={<CustomerRoute><PostJobPage /></CustomerRoute>} />
          <Route path="/customer/byov" element={<CustomerRoute><BYOVPage /></CustomerRoute>} />

          {/* Contractor */}
          <Route path="/contractor/dashboard" element={<ContractorRoute><ContractorDashboard /></ContractorRoute>} />

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

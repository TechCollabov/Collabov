import React from 'react';

const TermsPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 py-16">
    <div className="container mx-auto px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-[#0B2D59] mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: June 2026 · Rapman Services Private Limited</p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p className="text-sm text-amber-800 font-medium">⚠️ Legal content pending solicitor review. Full Terms of Service will be published before platform go-live. Operated by Rapman Services Private Limited (Company No. 15814392), registered in England and Wales.</p>
      </div>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <p>These Terms of Service govern your use of the Collabov platform, operated by Rapman Services Private Limited ("Collabov", "we", "us"). By creating an account or using any part of the platform, you agree to these terms.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">1. Platform Description</h2>
        <p>Collabov is a B2B marketplace connecting UK businesses with verified IT service providers including managed service providers (MSPs), IT agencies, and staff augmentation firms. The platform facilitates vendor discovery, contract execution, milestone-based payments via escrow, and delivery governance.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">2. Account Registration</h2>
        <p>You must provide accurate information when creating an account. Business email addresses are required. You are responsible for maintaining the security of your account credentials.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">3. Platform Fee</h2>
        <p>Collabov charges a platform fee to vendors on each payment release. The current fee percentage is displayed in your vendor dashboard. All fees are deducted automatically before payout via Stripe Connect.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">4. Escrow and Payments</h2>
        <p>All payments are processed via Stripe Connect. Milestone funds are held in escrow and released only upon buyer confirmation or after the 7-day auto-release window. Buyers cannot cancel Stripe subscriptions directly — cancellations must be processed through the platform termination flow.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">5. Governing Law</h2>
        <p>These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
        <p className="text-sm text-gray-400 mt-8">Full legally-reviewed Terms of Service will replace this placeholder before platform launch. Contact legal@collabov.com with questions.</p>
      </div>
    </div>
  </div>
);

export default TermsPage;

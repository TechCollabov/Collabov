import React from 'react';

const PrivacyPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 py-16">
    <div className="container mx-auto px-8 max-w-3xl">
      <h1 className="text-3xl font-bold text-[#0B2D59] mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: June 2026 · Rapman Services Private Limited</p>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <p className="text-sm text-amber-800 font-medium">⚠️ Legal content pending solicitor review. Full Privacy Policy will be published before platform go-live.</p>
      </div>
      <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
        <p>This Privacy Policy explains how Rapman Services Private Limited ("Collabov") collects, uses, and protects your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">Data We Collect</h2>
        <p>We collect account information (name, email, company), usage data (searches, profile views, engagement activity), payment information processed via Stripe, and communications within the platform.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">How We Use Your Data</h2>
        <p>To provide the platform service, facilitate contracts and payments, send notifications, and improve platform features. We do not sell your data to third parties.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">Your Rights (UK GDPR)</h2>
        <p>You have the right to access, correct, or delete your data. To request a data export (Article 20), email support@collabov.com — we will respond within 30 days.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">Data Retention</h2>
        <p>Account data is retained for the duration of your account. Contract and payment records are retained for 7 years for legal compliance.</p>
        <h2 className="text-xl font-semibold text-[#0B2D59]">Contact</h2>
        <p>For data protection queries: privacy@collabov.com. Our Data Protection Officer can be contacted at the same address.</p>
        <p className="text-sm text-gray-400 mt-8">Full legally-reviewed Privacy Policy will replace this placeholder before platform launch.</p>
      </div>
    </div>
  </div>
);

export default PrivacyPage;

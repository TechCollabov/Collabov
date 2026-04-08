import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, FileText, Headphones } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer>
      {/* Pre-footer trust strip */}
      <div className="bg-[#0B2D59] text-white py-10">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <ShieldCheck className="h-8 w-8 text-blue-300 flex-shrink-0 mt-1" />
              <div>
                <div className="font-bold mb-1">Verified Vendors Only</div>
                <div className="text-sm text-blue-200">Every vendor is manually reviewed before their profile goes live</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Lock className="h-8 w-8 text-blue-300 flex-shrink-0 mt-1" />
              <div>
                <div className="font-bold mb-1">Escrow-Protected Payments</div>
                <div className="text-sm text-blue-200">Funds are held securely until you approve the work</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <FileText className="h-8 w-8 text-blue-300 flex-shrink-0 mt-1" />
              <div>
                <div className="font-bold mb-1">Platform-Standard Contracts</div>
                <div className="text-sm text-blue-200">UK GDPR and IR35 compliance built into every engagement</div>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Headphones className="h-8 w-8 text-blue-300 flex-shrink-0 mt-1" />
              <div>
                <div className="font-bold mb-1">UK-Based Support</div>
                <div className="text-sm text-blue-200">A real human support team, not just a chatbot</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            {/* Outsource */}
            <div>
              <h4 className="text-white font-semibold mb-5">Outsource</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/results?type=dedicated" className="hover:text-white transition-colors">Dedicated Teams</Link></li>
                <li><Link to="/results?type=agency" className="hover:text-white transition-colors">IT Agencies</Link></li>
                <li><Link to="/results?type=msp" className="hover:text-white transition-colors">MSPs</Link></li>
                <li><Link to="/results?type=staffaug" className="hover:text-white transition-colors">Staff Augmentation</Link></li>
                <li className="flex items-center gap-2">
                  <Link to="/freelancers" className="hover:text-white transition-colors">Freelancers</Link>
                  <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">Coming Soon</span>
                </li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-white font-semibold mb-5">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/customer/dashboard" className="hover:text-white transition-colors">Post a Job</Link></li>
                <li><Link to="/customer/dashboard" className="hover:text-white transition-colors">Create a Tender</Link></li>
                <li><Link to="/packages" className="hover:text-white transition-colors">Browse Packages</Link></li>
                <li><Link to="/ai-calculator" className="hover:text-white transition-colors">Outsourcing Calculator</Link></li>
                <li className="flex items-center gap-2">
                  <Link to="/market-insight" className="hover:text-white transition-colors">Market Insight</Link>
                  <span className="text-xs bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">Coming Soon</span>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-5">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/partner" className="hover:text-white transition-colors">Partner Programme</Link></li>
              </ul>
            </div>

            {/* Legal & Support */}
            <div>
              <h4 className="text-white font-semibold mb-5">Legal & Support</h4>
              <ul className="space-y-3 text-sm">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Centre</Link></li>
                <li><Link to="/faq" className="hover:text-white transition-colors">FAQs</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/ir35" className="hover:text-white transition-colors">IR35 Guidance</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
              </ul>
            </div>
          </div>

          <hr className="border-gray-700 mb-6" />

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <div>
              <span>© 2026 Rapman Services Private Limited. All rights reserved. </span>
              <span>Collabov — Collaborate overseas with ease.</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded font-medium">Stripe Verified</span>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded font-medium">Visa</span>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded font-medium">Mastercard</span>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded font-medium">Amex</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

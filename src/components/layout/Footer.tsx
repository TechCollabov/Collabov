import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Facebook } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0B2D59] text-white">
      <div className="container mx-auto px-5 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Collabov */}
          <div>
            <h4 className="text-lg font-semibold mb-6">About Collabov</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="hover:text-gray-300 transition-colors">About Us</Link></li>
              <li><Link to="/how-it-works" className="hover:text-gray-300 transition-colors">How It Works</Link></li>
              <li><Link to="/careers" className="hover:text-gray-300 transition-colors">Careers</Link></li>
              <li><Link to="/blog" className="hover:text-gray-300 transition-colors">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-gray-300 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Services</h4>
            <ul className="space-y-3">
              <li><Link to="/services" className="hover:text-gray-300 transition-colors">Outsource Projects</Link></li>
              <li><Link to="/ai-services" className="hover:text-gray-300 transition-colors">AI Services</Link></li>
              <li><Link to="/packages" className="hover:text-gray-300 transition-colors">Packages & Bundles</Link></li>
              <li><Link to="/freelancers" className="hover:text-gray-300 transition-colors">Freelancers</Link></li>
              <li><Link to="/teams" className="hover:text-gray-300 transition-colors">Dedicated Teams</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Support</h4>
            <ul className="space-y-3">
              <li><Link to="/help" className="hover:text-gray-300 transition-colors">Help Center</Link></li>
              <li><Link to="/faq" className="hover:text-gray-300 transition-colors">FAQs</Link></li>
              <li><Link to="/terms" className="hover:text-gray-300 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/security" className="hover:text-gray-300 transition-colors">Security</Link></li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Connect With Us</h4>
            <div className="flex space-x-4 mb-6">
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="LinkedIn">
                <Linkedin size={24} />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Twitter">
                <Twitter size={24} />
              </a>
              <a href="#" className="hover:text-gray-300 transition-colors" aria-label="Facebook">
                <Facebook size={24} />
              </a>
            </div>
            
            <div>
              <h5 className="font-medium mb-3">Newsletter Signup:</h5>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="flex-1 px-3 py-2 rounded text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <button className="px-4 py-2 bg-[#FF6F61] text-white rounded hover:bg-[#e55a4f] transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-600 my-8" />

        <div className="text-center text-sm">
          <p className="mb-2">© 2025 Rapman Services Private Limited. All rights reserved.</p>
          <p className="text-gray-300">Collabov — Collaborate overseas with ease.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
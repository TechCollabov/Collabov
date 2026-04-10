import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Globe, LogIn, ChevronDown, Briefcase } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOutsourceOpen, setIsOutsourceOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const { profile } = useAuth();

  const closeMenu = () => setIsOpen(false);
  const isCustomer = profile?.user_type === 'customer';

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-8 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <Globe className="h-8 w-8 text-[#0070F3]" />
            <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            <nav className="flex items-center space-x-8">

              {/* Outsource Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsOutsourceOpen(true)}
                onMouseLeave={() => setIsOutsourceOpen(false)}
              >
                <button className="flex items-center gap-1 text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200 py-2">
                  Outsource <ChevronDown className="h-4 w-4" />
                </button>

                {isOutsourceOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 py-5 z-50">
                    <div className="px-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Long Term</p>
                      <div className="space-y-1 mb-4">
                        <Link to="/results?type=dedicated" className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm" onClick={() => setIsOutsourceOpen(false)}>
                          Dedicated Teams
                        </Link>
                        <Link to="/results?type=agency" className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm" onClick={() => setIsOutsourceOpen(false)}>
                          IT Agencies
                        </Link>
                        <Link to="/results?type=msp" className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm" onClick={() => setIsOutsourceOpen(false)}>
                          MSPs
                        </Link>
                      </div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Short Term</p>
                      <div className="space-y-1 mb-4">
                        <Link to="/results?type=staffaug" className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm" onClick={() => setIsOutsourceOpen(false)}>
                          Staff Augmentation
                        </Link>
                        <Link to="/freelancers" className="flex items-center gap-2 px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm" onClick={() => setIsOutsourceOpen(false)}>
                          Freelancers
                          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Coming Soon</span>
                        </Link>
                      </div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Other</p>
                      <div className="space-y-1">
                        <Link to="/ai-calculator" className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm" onClick={() => setIsOutsourceOpen(false)}>
                          Outsourcing Calculator
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Projects Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsProjectsOpen(true)}
                onMouseLeave={() => setIsProjectsOpen(false)}
              >
                <button className="flex items-center gap-1 text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200 py-2">
                  Projects <ChevronDown className="h-4 w-4" />
                </button>

                {isProjectsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-4 z-50">
                    <div className="px-4 space-y-1">
                      <Link to="/tenders" className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm" onClick={() => setIsProjectsOpen(false)}>
                        Tenders
                      </Link>
                      <Link to="/jobs" className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm" onClick={() => setIsProjectsOpen(false)}>
                        Jobs
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Flat links */}
              <NavLink to="/packages" className={({ isActive }) => `text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200 ${isActive ? 'text-[#0070F3]' : ''}`}>
                Packages
              </NavLink>
              <NavLink to="/market-insight" className={({ isActive }) => `text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200 ${isActive ? 'text-[#0070F3]' : ''}`}>
                Market Insight
              </NavLink>
            </nav>

            {/* Right-side action buttons */}
            <div className="flex items-center gap-2 ml-4">
              {isCustomer && (
                <Link to="/customer/dashboard" className="px-4 py-2 border-2 border-[#0070F3] text-[#0070F3] rounded-lg hover:bg-blue-50 transition-colors duration-200 font-medium flex items-center gap-1 text-sm">
                  <Briefcase className="h-4 w-4" />
                  Post a Job
                </Link>
              )}
              <Link to="/signin" className="px-4 py-2 bg-[#0070F3] text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center gap-1">
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
              <Link to="/user-type" className="px-4 py-2 bg-white text-[#0070F3] border-2 border-[#0070F3] rounded-lg hover:bg-[#0070F3] hover:text-white transition-colors duration-200 font-medium">
                Sign Up
              </Link>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button className="lg:hidden text-[#0B2D59] focus:outline-none" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Full-Screen Panel */}
          <div className={`fixed inset-0 bg-white z-50 lg:hidden transition-transform duration-300 ease-in-out transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
            <div className="container py-5 flex justify-between items-center border-b border-gray-100">
              <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
                <Globe className="h-8 w-8 text-[#0070F3]" />
                <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
              </Link>
              <button className="text-[#0B2D59] focus:outline-none" onClick={() => setIsOpen(false)} aria-label="Close menu">
                <X size={24} />
              </button>
            </div>

            <nav className="container py-6 flex-1 overflow-y-auto">
              {/* Outsource */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Outsource</h3>
                <p className="text-xs text-gray-400 mt-2 mb-1 ml-2">Long Term</p>
                <div className="ml-2 space-y-1 mb-3">
                  <Link to="/results?type=dedicated" className="block py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>Dedicated Teams</Link>
                  <Link to="/results?type=agency" className="block py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>IT Agencies</Link>
                  <Link to="/results?type=msp" className="block py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>MSPs</Link>
                </div>
                <p className="text-xs text-gray-400 mb-1 ml-2">Short Term</p>
                <div className="ml-2 space-y-1 mb-3">
                  <Link to="/results?type=staffaug" className="block py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>Staff Augmentation</Link>
                  <Link to="/freelancers" className="flex items-center gap-2 py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>
                    Freelancers <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-semibold">Coming Soon</span>
                  </Link>
                </div>
                <p className="text-xs text-gray-400 mb-1 ml-2">Other</p>
                <div className="ml-2">
                  <Link to="/ai-calculator" className="block py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>Outsourcing Calculator</Link>
                </div>
              </div>

              {/* Projects */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Projects</h3>
                <div className="ml-2 space-y-1">
                  <Link to="/tenders" className="block py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>Tenders</Link>
                  <Link to="/jobs" className="block py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>Jobs</Link>
                </div>
              </div>

              {/* Flat links */}
              <div className="mb-6 space-y-1">
                <Link to="/packages" className="block py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>Packages</Link>
                <Link to="/market-insight" className="block py-2 px-3 text-[#0B2D59] font-medium hover:text-[#0070F3] hover:bg-blue-50 rounded-lg" onClick={closeMenu}>Market Insight</Link>
              </div>

              {isCustomer && (
                <div className="mb-4">
                  <Link to="/customer/dashboard" className="block py-2 px-3 text-[#0070F3] font-medium hover:bg-blue-50 rounded-lg" onClick={closeMenu}>Post a Job</Link>
                </div>
              )}
            </nav>

            {/* Mobile bottom CTA buttons */}
            <div className="container pb-8 space-y-3 border-t border-gray-100 pt-4">
              <Link to="/signin" className="block w-full py-3 text-center bg-[#0070F3] text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors" onClick={closeMenu}>
                Sign In
              </Link>
              <Link to="/user-type" className="block w-full py-3 text-center border-2 border-[#0070F3] text-[#0070F3] rounded-lg font-semibold hover:bg-blue-50 transition-colors" onClick={closeMenu}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

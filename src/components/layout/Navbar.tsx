import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X, Globe, LogIn, Search, ChevronDown } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isOutsourceOpen, setIsOutsourceOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  const navLinks = [
    { name: 'AI Services', path: '/ai-services' },
    { name: 'Outsourcing Calculator', path: '/ai-calculator' },
    { name: 'Packages', path: '/packages' },
    { name: 'Market Insight', path: '/market-insight' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="container mx-auto px-8 py-5">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <Globe className="h-8 w-8 text-[#0070F3]" />
            <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
          </Link>

          {/* Desktop Navigation - Right aligned and grouped close to sign-in */}
          <div className="hidden lg:flex items-center space-x-6">
            <nav className="flex items-center space-x-8">
            {/* Outsource Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setIsOutsourceOpen(true)}
              onMouseLeave={() => setIsOutsourceOpen(false)}
            >
              <button className="flex items-center text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200 py-2">
                Outsource
              </button>
              
              {isOutsourceOpen && (
                <div className="absolute top-full left-0 mt-1 w-auto bg-white rounded-xl shadow-2xl border border-gray-100 py-6 z-50 backdrop-blur-sm bg-white/95">
                  <div className="px-8">
                    <div className="space-y-3">
                      <Link
                        to="/services"
                        className="block px-4 py-2 text-[#0B2D59] hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 whitespace-nowrap font-medium hover:shadow-sm"
                        onClick={() => setIsOutsourceOpen(false)}
                      >
                        Dedicated Teams
                      </Link>
                      <Link
                        to="/vendors"
                        className="block px-4 py-2 text-[#0B2D59] hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 whitespace-nowrap font-medium hover:shadow-sm"
                        onClick={() => setIsOutsourceOpen(false)}
                      >
                        Companies
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
              <button className="flex items-center text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200 py-2">
                Projects
              </button>
              
              {isProjectsOpen && (
                <div className="absolute top-full left-0 mt-1 w-auto bg-white rounded-xl shadow-2xl border border-gray-100 py-6 z-50 backdrop-blur-sm bg-white/95"
                     onMouseEnter={() => setIsProjectsOpen(true)}
                     onMouseLeave={() => setIsProjectsOpen(false)}>
                  <div className="px-8">
                    <div className="space-y-3">
                      <Link 
                        to="/contractors" 
                        className="block px-4 py-2 text-[#0B2D59] hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 whitespace-nowrap font-medium hover:shadow-sm"
                        onClick={() => setIsProjectsOpen(false)}
                      >
                        Tenders
                      </Link>
                      <Link 
                        to="/jobs" 
                        className="block px-4 py-2 text-[#0B2D59] hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 whitespace-nowrap font-medium hover:shadow-sm"
                        onClick={() => setIsProjectsOpen(false)}
                      >
                        Jobs
                      </Link>
                      <Link 
                        to="/tasks" 
                        className="block px-4 py-2 text-[#0B2D59] hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 whitespace-nowrap font-medium hover:shadow-sm"
                        onClick={() => setIsProjectsOpen(false)}
                      >
                        Tasks
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) => 
                  `text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200 ${
                    isActive ? 'text-[#0070F3]' : ''
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

            {/* Sign In Button - Close to navigation */}
            <Link 
              to="/signin" 
              className="px-4 py-2 bg-[#0070F3] text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium flex items-center ml-4"
            >
              <LogIn className="h-4 w-4 mr-1" />
              Sign In
            </Link>
            
            {/* Sign Up Button */}
            <Link 
              to="/user-type" 
              className="px-4 py-2 bg-white text-[#0070F3] border-2 border-[#0070F3] rounded-lg hover:bg-[#0070F3] hover:text-white transition-colors duration-200 font-medium flex items-center ml-2"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Navigation Toggle */}
          <button 
            className="lg:hidden text-[#0B2D59] focus:outline-none" 
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Navigation Menu */}
          <div 
            className={`fixed inset-0 bg-white z-50 lg:hidden transition-transform duration-300 ease-in-out transform ${
              isOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className="container py-5 flex justify-between items-center">
              <Link to="/" className="flex items-center space-x-2" onClick={closeMenu}>
                <Globe className="h-8 w-8 text-[#0070F3]" />
                <span className="text-xl font-bold text-[#0B2D59]">Collabov</span>
              </Link>
              <button 
                className="text-[#0B2D59] focus:outline-none" 
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            <nav className="container py-8">
              {/* Mobile Outsource Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#0B2D59] mb-4">Outsource</h3>
                <div className="ml-4 space-y-2">
                  <Link
                    to="/services"
                    className="block text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    Dedicated Teams
                  </Link>
                  <Link
                    to="/vendors"
                    className="block text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    Companies
                  </Link>
                </div>
              </div>

              {/* Mobile Projects Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-[#0B2D59] mb-4">Projects</h3>
                <div className="ml-4 space-y-2">
                  <Link
                    to="/tenders"
                    className="block text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    Tenders
                  </Link>
                  <Link
                    to="/jobs"
                    className="block text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    Jobs
                  </Link>
                  <Link
                    to="/tasks"
                    className="block text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200"
                    onClick={closeMenu}
                  >
                    Tasks
                  </Link>
                </div>
              </div>
              
              {navLinks.map((link) => (
                <div key={link.path} className="mb-6">
                  <NavLink
                    to={link.path}
                    className={({ isActive }) => 
                      `block text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200 ${
                        isActive ? 'text-[#0070F3]' : ''
                      }`
                    }
                    onClick={closeMenu}
                  >
                    {link.name}
                  </NavLink>
                </div>
              ))}
              
              {/* Sign Up Link */}
              <div className="mb-6">
                <Link
                  to="/user-type"
                  className="block text-[#0B2D59] font-medium hover:text-[#0070F3] transition-colors duration-200"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
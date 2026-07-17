import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Package, MessageSquare, Bell, Users, Settings,
  Menu, X, LogOut, Globe, ClipboardList, Mail, Briefcase,
  CreditCard, BarChart2, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const VendorLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFindOpen, setIsFindOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const location = useLocation();
  const { signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
    { name: 'My Listing', href: '/vendor/dashboard/listings', icon: FileText },
    { name: 'Team Members', href: '/vendor/dashboard/employees', icon: Users },
    { name: 'Services & Packages', href: '/vendor/dashboard/packages', icon: Package },
    { name: 'Enquiries', href: '/vendor/dashboard/enquiries', icon: MessageSquare },
    { name: 'Active Contracts', href: '/vendor/dashboard/contracts', icon: ClipboardList },
    { name: 'Job Board', href: '/vendor/dashboard/jobs', icon: Briefcase },
    { name: 'Inbox', href: '/messages', icon: Mail },
    { name: 'Payments', href: '/vendor/dashboard/payments', icon: CreditCard },
    { name: 'Analytics', href: '/vendor/dashboard/analytics', icon: BarChart2 },
    { name: 'Notifications', href: '/vendor/dashboard/notifications', icon: Bell },
    { name: 'Account Settings', href: '/vendor/dashboard/settings', icon: Settings },
  ];

  const isActive = (href: string) =>
    href === '/vendor/dashboard'
      ? location.pathname === '/vendor/dashboard'
      : location.pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col`}>
        <div className="flex items-center justify-between h-16 px-4 border-b flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-[#0070F3]" />
            <span className="text-lg font-bold text-[#0B2D59]">Collabov</span>
          </Link>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 mt-1 text-sm rounded-lg transition-colors ${
                  active ? 'bg-blue-50 text-[#0070F3] font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="flex-shrink-0 p-3 border-t">
          <button
            onClick={() => signOut()}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
          <div className="flex items-center justify-between h-14 px-4">
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-gray-500" />
            </button>

            <nav className="hidden lg:flex items-center gap-6">
              {/* Find Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsFindOpen(true)}
                onMouseLeave={() => setIsFindOpen(false)}
              >
                <button className="flex items-center gap-1 text-[#0B2D59] font-medium text-sm hover:text-[#0070F3] transition-colors duration-200 py-2">
                  Find <ChevronDown className="h-4 w-4" />
                </button>

                {isFindOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 z-50">
                    <div className="px-3">
                      <Link
                        to="/vendor/dashboard/jobs"
                        className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm"
                        onClick={() => setIsFindOpen(false)}
                      >
                        Jobs and Tenders
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Workspace Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsWorkspaceOpen(true)}
                onMouseLeave={() => setIsWorkspaceOpen(false)}
              >
                <button className="flex items-center gap-1 text-[#0B2D59] font-medium text-sm hover:text-[#0070F3] transition-colors duration-200 py-2">
                  Workspace <ChevronDown className="h-4 w-4" />
                </button>

                {isWorkspaceOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 z-50">
                    <div className="px-3 space-y-1">
                      <Link
                        to="/vendor/dashboard/proposals"
                        className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm"
                        onClick={() => setIsWorkspaceOpen(false)}
                      >
                        Proposals
                      </Link>
                      <Link
                        to="/vendor/dashboard/contracts"
                        className="block px-3 py-2 text-[#0B2D59] hover:bg-blue-50 hover:text-[#0070F3] rounded-lg transition-all duration-200 font-medium text-sm"
                        onClick={() => setIsWorkspaceOpen(false)}
                      >
                        Contracts
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            <div className="flex items-center gap-3 ml-auto">
              <Link to="/vendor/dashboard/notifications" className="p-1.5 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </Link>
              <Link to="/messages" className="p-1.5 text-gray-400 hover:text-gray-600">
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VendorLayout;

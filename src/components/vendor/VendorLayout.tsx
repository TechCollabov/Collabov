import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Package, MessageSquare, Bell, Users, Settings,
  Menu, X, LogOut, Globe, FileContract as FileContract2, Mail, Briefcase,
  CreditCard, BarChart2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const VendorLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { signOut } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/vendor/dashboard', icon: LayoutDashboard },
    { name: 'My Listing', href: '/vendor/dashboard/listings', icon: FileText },
    { name: 'Team Members', href: '/vendor/dashboard/employees', icon: Users },
    { name: 'Services & Packages', href: '/vendor/dashboard/packages', icon: Package },
    { name: 'Enquiries', href: '/vendor/dashboard/enquiries', icon: MessageSquare },
    { name: 'Active Contracts', href: '/vendor/dashboard/contracts', icon: FileContract2 },
    { name: 'Job Board', href: '/vendor/dashboard/jobs', icon: Briefcase },
    { name: 'Inbox', href: '/vendor/dashboard/inbox', icon: Mail },
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
            <div className="flex items-center gap-3 ml-auto">
              <button className="p-1.5 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
              <button className="p-1.5 text-gray-400 hover:text-gray-600">
                <Mail className="h-5 w-5" />
              </button>
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

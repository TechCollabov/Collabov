import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShieldCheck, FileText, Users, AlertTriangle,
  CreditCard, BarChart2, BookOpen, Settings, Menu, X, LogOut, Globe
} from 'lucide-react';

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Vendor Verification', href: '/admin/verification', icon: ShieldCheck },
    { name: 'Brief & Tender Review', href: '/admin/briefs', icon: FileText },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Disputes', href: '/admin/disputes', icon: AlertTriangle },
    { name: 'Payments', href: '/admin/payments', icon: CreditCard },
    { name: 'Platform Analytics', href: '/admin/analytics', icon: BarChart2 },
    { name: 'Content Management', href: '/admin/content', icon: BookOpen },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (item: typeof navigation[0]) =>
    item.exact ? location.pathname === item.href : location.pathname.startsWith(item.href);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col`}>
        <div className="flex items-center justify-between h-16 px-4 border-b flex-shrink-0">
          <Link to="/" className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-[#0070F3]" />
            <span className="text-lg font-bold text-[#0B2D59]">Collabov</span>
          </Link>
          <div>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-semibold">Admin</span>
          </div>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
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
          <Link
            to="/"
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Exit Admin
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-14 px-6">
            <button className="lg:hidden" onClick={() => setIsSidebarOpen(true)}>
              <Menu className="h-5 w-5 text-gray-500" />
            </button>
            <span className="text-sm text-gray-500 ml-auto">Admin Panel</span>
          </div>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

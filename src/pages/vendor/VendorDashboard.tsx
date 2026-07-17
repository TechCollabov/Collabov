import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import DashboardHome from './dashboard/DashboardHome';
import ManageListings from './dashboard/ManageListings';
import ManageContracts from './dashboard/ManageContracts';
import Packages from './dashboard/Packages';
import Enquiries from './dashboard/Enquiries';
import Notifications from './dashboard/Notifications';
import ManageEmployee from './dashboard/ManageEmployee';
import AccountSettings from './dashboard/AccountSettings';
import JobBoard from './dashboard/JobBoard';
import VendorAnalytics from './dashboard/VendorAnalytics';
import VendorPayments from './dashboard/VendorPayments';
import MyProposals from './dashboard/MyProposals';

const VendorDashboard: React.FC = () => {
  return (
    <Routes>
      <Route element={<VendorLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="listings" element={<ManageListings />} />
        <Route path="contracts" element={<ManageContracts />} />
        <Route path="packages" element={<Packages />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="employees" element={<ManageEmployee />} />
        <Route path="settings" element={<AccountSettings />} />
        <Route path="jobs" element={<JobBoard />} />
        <Route path="analytics" element={<VendorAnalytics />} />
        <Route path="payments" element={<VendorPayments />} />
        <Route path="proposals" element={<MyProposals />} />
      </Route>
    </Routes>
  );
};

export default VendorDashboard;
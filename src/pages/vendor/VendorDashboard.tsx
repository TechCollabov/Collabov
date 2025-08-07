import React from 'react';
import { Routes, Route } from 'react-router-dom';
import VendorLayout from '../../components/vendor/VendorLayout';
import DashboardHome from './dashboard/DashboardHome';
import ManageListings from './dashboard/ManageListings';
import ManageContracts from './dashboard/ManageContracts';
import Packages from './dashboard/Packages';
import Enquiries from './dashboard/Enquiries';
import Inbox from './dashboard/Inbox';
import Notifications from './dashboard/Notifications';
import ManageEmployee from './dashboard/ManageEmployee';
import AccountSettings from './dashboard/AccountSettings';

const VendorDashboard: React.FC = () => {
  return (
    <Routes>
      <Route element={<VendorLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="listings" element={<ManageListings />} />
        <Route path="contracts" element={<ManageContracts />} />
        <Route path="packages" element={<Packages />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="employees" element={<ManageEmployee />} />
        <Route path="settings" element={<AccountSettings />} />
      </Route>
    </Routes>
  );
};

export default VendorDashboard;
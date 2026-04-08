import React, { useState } from 'react';
import { Search, ShieldCheck, User, Building2, Ban, Mail } from 'lucide-react';

const USERS = [
  { id: '1', name: 'Sarah Mitchell', email: 'sarah@finedge.co.uk', role: 'buyer', company: 'FinEdge Capital', joined: '12 Jan 2026', status: 'active', projects: 3 },
  { id: '2', name: 'James Okafor', email: 'james@greenpath.co.uk', role: 'buyer', company: 'GreenPath Logistics', joined: '5 Feb 2026', status: 'active', projects: 1 },
  { id: '3', name: 'TechPro Solutions', email: 'admin@techpro.co.uk', role: 'vendor', company: 'TechPro Solutions', joined: '20 Oct 2025', status: 'active', projects: 23 },
  { id: '4', name: 'CloudBridge MSP', email: 'ops@cloudbridge.co.uk', role: 'vendor', company: 'CloudBridge MSP', joined: '3 Nov 2025', status: 'active', projects: 15 },
  { id: '5', name: 'Amanda Hughes', email: 'amanda@medcore.co.uk', role: 'buyer', company: 'MedCore Health', joined: '18 Mar 2026', status: 'active', projects: 2 },
  { id: '6', name: 'DataFlow Labs', email: 'team@dataflowlabs.io', role: 'vendor', company: 'DataFlow Labs', joined: '1 Apr 2026', status: 'suspended', projects: 0 },
  { id: '7', name: 'David Park', email: 'david@tradepoint.co.uk', role: 'buyer', company: 'TradePoint Exchange', joined: '28 Feb 2026', status: 'active', projects: 1 },
  { id: '8', name: 'NexGen IT', email: 'hello@nexgenit.co.uk', role: 'vendor', company: 'NexGen IT', joined: '15 Mar 2026', status: 'pending', projects: 0 },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
};

const AdminUsers: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState(USERS);

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSuspend = (id: string) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u));
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">User Management</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0070F3]"
          />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
          {['all', 'buyer', 'vendor'].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${roleFilter === r ? 'bg-white shadow-sm text-[#0B2D59]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {r === 'all' ? 'All' : r === 'buyer' ? 'Buyers' : 'Vendors'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">User</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Company</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Joined</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Projects</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map(user => {
              const s = STATUS_MAP[user.status];
              return (
                <tr key={user.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-4">
                    <div className="font-medium text-[#0B2D59]">{user.name}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${user.role === 'vendor' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                      {user.role === 'vendor' ? <Building2 className="h-3 w-3" /> : <User className="h-3 w-3" />}
                      {user.role === 'vendor' ? 'Vendor' : 'Buyer'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{user.company}</td>
                  <td className="px-5 py-4 text-gray-500">{user.joined}</td>
                  <td className="px-5 py-4 text-gray-600">{user.projects}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1.5">
                      <button className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" title="Send email">
                        <Mail className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => toggleSuspend(user.id)}
                        className={`p-1.5 rounded-lg ${user.status === 'suspended' ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                        title={user.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-gray-400 mt-3">{filtered.length} user{filtered.length !== 1 ? 's' : ''} shown</div>
    </div>
  );
};

export default AdminUsers;

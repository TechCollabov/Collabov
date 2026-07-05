import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, Building2, Ban, Mail, Lock, Unlock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AdminAccountRow {
  id: string;
  full_name: string;
  email: string;
  failed_login_attempts: number | null;
  locked_at: string | null;
}

/* No hardcoded users — data will be loaded from the database */
const USERS: {
  id: string; name: string; email: string; role: string; company: string;
  joined: string; status: string; projects: number;
}[] = [];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700' },
};

const AdminUsers: React.FC = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState(USERS);

  const [adminAccounts, setAdminAccounts] = useState<AdminAccountRow[]>([]);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState('');

  const loadAdminAccounts = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, failed_login_attempts, locked_at')
      .eq('user_type', 'admin')
      .order('full_name');
    setAdminAccounts(data || []);
  }, []);

  useEffect(() => {
    loadAdminAccounts();
  }, [loadAdminAccounts]);

  const handleUnlock = async (targetId: string) => {
    setUnlockError('');
    setUnlockingId(targetId);
    try {
      const { data, error } = await supabase.rpc('unlock_admin_account', { p_target_id: targetId });
      if (error) throw error;
      if (!data) {
        setUnlockError('Unlock failed — you cannot unlock your own account, and only another admin can perform this action.');
      } else {
        await loadAdminAccounts();
      }
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Unlock failed');
    } finally {
      setUnlockingId(null);
    }
  };

  const filtered = users.filter(u =>
    (roleFilter === 'all' || u.role === roleFilter) &&
    (search === '' || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleSuspend = (id: string) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, status: u.status === 'suspended' ? 'active' : 'suspended' } : u));
  };

  const lockedAdmins = adminAccounts.filter(a => a.locked_at);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">User Management</h1>

      {lockedAdmins.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-700 font-semibold text-sm mb-3">
            <Lock className="h-4 w-4" /> Locked admin accounts
          </div>
          {unlockError && <div className="text-xs text-red-600 mb-2">{unlockError}</div>}
          <div className="space-y-2">
            {lockedAdmins.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-white rounded-lg border border-red-100 px-4 py-2.5">
                <div>
                  <div className="text-sm font-medium text-[#0B2D59]">{a.full_name}</div>
                  <div className="text-xs text-gray-400">{a.email} · locked at {a.locked_at ? new Date(a.locked_at).toLocaleString() : ''}</div>
                </div>
                {a.id === profile?.id ? (
                  <span className="text-xs text-gray-400 italic">Your account — ask another admin to unlock</span>
                ) : (
                  <button
                    onClick={() => handleUnlock(a.id)}
                    disabled={unlockingId === a.id}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    {unlockingId === a.id ? 'Unlocking...' : 'Unlock'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

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

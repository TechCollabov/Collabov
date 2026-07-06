import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, Building2, Ban, Mail, Lock, Unlock, ShieldOff, Link2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { blacklistCustomer, approveCustomerRestoration, blacklistVendor, approveVendorRestoration } from '../../lib/workflows';

interface AdminAccountRow {
  id: string;
  full_name: string;
  email: string;
  failed_login_attempts: number | null;
  locked_at: string | null;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Blacklist / restore panel for verified vendors. Restoration requires two
 *  distinct admin approvals. Blacklisting a vendor with an open dispute
 *  doesn't touch escrow — that dispute resolves through its own flow. */
function VendorBlacklistPanel() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [blacklisted, setBlacklisted] = useState<any[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openDisputeWarning, setOpenDisputeWarning] = useState<Record<string, number>>({});
  const [adminId, setAdminId] = useState<string | null>(null);

  const loadBlacklisted = async () => {
    const { data } = await supabase.from('vendors').select('id, company_name, blacklist_reason, blacklisted_at, restoration_approvals').eq('is_blacklisted', true);
    setBlacklisted(data ?? []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
    loadBlacklisted();
  }, []);

  const runSearch = async (q: string) => {
    setSearch(q);
    if (q.trim().length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from('vendors')
      .select('id, company_name, is_blacklisted')
      .ilike('company_name', `%${q.trim()}%`)
      .eq('is_verified', true)
      .eq('is_blacklisted', false)
      .limit(8);
    setResults(data ?? []);
    const ids = (data ?? []).map((v: any) => v.id);
    if (ids.length) {
      const { data: disputes } = await supabase.from('disputes').select('vendor_id').in('vendor_id', ids).neq('status', 'resolved');
      const counts: Record<string, number> = {};
      (disputes ?? []).forEach((d: any) => { counts[d.vendor_id] = (counts[d.vendor_id] ?? 0) + 1; });
      setOpenDisputeWarning(counts);
    }
  };

  const doBlacklist = async (vendorId: string) => {
    if (!adminId || !reason[vendorId]?.trim()) return;
    setBusyId(vendorId);
    try {
      await blacklistVendor(vendorId, reason[vendorId].trim(), adminId);
      setResults(prev => prev.filter(v => v.id !== vendorId));
      await loadBlacklisted();
    } finally {
      setBusyId(null);
    }
  };

  const doApproveRestore = async (vendorId: string) => {
    if (!adminId) return;
    setBusyId(vendorId);
    try {
      await approveVendorRestoration(vendorId, adminId);
      await loadBlacklisted();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5 mb-4">
      <h3 className="text-sm font-bold text-[#0B2D59] mb-1 flex items-center gap-2"><Ban className="h-4 w-4 text-red-500" /> Vendor Blacklist</h3>
      <p className="text-xs text-gray-400 mb-3">Search verified vendors to blacklist. Restoration needs sign-off from two different admins.</p>

      <input
        value={search}
        onChange={e => runSearch(e.target.value)}
        placeholder="Search vendor by name…"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
      />
      {results.map(v => (
        <div key={v.id} className="border border-gray-100 rounded-lg p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">{v.company_name}</span>
            {openDisputeWarning[v.id] > 0 && (
              <span className="text-xs text-amber-600 font-medium">
                {openDisputeWarning[v.id]} open dispute{openDisputeWarning[v.id] > 1 ? 's' : ''} — resolves independently
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={reason[v.id] ?? ''}
              onChange={e => setReason(prev => ({ ...prev, [v.id]: e.target.value }))}
              placeholder="Reason for blacklisting"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
            />
            <button
              disabled={busyId === v.id || !reason[v.id]?.trim()}
              onClick={() => doBlacklist(v.id)}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              Blacklist
            </button>
          </div>
        </div>
      ))}

      {blacklisted.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Currently Blacklisted</h3>
          <div className="space-y-2">
            {blacklisted.map(v => {
              const approvals: string[] = Array.isArray(v.restoration_approvals) ? v.restoration_approvals : [];
              const alreadyApproved = adminId ? approvals.includes(adminId) : false;
              return (
                <div key={v.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><ShieldOff className="h-3.5 w-3.5 text-red-400" />{v.company_name}</div>
                    <div className="text-xs text-gray-400">{v.blacklist_reason} · {fmtDate(v.blacklisted_at)}</div>
                  </div>
                  <button
                    disabled={busyId === v.id || alreadyApproved}
                    onClick={() => doApproveRestore(v.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                    title={alreadyApproved ? 'You already approved — needs a second, different admin' : 'Approve restoration'}
                  >
                    {alreadyApproved ? `Approved (${approvals.length}/2)` : `Approve Restore (${approvals.length}/2)`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Buyer equivalent of the vendor blacklist panel above.
 *  Blacklisting a buyer with an open dispute is deferred — it takes effect
 *  automatically once every open dispute on that buyer resolves. */
function BuyerBlacklistPanel() {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [blacklisted, setBlacklisted] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openDisputeWarning, setOpenDisputeWarning] = useState<Record<string, number>>({});
  const [adminId, setAdminId] = useState<string | null>(null);

  const loadBlacklisted = async () => {
    const { data } = await supabase.from('customers').select('id, company_name, blacklist_reason, blacklisted_at, restoration_approvals, blacklist_pending').eq('is_blacklisted', true);
    setBlacklisted(data ?? []);
    const { data: pendingRows } = await supabase.from('customers').select('id, company_name, blacklist_reason').eq('blacklist_pending', true).eq('is_blacklisted', false);
    setPending(pendingRows ?? []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAdminId(data.user?.id ?? null));
    loadBlacklisted();
  }, []);

  const runSearch = async (q: string) => {
    setSearch(q);
    if (q.trim().length < 2) { setResults([]); return; }
    const { data } = await supabase
      .from('customers')
      .select('id, company_name, is_blacklisted')
      .ilike('company_name', `%${q.trim()}%`)
      .eq('is_blacklisted', false)
      .limit(8);
    setResults(data ?? []);
    const ids = (data ?? []).map((c: any) => c.id);
    if (ids.length) {
      const { data: disputes } = await supabase.from('disputes').select('buyer_id').in('buyer_id', ids).neq('status', 'resolved');
      const counts: Record<string, number> = {};
      (disputes ?? []).forEach((d: any) => { counts[d.buyer_id] = (counts[d.buyer_id] ?? 0) + 1; });
      setOpenDisputeWarning(counts);
    }
  };

  const doBlacklist = async (customerId: string) => {
    if (!adminId || !reason[customerId]?.trim()) return;
    setBusyId(customerId);
    try {
      await blacklistCustomer(customerId, reason[customerId].trim(), adminId);
      setResults(prev => prev.filter(c => c.id !== customerId));
      await loadBlacklisted();
    } finally {
      setBusyId(null);
    }
  };

  const doApproveRestore = async (customerId: string) => {
    if (!adminId) return;
    setBusyId(customerId);
    try {
      await approveCustomerRestoration(customerId, adminId);
      await loadBlacklisted();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-red-200 shadow-sm p-5 mb-6">
      <h3 className="text-sm font-bold text-[#0B2D59] mb-1 flex items-center gap-2"><Ban className="h-4 w-4 text-red-500" /> Buyer Blacklist</h3>
      <p className="text-xs text-gray-400 mb-3">Search active buyers to blacklist. If a dispute is open, the blacklist takes effect once it resolves. Restoration needs sign-off from two different admins.</p>

      <input
        value={search}
        onChange={e => runSearch(e.target.value)}
        placeholder="Search buyer by company name…"
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2"
      />
      {results.map(c => (
        <div key={c.id} className="border border-gray-100 rounded-lg p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-900">{c.company_name}</span>
            {openDisputeWarning[c.id] > 0 && (
              <span className="text-xs text-amber-600 font-medium">
                {openDisputeWarning[c.id]} open dispute{openDisputeWarning[c.id] > 1 ? 's' : ''} — blacklist will be deferred until resolved
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={reason[c.id] ?? ''}
              onChange={e => setReason(prev => ({ ...prev, [c.id]: e.target.value }))}
              placeholder="Reason for blacklisting"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
            />
            <button
              disabled={busyId === c.id || !reason[c.id]?.trim()}
              onClick={() => doBlacklist(c.id)}
              className="px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
            >
              Blacklist
            </button>
          </div>
        </div>
      ))}

      {pending.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Blacklist Pending (open dispute in progress)</h3>
          <div className="space-y-2">
            {pending.map(c => (
              <div key={c.id} className="flex items-center justify-between border border-amber-100 bg-amber-50 rounded-lg p-3">
                <div className="text-sm font-semibold text-gray-900">{c.company_name}</div>
                <div className="text-xs text-amber-700">{c.blacklist_reason}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {blacklisted.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Currently Blacklisted</h3>
          <div className="space-y-2">
            {blacklisted.map(c => {
              const approvals: string[] = Array.isArray(c.restoration_approvals) ? c.restoration_approvals : [];
              const alreadyApproved = adminId ? approvals.includes(adminId) : false;
              return (
                <div key={c.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5"><ShieldOff className="h-3.5 w-3.5 text-red-400" />{c.company_name}</div>
                    <div className="text-xs text-gray-400">{c.blacklist_reason} · {fmtDate(c.blacklisted_at)}</div>
                  </div>
                  <button
                    disabled={busyId === c.id || alreadyApproved}
                    onClick={() => doApproveRestore(c.id)}
                    className="px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                    title={alreadyApproved ? 'You already approved — needs a second, different admin' : 'Approve restoration'}
                  >
                    {alreadyApproved ? `Approved (${approvals.length}/2)` : `Approve Restore (${approvals.length}/2)`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: 'buyer' | 'vendor';
  company: string;
  joined: string;
  status: string;
  projects: number;
  linkedNote: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700' },
  pending_verification: { label: 'Pending Verification', color: 'bg-amber-100 text-amber-700' },
  blacklist_pending: { label: 'Blacklist Pending', color: 'bg-amber-100 text-amber-700' },
  blacklisted: { label: 'Blacklisted', color: 'bg-red-100 text-red-700' },
};

const AdminUsers: React.FC = () => {
  const { profile } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [adminAccounts, setAdminAccounts] = useState<AdminAccountRow[]>([]);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [unlockError, setUnlockError] = useState('');

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, user_type, created_at')
      .in('user_type', ['customer', 'vendor'])
      .order('created_at', { ascending: false });
    const rows = profiles || [];
    const ids = rows.map(p => p.id);

    const [{ data: vendors }, { data: customers }, { data: invitesReceived }, { data: invitesSent }] = await Promise.all([
      supabase.from('vendors').select('id, company_name, is_verified, is_blacklisted, blacklist_pending, active_contracts_count').in('id', ids),
      supabase.from('customers').select('id, company_name, is_blacklisted, blacklist_pending, active_projects_count').in('id', ids),
      supabase.from('partner_invites').select('linked_profile_id, inviter_id, company_name').eq('status', 'accepted').in('linked_profile_id', ids),
      supabase.from('partner_invites').select('inviter_id, company_name').eq('status', 'accepted').in('inviter_id', ids),
    ]);
    const vMap = new Map((vendors ?? []).map((v: any) => [v.id, v]));
    const cMap = new Map((customers ?? []).map((c: any) => [c.id, c]));
    const invitedByMap = new Map((invitesReceived ?? []).map((i: any) => [i.linked_profile_id, i]));
    const invitedCountMap = new Map<string, number>();
    (invitesSent ?? []).forEach((i: any) => invitedCountMap.set(i.inviter_id, (invitedCountMap.get(i.inviter_id) ?? 0) + 1));

    setUsers(rows.map((p: any) => {
      const isVendor = p.user_type === 'vendor';
      const v = vMap.get(p.id);
      const c = cMap.get(p.id);
      let status = 'active';
      if (isVendor) {
        if (v?.is_blacklisted) status = 'blacklisted';
        else if (v?.blacklist_pending) status = 'blacklist_pending';
        else if (!v?.is_verified) status = 'pending_verification';
      } else {
        if (c?.is_blacklisted) status = 'blacklisted';
        else if (c?.blacklist_pending) status = 'blacklist_pending';
      }
      const invitedBy = invitedByMap.get(p.id);
      const invitedCount = invitedCountMap.get(p.id) ?? 0;
      const linkedNote = invitedBy
        ? `Invited by ${invitedBy.company_name}`
        : invitedCount > 0
        ? `Invited ${invitedCount} linked account${invitedCount > 1 ? 's' : ''}`
        : null;
      return {
        id: p.id,
        name: p.full_name,
        email: p.email,
        role: isVendor ? 'vendor' : 'buyer',
        company: (isVendor ? v?.company_name : c?.company_name) ?? '—',
        joined: fmtDate(p.created_at),
        status,
        projects: (isVendor ? v?.active_contracts_count : c?.active_projects_count) ?? 0,
        linkedNote,
      };
    }));
    setUsersLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

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

      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Blacklist Review</h2>
        <VendorBlacklistPanel />
        <BuyerBlacklistPanel />
      </div>

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
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Active Projects</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Linked Account</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {usersLoading && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">Loading users…</td></tr>
            )}
            {!usersLoading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-gray-400">No users match this view.</td></tr>
            )}
            {filtered.map(user => {
              const s = STATUS_MAP[user.status] ?? STATUS_MAP.active;
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
                  <td className="px-5 py-4 text-gray-500 text-xs">
                    {user.linkedNote ? (
                      <span className="inline-flex items-center gap-1"><Link2 className="h-3 w-3 text-gray-400" />{user.linkedNote}</span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.color}`}>{s.label}</span>
                  </td>
                  <td className="px-5 py-4">
                    <a href={`mailto:${user.email}`} className="inline-flex p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100" title="Send email">
                      <Mail className="h-3.5 w-3.5" />
                    </a>
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

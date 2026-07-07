import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Star, ExternalLink, X, Loader2, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const STALE_AFTER_DAYS = 14;

const BUSINESS_TYPE_LABEL: Record<string, string> = { msp: 'MSP', agency: 'IT Agency', staffaug: 'Staff Aug' };

interface ShortlistRow {
  id: string;
  created_at: string;
  vendor_id: string;
  vendor: {
    id: string;
    company_name: string | null;
    business_type: string | null;
    tagline: string | null;
    rating: number | null;
    review_count: number | null;
    is_verified: boolean | null;
    monthly_rate_min: number | null;
    monthly_rate_max: number | null;
  };
  engaged: boolean;
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

const ShortlistPage: React.FC = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<ShortlistRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: saved } = await supabase
      .from('saved_vendors')
      .select('id, created_at, vendor_id')
      .eq('buyer_id', user.id)
      .is('contractor_id', null)
      .order('created_at', { ascending: false });

    const savedRows = saved ?? [];
    const vendorIds = savedRows.map(r => r.vendor_id).filter(Boolean);

    if (vendorIds.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const [{ data: vendors }, { data: engagements }] = await Promise.all([
      supabase.from('vendors').select('id, company_name, business_type, tagline, rating, review_count, is_verified, monthly_rate_min, monthly_rate_max').in('id', vendorIds),
      supabase.from('engagements').select('vendor_id').eq('buyer_id', user.id).in('vendor_id', vendorIds),
    ]);

    const vendorMap = new Map((vendors ?? []).map(v => [v.id, v]));
    const engagedVendorIds = new Set((engagements ?? []).map(e => e.vendor_id));

    const built: ShortlistRow[] = savedRows
      .filter(r => vendorMap.has(r.vendor_id))
      .map(r => ({
        id: r.id,
        created_at: r.created_at,
        vendor_id: r.vendor_id,
        vendor: vendorMap.get(r.vendor_id)!,
        engaged: engagedVendorIds.has(r.vendor_id),
      }));

    setRows(built);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const removeFromShortlist = async (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
    await supabase.from('saved_vendors').delete().eq('id', id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Shortlisted Vendors</h1>
          <p className="text-sm text-gray-500 mt-1">Vendors you've saved from search results, ready to compare and request proposals from.</p>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Bookmark className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">Your shortlist is empty.</p>
            <p className="text-sm text-gray-400 mb-5">Save vendors from search results to compare them here.</p>
            <Link to="/results" className="inline-block bg-[#0070F3] text-white rounded-xl px-6 py-2.5 text-sm font-medium hover:bg-blue-600 transition-colors">
              Find Vendors
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {rows.map(row => {
              const stale = !row.engaged && daysAgo(row.created_at) >= STALE_AFTER_DAYS;
              return (
                <div key={row.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{row.vendor.company_name ?? 'Unknown Vendor'}</span>
                        {row.vendor.business_type && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#0B2D59]/10 text-[#0B2D59]">
                            {BUSINESS_TYPE_LABEL[row.vendor.business_type] ?? row.vendor.business_type}
                          </span>
                        )}
                        {row.vendor.is_verified && (
                          <span className="text-xs text-green-600 font-medium">Verified</span>
                        )}
                      </div>
                      {row.vendor.tagline && <p className="text-sm text-gray-500 mt-1">{row.vendor.tagline}</p>}
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                        {(row.vendor.rating ?? 0) > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                            {(row.vendor.rating ?? 0).toFixed(1)}
                            {(row.vendor.review_count ?? 0) > 0 && <span className="text-xs text-gray-400">({row.vendor.review_count} reviews)</span>}
                          </span>
                        )}
                        {(row.vendor.monthly_rate_min || row.vendor.monthly_rate_max) && (
                          <span className="text-xs text-gray-500">
                            £{(row.vendor.monthly_rate_min ?? 0).toLocaleString()}–£{(row.vendor.monthly_rate_max ?? 0).toLocaleString()}/mo
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromShortlist(row.id)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                      aria-label="Remove from shortlist"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {stale && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2 text-sm text-amber-700">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      Shortlisted {daysAgo(row.created_at)} days ago — still deciding? Request a proposal or remove them.
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                    <Link
                      to={`/vendor/profile/${row.vendor_id}`}
                      className="bg-[#0070F3] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
                    >
                      Request Proposal
                    </Link>
                    <Link
                      to={`/vendor/profile/${row.vendor_id}`}
                      className="text-sm text-[#0070F3] hover:underline flex items-center gap-1 ml-1"
                    >
                      View Profile
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortlistPage;

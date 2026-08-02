import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import BuyerLayout from '../../components/buyer/BuyerLayout';

interface CalendarEvent {
  id: string;
  date: string; // ISO date string
  label: string;
  overdue: boolean;
  engagementId: string;
  vendorName: string;
}

const MONTH_FORMAT: Intl.DateTimeFormatOptions = { month: 'long', year: 'numeric' };

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString('en-GB', MONTH_FORMAT);
}

const BuyerCalendarPage: React.FC = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const { data: engagementsData } = await supabase
        .from('engagements')
        .select('id, project_title, vendor_id, status, start_date, service_live_date')
        .eq('buyer_id', user.id);
      const engagements = engagementsData ?? [];
      const engagementIds = engagements.map((e) => e.id);

      const vendorIds = Array.from(new Set(engagements.map((e) => e.vendor_id).filter(Boolean)));
      const vendorMap = new Map<string, string>();
      if (vendorIds.length) {
        const { data: vendors } = await supabase.from('vendors').select('id, company_name').in('id', vendorIds);
        (vendors ?? []).forEach((v) => vendorMap.set(v.id, v.company_name));
      }

      let milestones: {
        id: string;
        engagement_id: string;
        amount: number | null;
        escrow_status: string;
        due_date: string | null;
        released_at: string | null;
      }[] = [];
      if (engagementIds.length) {
        const { data } = await supabase
          .from('project_milestones')
          .select('id, engagement_id, amount, escrow_status, due_date, released_at')
          .in('engagement_id', engagementIds);
        milestones = data ?? [];
      }

      const now = new Date();
      const windowStart = new Date(now);
      windowStart.setDate(windowStart.getDate() - 30);
      const windowEnd = new Date(now);
      windowEnd.setMonth(windowEnd.getMonth() + 12);

      const isInWindow = (iso: string) => {
        const d = new Date(iso);
        return d >= windowStart && d <= windowEnd;
      };

      const newEvents: CalendarEvent[] = [];

      for (const eng of engagements) {
        const vendorName = vendorMap.get(eng.vendor_id) ?? 'Vendor';
        if (eng.start_date && isInWindow(eng.start_date)) {
          newEvents.push({
            id: `${eng.id}-start`,
            date: eng.start_date,
            label: `Engagement started — ${eng.project_title ?? 'Engagement'} — ${vendorName}`,
            overdue: false,
            engagementId: eng.id,
            vendorName,
          });
        }
        if (eng.service_live_date && isInWindow(eng.service_live_date)) {
          const overdue = new Date(eng.service_live_date) < now && eng.status !== 'active' && eng.status !== 'completed';
          newEvents.push({
            id: `${eng.id}-golive`,
            date: eng.service_live_date,
            label: `Go-live — ${eng.project_title ?? 'Engagement'} — ${vendorName}`,
            overdue,
            engagementId: eng.id,
            vendorName,
          });
        }
      }

      for (const m of milestones) {
        if (!m.due_date || !isInWindow(m.due_date)) continue;
        const eng = engagements.find((e) => e.id === m.engagement_id);
        const vendorName = eng ? vendorMap.get(eng.vendor_id) ?? 'Vendor' : 'Vendor';
        const overdue = new Date(m.due_date) < now && !['released', 'refunded'].includes(m.escrow_status);
        newEvents.push({
          id: `${m.id}-due`,
          date: m.due_date,
          label: `Milestone due — £${(m.amount ?? 0).toLocaleString()} — ${vendorName}`,
          overdue,
          engagementId: m.engagement_id,
          vendorName,
        });
      }

      newEvents.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));
      setEvents(newEvents);
      setLoading(false);
    })();
  }, [user]);

  const groups = new Map<string, { label: string; items: CalendarEvent[] }>();
  for (const ev of events) {
    const d = new Date(ev.date);
    const key = monthKey(d);
    if (!groups.has(key)) groups.set(key, { label: monthLabel(d), items: [] });
    groups.get(key)!.items.push(ev);
  }
  const sortedGroupKeys = Array.from(groups.keys()).sort();

  return (
    <BuyerLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black italic text-[#0B2D59]">Calendar</h1>
        <p className="text-xs font-semibold tracking-[0.25em] text-slate-400 mt-1 uppercase">
          Upcoming Engagement &amp; Milestone Dates
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-16 text-center">
          <p className="text-sm text-gray-400">Loading calendar…</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-16 text-center">
          <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No upcoming milestones or engagement dates yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroupKeys.map((key) => {
            const group = groups.get(key)!;
            return (
              <div key={key} className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="bg-[#0B2D59] rounded-xl w-11 h-11 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-blue-300" />
                  </div>
                  <span className="text-xs font-bold tracking-[0.15em] uppercase text-gray-900">{group.label}</span>
                </div>
                <div className="space-y-3">
                  {group.items.map((ev) => (
                    <Link
                      key={ev.id}
                      to={`/engagement/${ev.engagementId}`}
                      className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                        ev.overdue
                          ? 'bg-red-50 border-red-200 hover:bg-red-100'
                          : 'border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      {ev.overdue ? (
                        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${ev.overdue ? 'text-red-700' : 'text-gray-900'}`}>
                          {ev.label}
                        </p>
                        <p className={`text-xs mt-0.5 ${ev.overdue ? 'text-red-500' : 'text-gray-400'}`}>
                          {new Date(ev.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          {ev.overdue ? ' — OVERDUE' : ''}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BuyerLayout>
  );
};

export default BuyerCalendarPage;

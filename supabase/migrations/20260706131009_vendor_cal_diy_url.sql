-- Cal.diy replaces both the simulated "Connect Google Calendar" button and the
-- never-rendered Calendly URL field with one real embeddable scheduling link.
-- booking_method stays free-text ('cal_diy' | 'manual'); calendly_url is left
-- in place (unused going forward) rather than dropped, since altering/removing
-- a column with existing data is unnecessary risk for no benefit here.
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS cal_diy_url text;

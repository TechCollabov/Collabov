-- Buyer dashboard customization: persist the buyer's chosen widget layout for the
-- new Command Centre dashboard (drag-and-drop widgets from the nav dropdowns).
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS dashboard_layout jsonb DEFAULT '[]'::jsonb;

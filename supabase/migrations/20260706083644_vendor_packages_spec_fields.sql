/*
  # Extend vendor_packages to match the package spec

  ## Problem
  The vendor journey spec describes a package as: title, fixed price,
  duration, included items (min 3 bullets), deliverables, ideal for, and
  tech stack tags. The real vendor_packages table only had name/description/
  price/billing_period/features/is_active — no duration, tech tags, ideal-for,
  or category. VendorProfilePage.tsx's public Services & Packages tab already
  expected a delivery_days column (to show "X days delivery") that never
  existed either, so that line silently never rendered for any real package.

  ## Changes
  Adds delivery_days (duration), tech_stack (jsonb tags), ideal_for (text),
  and category (text, matches Search/Compare's vendor-facing category list)
  to vendor_packages.
*/

ALTER TABLE vendor_packages ADD COLUMN IF NOT EXISTS delivery_days integer;
ALTER TABLE vendor_packages ADD COLUMN IF NOT EXISTS tech_stack jsonb;
ALTER TABLE vendor_packages ADD COLUMN IF NOT EXISTS ideal_for text;
ALTER TABLE vendor_packages ADD COLUMN IF NOT EXISTS category text;

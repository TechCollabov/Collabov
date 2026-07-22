-- vendors.country previously defaulted to 'India' at the schema level, and
-- the handle_new_user signup trigger never set country on insert — so every
-- new vendor silently got 'India' regardless of actual location, until they
-- manually edited and saved Step 1 of their listing with their real country.
--
-- Dropping the default stops new rows from silently defaulting to India.
-- Existing rows keep whatever value they already have (unaffected).
ALTER TABLE vendors ALTER COLUMN country DROP DEFAULT;

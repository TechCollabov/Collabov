/*
  # Add US w9_form value to document_type

  ## Problem
  Step 8 "Tax & Compliance" needs a required-document checklist for US
  vendors (IRS Form W-9), but document_type has no US value — only
  India-market and UK values exist so far.

  ## Changes
  Adds the 'w9_form' enum value, following the same pattern as
  20260706080949_document_type_uk_values.sql (ALTER TYPE ... ADD VALUE
  must run as its own statement/migration outside a transaction with
  other DDL, per Postgres restrictions on enum alterations).
*/

ALTER TYPE document_type ADD VALUE IF NOT EXISTS 'w9_form';

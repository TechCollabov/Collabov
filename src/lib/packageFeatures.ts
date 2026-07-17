// Shared helpers for vendor_packages.features.
//
// `vendor_packages.features` is a jsonb column. Historically it stored a flat
// array of strings (one per bullet). Packages can now define structured rows
// instead: { label, value } where value is `true` (checkmark), `false`
// (dash), or a custom string (e.g. "1 FTE") rendered right-aligned.
//
// Both shapes can exist in the database at once — old rows were never
// migrated — so every read path normalizes through this helper instead of
// assuming a shape.

export type FeatureValue = true | false | string;

export interface FeatureRow {
  label: string;
  value: FeatureValue;
}

/**
 * Normalizes `vendor_packages.features` (jsonb, shape unknown at read time)
 * into a consistent row list:
 *  - array of plain strings (old data)         -> { label: string, value: true }
 *  - array of { label, value } objects (new)   -> passed through
 *  - anything else (null, object, garbage)     -> []
 */
export function normalizeFeatureRows(features: unknown): FeatureRow[] {
  if (!Array.isArray(features)) return [];
  const rows: FeatureRow[] = [];
  for (const entry of features) {
    if (typeof entry === 'string') {
      const label = entry.trim();
      if (label) rows.push({ label, value: true });
      continue;
    }
    if (entry && typeof entry === 'object' && typeof (entry as any).label === 'string') {
      const label = (entry as any).label.trim();
      if (!label) continue;
      const rawValue = (entry as any).value;
      const value: FeatureValue =
        typeof rawValue === 'boolean' || typeof rawValue === 'string' ? rawValue : true;
      rows.push({ label, value });
    }
  }
  return rows;
}

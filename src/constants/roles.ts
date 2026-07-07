export const ROLE_VENDOR = 'vendor' as const;
export const ROLE_BUYER = 'buyer' as const;
export const ROLE_CONTRACTOR = 'contractor' as const;
export const ROLE_ADMIN = 'admin' as const;

export const UI_VENDOR_LABEL = 'Service Provider';
export const UI_BUYER_LABEL = 'Buyer';
export const UI_CONTRACTOR_LABEL = 'Independent Contractor';

export const ROLE_TO_UI_LABEL: Record<string, string> = {
  [ROLE_VENDOR]: UI_VENDOR_LABEL,
  [ROLE_BUYER]: UI_BUYER_LABEL,
  [ROLE_CONTRACTOR]: UI_CONTRACTOR_LABEL,
  [ROLE_ADMIN]: 'Admin',
};

export const ROLE_TO_DASHBOARD: Record<string, string> = {
  [ROLE_VENDOR]: '/vendor/dashboard',
  [ROLE_BUYER]: '/buyer/dashboard',
  // No live signup path creates a 'contractor' account and the standalone
  // contractor dashboard was removed as dead legacy code — fall through home.
  [ROLE_CONTRACTOR]: '/',
  [ROLE_ADMIN]: '/admin',
};

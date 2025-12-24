export const ROLE_VENDOR = 'vendor' as const;
export const ROLE_CUSTOMER = 'customer' as const;
export const ROLE_CONTRACTOR = 'contractor' as const;
export const ROLE_ADMIN = 'admin' as const;

export const UI_VENDOR_LABEL = 'Service Provider';
export const UI_CUSTOMER_LABEL = 'Customer';
export const UI_CONTRACTOR_LABEL = 'Independent Contractor';

export const ROLE_TO_UI_LABEL: Record<string, string> = {
  [ROLE_VENDOR]: UI_VENDOR_LABEL,
  [ROLE_CUSTOMER]: UI_CUSTOMER_LABEL,
  [ROLE_CONTRACTOR]: UI_CONTRACTOR_LABEL,
  [ROLE_ADMIN]: 'Admin',
};

export const ROLE_TO_DASHBOARD: Record<string, string> = {
  [ROLE_VENDOR]: '/vendor/dashboard',
  [ROLE_CUSTOMER]: '/customer/dashboard',
  [ROLE_CONTRACTOR]: '/contractor/dashboard',
  [ROLE_ADMIN]: '/admin',
};

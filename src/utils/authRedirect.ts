import { Database } from '../types/database.types';

type UserType = Database['public']['Enums']['user_type'];

export const getRedirectPath = (userType: UserType | null): string => {
  if (!userType) return '/';

  switch (userType) {
    case 'vendor':
      return '/vendor/dashboard';
    case 'contractor':
      // No live signup path creates a 'contractor' account and the standalone
      // contractor dashboard was removed as dead legacy code — fall through home.
      return '/';
    case 'customer':
      return '/customer/dashboard';
    case 'admin':
      return '/admin';
    default:
      return '/';
  }
};

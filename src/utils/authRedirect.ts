import { Database } from '../types/database.types';

type UserType = Database['public']['Enums']['user_type'];

export const getRedirectPath = (userType: UserType | null): string => {
  if (!userType) return '/';

  switch (userType) {
    case 'vendor':
      return '/vendor/dashboard';
    case 'contractor':
      return '/contractor/dashboard';
    case 'customer':
      return '/dashboard';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
};

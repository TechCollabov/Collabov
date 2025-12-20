import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserType } from '../../types/database.types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedUserTypes?: UserType[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedUserTypes,
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (allowedUserTypes && profile && !allowedUserTypes.includes(profile.user_type)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function CustomerRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedUserTypes={['customer']}>
      {children}
    </ProtectedRoute>
  );
}

export function ContractorRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedUserTypes={['contractor']}>
      {children}
    </ProtectedRoute>
  );
}

export function VendorRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedUserTypes={['vendor']}>
      {children}
    </ProtectedRoute>
  );
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute allowedUserTypes={['admin']}>
      {children}
    </ProtectedRoute>
  );
}

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserType } from '../types/database.types';

export function useRequireAuth(allowedUserTypes?: UserType[]) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/signin', { state: { from: location }, replace: true });
      return;
    }

    if (allowedUserTypes && profile && !allowedUserTypes.includes(profile.user_type)) {
      navigate('/', { replace: true });
    }
  }, [user, profile, loading, navigate, location, allowedUserTypes]);

  return { user, profile, loading };
}

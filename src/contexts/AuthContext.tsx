import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserType = Database['public']['Enums']['user_type'];

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

interface SignUpData {
  fullName: string;
  userType: UserType;
  additionalData?: Record<string, unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    const { data: emailExists } = await supabase.rpc('check_email_exists', {
      email_to_check: email
    });

    if (emailExists) {
      throw new Error('This email is already registered. Please sign in or use a different email.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          user_type: userData.userType,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('User creation failed');

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: email,
      full_name: userData.fullName,
      user_type: userData.userType,
      profile_completed: false,
      onboarding_step: 0,
    });

    if (profileError) throw profileError;

    if (userData.userType === 'customer' && userData.additionalData?.companyName) {
      const { error: customerError } = await supabase.from('customers').insert({
        id: data.user.id,
        company_name: userData.additionalData.companyName as string,
      });
      if (customerError) throw customerError;
    }

    if (userData.userType === 'contractor') {
      const { error: contractorError } = await supabase.from('contractors').insert({
        id: data.user.id,
        title: userData.additionalData?.title as string || 'Freelancer',
      });
      if (contractorError) throw contractorError;
    }

    if (userData.userType === 'vendor' && userData.additionalData?.companyName) {
      const { error: vendorError } = await supabase.from('vendors').insert({
        id: data.user.id,
        company_name: userData.additionalData.companyName as string,
        contact_name: userData.fullName,
        contact_email: email,
        contact_phone: userData.additionalData.phone as string || '',
      });
      if (vendorError) throw vendorError;
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

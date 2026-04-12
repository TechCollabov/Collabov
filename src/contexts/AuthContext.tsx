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
    console.log('[AuthContext] Initializing auth state...');

    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session check:', { hasSession: !!session, userId: session?.user?.id });
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthContext] Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id });

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
    console.log('[AuthContext] Loading user profile for:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[AuthContext] Error loading profile:', error);
        throw error;
      }

      console.log('[AuthContext] Profile loaded successfully:', {
        userType: data?.user_type,
        email: data?.email,
        profileCompleted: data?.profile_completed
      });
      setProfile(data);
    } catch (error) {
      console.error('[AuthContext] Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: SignUpData) => {
    console.log('[AuthContext] signUp started for:', { email, userType: userData.userType });

    // Check if email already exists
    const { data: emailExists } = await supabase.rpc('check_email_exists', {
      email_to_check: email
    });

    if (emailExists) {
      console.log('[AuthContext] Email already exists:', email);
      throw new Error('This email is already registered. Please sign in or use a different email.');
    }

    // Sign up — pass all data in metadata so the SECURITY DEFINER trigger
    // creates profile + role records server-side, bypassing RLS entirely.
    // No client-side inserts needed.
    console.log('[AuthContext] Creating auth user...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          user_type: userData.userType,
          company_name: userData.additionalData?.companyName ?? '',
        },
      },
    });

    if (error) {
      console.error('[AuthContext] signUp auth error:', error);
      throw error;
    }

    if (!data.user) {
      console.error('[AuthContext] No user returned from signUp');
      throw new Error('User creation failed');
    }

    console.log('[AuthContext] Auth user created — trigger handles profile creation:', {
      userId: data.user.id,
      hasSession: !!data.session,
      emailConfirmed: data.user.email_confirmed_at,
    });

    console.log('[AuthContext] signUp completed successfully');
  };

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called for:', email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AuthContext] signIn error:', error);
      throw error;
    }

    if (!data.user) {
      console.error('[AuthContext] No user returned after sign in');
      throw new Error('Sign in failed - no user returned');
    }

    console.log('[AuthContext] signIn successful:', {
      userId: data.user.id,
      email: data.user.email,
      emailConfirmed: data.user.email_confirmed_at
    });

    // onAuthStateChange will fire automatically and load the profile
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

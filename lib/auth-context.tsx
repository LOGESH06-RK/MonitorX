import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, FarmerProfile } from './supabase';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'farmer' | 'admin';

export type AuthUser = {
  id: string; // Genuine Supabase Auth UUID (auth.uid())
  phone?: string;
  role: UserRole;
  email?: string;
  identifier?: string;
  name?: string;
  gender?: string;
};

export type LoginResult = {
  success: boolean;
  error?: string;
};

export type SignUpPayload = {
  // Personal
  fullName: string;
  age?: number;
  gender?: string;
  maritalStatus?: string;
  phone: string;
  email: string;
  address?: string;
  district?: string;
  state?: string;

  // Financial
  annualIncome: number;
  monthlyIncome: number;
  employmentStatus: string;
  existingLoans?: number;
  existingMonthlyEmi?: number;
  monthlyExpenses?: number;
  creditScore?: number;
  creditScoreUnknown?: boolean;
  repaymentHistory?: string;
  loanAmountRequired?: number;
  loanPurpose?: string;

  // Agricultural
  farmerCategory?: string;
  landSizeAcres?: number;
  landOwnership?: string;
  crops?: string[];
  farmingType?: string;
  irrigationType?: string;
  hasKcc?: boolean;
  hasPmfby?: boolean;

  // Schemes
  receivingSchemes?: boolean;
  schemeNames?: string;
  previousSchemes?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  supabaseUser: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  loginWithPassword: (
    identifier: string,
    password: string,
    role: 'customer' | 'admin'
  ) => Promise<LoginResult>;
  signUpCustomer: (
    payload: SignUpPayload,
    password: string
  ) => Promise<{ success: boolean; error?: string; profile?: FarmerProfile }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  supabaseUser: null,
  session: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  loginWithPassword: async () => ({ success: false }),
  signUpCustomer: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  logout: async () => {},
});

/**
 * Resolves various customer/admin identifiers (email, phone, username, MON10001, admin ID)
 * into a valid Supabase Auth email string.
 */
export function resolveIdentifierToEmail(identifier: string, role: 'customer' | 'admin'): string {
  const trimmed = identifier.trim();

  // 1. Direct standard email
  if (trimmed.includes('@') && trimmed.includes('.')) {
    return trimmed.toLowerCase();
  }

  // 2. Format: user@XXXXX (e.g. user@12300, user@48291)
  if (/^user@[0-9a-zA-Z]+$/i.test(trimmed)) {
    return `${trimmed.toLowerCase()}@monitorx.app`;
  }

  // 3. Format: admin@XXXXX (e.g. admin@bank1)
  if (/^admin@[0-9a-zA-Z]+$/i.test(trimmed)) {
    return `${trimmed.toLowerCase()}@monitorx.app`;
  }

  // 4. Pure 10-digit Indian phone number (or +91 prefixed)
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length === 10) {
    return `farmer_${digitsOnly}@monitorx.app`;
  }
  if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
    return `farmer_${digitsOnly.slice(2)}@monitorx.app`;
  }

  // 5. Admin identifiers (e.g. "admin", "admin_bank", etc.)
  if (role === 'admin') {
    const cleanAdmin = trimmed.toLowerCase().replace(/[^a-z0-9._-]/g, '');
    return cleanAdmin.includes('@') && cleanAdmin.includes('.') ? cleanAdmin : `${cleanAdmin}@monitorx.app`;
  }

  // 6. Customer business identifier (e.g. user12300, MON10001, etc.)
  const cleanId = trimmed.toLowerCase().replace(/[^a-z0-9._-]/g, '');
  return `customer_${cleanId}@monitorx.app`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Supabase Auth User with application AuthUser
  const syncSupabaseUser = async (currentSession: Session | null) => {
    if (!currentSession || !currentSession.user) {
      setSession(null);
      setSupabaseUser(null);
      setUser(null);
      return;
    }

    const sUser = currentSession.user;
    setSession(currentSession);
    setSupabaseUser(sUser);

    let role: UserRole = 'farmer';
    if (sUser.app_metadata?.role === 'admin' || sUser.user_metadata?.role === 'admin') {
      role = 'admin';
    }

    const phone = sUser.user_metadata?.phone || (sUser.phone ? sUser.phone : '');
    const name = sUser.user_metadata?.full_name || sUser.user_metadata?.name || '';
    const identifier = sUser.user_metadata?.identifier || sUser.email;
    const gender = sUser.user_metadata?.gender || undefined;

    setUser({
      id: sUser.id,
      phone: phone || '',
      role,
      email: sUser.email,
      identifier,
      name,
      gender,
    });
  };

  // Restore authenticated session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session: existingSession },
          error: sessionError,
        } = await supabase.auth.getSession();
        if (sessionError) {
          // Invalid or expired refresh token — sign out cleanly
          console.warn('Stale session detected, signing out:', sessionError.message);
          await supabase.auth.signOut();
        } else {
          await syncSupabaseUser(existingSession);
        }
      } catch (err: any) {
        // Handle network errors or invalid refresh tokens gracefully
        const errMsg = err?.message || String(err);
        if (errMsg.includes('Refresh Token') || errMsg.includes('refresh_token') || errMsg.includes('Invalid')) {
          console.warn('Invalid refresh token, clearing session.');
          try { await supabase.auth.signOut(); } catch {}
        } else {
          console.error('Failed to initialize Supabase session:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (_event === 'TOKEN_REFRESHED' && !newSession) {
        // Refresh token was invalid/expired — sign out cleanly
        console.warn('Session refresh failed, signing out stale session.');
        await supabase.auth.signOut();
        return;
      }
      await syncSupabaseUser(newSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Authenticates user using Supabase Auth with password.
   */
  const loginWithPassword = async (
    rawIdentifier: string,
    passwordInput: string,
    requestedRole: 'customer' | 'admin'
  ): Promise<LoginResult> => {
    const identifier = rawIdentifier.trim();
    const password = passwordInput.trim();

    if (!identifier || !password) {
      return { success: false, error: 'Please enter your login credentials.' };
    }

    // ─── FORMAT VALIDATION ─────────────────────────────────────────────────
    const tokens = identifier.split(/[\s,+]+/).map((t) => t.trim()).filter(Boolean);
    const isEmailFmt = (t: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
    const isPhoneFmt = (t: string) => {
      const d = t.replace(/\D/g, '');
      return d.length === 10 || (d.length === 12 && d.startsWith('91'));
    };

    if (requestedRole === 'admin') {
      const isAdminIdFmt = (t: string) => /^admin@[0-9]{5}$/.test(t);
      const hasValidAdminId = tokens.some(isAdminIdFmt);
      const hasValidContact = tokens.some((t) => isEmailFmt(t) || isPhoneFmt(t));

      if (!hasValidAdminId && !hasValidContact) {
        return {
          success: false,
          error: 'Invalid Admin ID, email, or mobile. Use: admin@XXXXX (5 digits), email, or 10-digit mobile.',
        };
      }
    } else {
      const isUserIdFmt = (t: string) => /^user@[0-9]{5}$/.test(t);
      const hasValidUserId = tokens.some(isUserIdFmt);
      const hasValidContact = tokens.some((t) => isEmailFmt(t) || isPhoneFmt(t));

      if (!hasValidUserId && !hasValidContact) {
        return {
          success: false,
          error: 'Invalid User ID, email, or mobile. Use: user@XXXXX (5 digits), email, or 10-digit mobile.',
        };
      }
    }
    // ──────────────────────────────────────────────────────────────────────────

    // Demo password support: accept '12345' OR '123456' as demo credentials
    const effectivePassword = (password === '12345' || password === '123456') ? 'MX#DemoPass2026!' : password;
    const email = resolveIdentifierToEmail(identifier, requestedRole);

    try {
      // 1. Try signing in with effective password
      let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: effectivePassword,
      });

      // If sign in fails, and user entered exact password, try with raw password
      if (signInError && effectivePassword !== password) {
        const secondAttempt = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (!secondAttempt.error && secondAttempt.data.session) {
          signInData = secondAttempt.data;
          signInError = null;
        }
      }

      // If customer account doesn't exist in Supabase Auth, check if they exist in farmer_profiles by phone/email
      if (signInError && requestedRole === 'customer') {
        const cleanPhone10 = identifier.replace(/\D/g, '').slice(-10);
        const { data: existingProfile } = await supabase
          .from('farmer_profiles')
          .select('*')
          .or(`phone.eq.${identifier},phone.eq.+91${cleanPhone10},phone.eq.${cleanPhone10}`)
          .limit(1)
          .maybeSingle();

        if (existingProfile || password === '12345' || password === '123456') {
          const { data: custSignUp, error: custErr } = await supabase.auth.signUp({
            email,
            password: effectivePassword,
            options: {
              data: {
                role: 'farmer',
                identifier,
                phone: cleanPhone10 ? `+91${cleanPhone10}` : undefined,
                full_name: existingProfile?.full_name || 'Registered Customer',
              },
            },
          });

          if (!custErr && custSignUp.session) {
            signInData = { session: custSignUp.session, user: custSignUp.user } as typeof signInData;
            signInError = null;

            if (existingProfile && custSignUp.user) {
              await AsyncStorage.setItem(`@monitorx_profile_id_user_${custSignUp.user.id}`, existingProfile.id);
            }
          }
        }
      }

      // If admin account requested and demo credentials given, auto-provision
      if (
        signInError &&
        requestedRole === 'admin' &&
        (password === '12345' || password === '123456')
      ) {
        const { data: adminSignUp, error: adminErr } = await supabase.auth.signUp({
          email,
          password: effectivePassword,
          options: {
            data: {
              role: 'admin',
              identifier,
              full_name: 'Chief Bank Loan Officer',
            },
          },
        });
        if (!adminErr && adminSignUp.session) {
          signInData = { session: adminSignUp.session, user: adminSignUp.user } as typeof signInData;
          signInError = null;
        }
      }

      if (signInError || !signInData?.session || !signInData.user) {
        // Prototype mode fallback: grant login for valid prototype credentials without requiring real Supabase DB user creation
        const hasValidPassword = password === '123456' || password === '12345';
        const hasAdminId = tokens.some((t) => /^admin@[0-9]{5}$/.test(t));
        const hasUserId = tokens.some((t) => /^user@[0-9]{5}$/.test(t));
        const hasContact = tokens.some((t) => isEmailFmt(t) || isPhoneFmt(t));

        const isProtoAdmin = requestedRole === 'admin' && (hasAdminId || hasContact) && hasValidPassword;
        const isProtoCustomer = requestedRole === 'customer' && (hasUserId || hasContact) && hasValidPassword;

        if (isProtoCustomer || isProtoAdmin) {
          const protoRole: UserRole = isProtoAdmin ? 'admin' : 'farmer';
          const protoUser: AuthUser = {
            id: `proto_${isProtoAdmin ? 'admin' : 'user'}_${identifier.replace(/[^a-zA-Z0-9]/g, '')}`,
            role: protoRole,
            identifier,
            email: identifier.includes('@') && identifier.includes('.') ? identifier : `${identifier}@monitorx.app`,
            name: isProtoAdmin ? 'Bank Admin Officer' : 'Registered Customer',
          };
          setUser(protoUser);
          setSession({
            access_token: 'proto_token',
            refresh_token: 'proto_refresh',
            expires_in: 3600,
            token_type: 'bearer',
            user: {
              id: protoUser.id,
              app_metadata: { role: protoRole },
              user_metadata: { role: protoRole, identifier: identifier, full_name: protoUser.name },
              aud: 'authenticated',
              created_at: new Date().toISOString(),
            } as any,
          });
          return { success: true };
        }

        if (requestedRole === 'admin') {
          return { success: false, error: 'Invalid Admin ID or password.' };
        }
        return {
          success: false,
          error: 'Invalid User ID, email, phone number, or password.',
        };
      }

      const authenticatedUser = signInData.user;
      const userRole =
        authenticatedUser.app_metadata?.role === 'admin' ||
        authenticatedUser.user_metadata?.role === 'admin'
          ? 'admin'
          : 'farmer';

      // Strict Admin Authorization Check
      if (requestedRole === 'admin') {
        if (userRole !== 'admin') {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setSupabaseUser(null);
          return {
            success: false,
            error: 'You are not authorized to access the Bank Admin Portal.',
          };
        }
      }

      await syncSupabaseUser(signInData.session);
      return { success: true };
    } catch (err: any) {
      console.error('Login error:', err);
      return {
        success: false,
        error: 'Invalid User ID, email, phone number, or password.',
      };
    }
  };

  /**
   * Registers a new customer with their specific Profile details and saves permanently into Supabase.
   */
  const signUpCustomer = async (
    payload: SignUpPayload,
    passwordInput: string
  ): Promise<{ success: boolean; error?: string; profile?: FarmerProfile }> => {
    try {
      const email = payload.email.trim().toLowerCase();
      const phoneDigits = payload.phone.replace(/\D/g, '').slice(-10);
      const normalizedPhone = `+91${phoneDigits}`;
      const password = (passwordInput.trim() === '12345' || passwordInput.trim() === '123456') ? 'MX#DemoPass2026!' : passwordInput.trim();

      // Generate a customer business identifier in user@XXXXX format (e.g. user@12300 or 5-digit combo)
      const fiveDigitSuffix = phoneDigits.slice(-5) || Math.floor(10000 + Math.random() * 90000).toString();
      const generatedCustId = `user@${fiveDigitSuffix}`;

      // 1. Sign up user in Supabase Auth
      let { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'farmer',
            phone: normalizedPhone,
            full_name: payload.fullName,
            identifier: generatedCustId,
            gender: payload.gender || undefined,
          },
        },
      });

      // If user already registered in auth, sign in with that password
      if (authError && authError.message.includes('already registered')) {
        const signInRes = await supabase.auth.signInWithPassword({ email, password });
        if (!signInRes.error && signInRes.data.session) {
          authData = { session: signInRes.data.session, user: signInRes.data.user } as typeof authData;
          authError = null;
        }
      }

      if (authError || !authData?.user) {
        return {
          success: false,
          error: authError?.message || 'Unable to register account. Please check your details.',
        };
      }

      const uid = authData.user.id;

      // 2. Prepare profile row using exact valid database columns
      const profileRow: Record<string, any> = {
        full_name: payload.fullName,
        phone: normalizedPhone,
        age: payload.age || null,
        state: payload.state || 'Tamil Nadu',
        district: payload.district || null,
        farmer_category: payload.farmerCategory || 'small',
        farming_type: payload.farmingType || null,
        crop_type: payload.crops && payload.crops.length > 0 ? payload.crops.join(', ') : null,
        land_size_acres: payload.landSizeAcres || null,
        land_ownership: payload.landOwnership || null,
        irrigation_available: !!payload.irrigationType,
        irrigation_type: payload.irrigationType || null,
        annual_agricultural_income: payload.annualIncome || 0,
        other_income: payload.monthlyIncome && payload.annualIncome && (payload.monthlyIncome * 12 > payload.annualIncome)
          ? ((payload.monthlyIncome * 12) - payload.annualIncome)
          : 0,
        existing_loans: payload.existingLoans || 0,
        monthly_expenses: payload.monthlyExpenses || 0,
        credit_score: payload.creditScore || null,
        repayment_history: payload.repaymentHistory || null,
        has_kcc: !!payload.hasKcc,
        has_pmfby: !!payload.hasPmfby,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 3. Check if profile already exists by phone
      const { data: existingRow } = await supabase
        .from('farmer_profiles')
        .select('id')
        .or(`phone.eq.${normalizedPhone},phone.eq.+91${phoneDigits},phone.eq.${phoneDigits}`)
        .maybeSingle();

      let savedProfile: FarmerProfile;
      let profileDbId: string;
      if (existingRow?.id) {
        const { data: updateRes, error: updateErr } = await supabase
          .from('farmer_profiles')
          .update(profileRow)
          .eq('id', existingRow.id)
          .select()
          .maybeSingle();
        savedProfile = {
          ...(updateRes || profileRow),
          gender: payload.gender || null,
        };
        profileDbId = existingRow.id;
      } else {
        const { data: insertRes, error: insertErr } = await supabase
          .from('farmer_profiles')
          .insert(profileRow)
          .select()
          .maybeSingle();
        savedProfile = {
          ...(insertRes || profileRow),
          gender: payload.gender || null,
        };
        profileDbId = insertRes?.id || `prof_${Date.now()}`;
      }

      // Store in user-specific AsyncStorage keys immediately
      await AsyncStorage.setItem(`@monitorx_profile_id_user_${uid}`, profileDbId);
      await AsyncStorage.setItem(`@monitorx_profile_user_${uid}`, JSON.stringify(savedProfile));

      // Sync active session state
      if (authData.session) {
        await syncSupabaseUser(authData.session);
      }

      return {
        success: true,
        profile: savedProfile,
      };
    } catch (err: any) {
      console.error('Sign up error:', err);
      return { success: false, error: err?.message || 'Registration failed' };
    }
  };

  /**
   * Dispatches password reset email.
   */
  const resetPassword = async (emailInput: string): Promise<{ success: boolean; error?: string }> => {
    const email = emailInput.trim();
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        return { success: false, error: error.message || 'Failed to send reset email.' };
      }
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Unable to send password reset email at this time.',
      };
    }
  };

  /**
   * Securely logs out and clears all session tokens and caches.
   */
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    } finally {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const monitorXKeys = keys.filter((k) => k.startsWith('@monitorx'));
        if (monitorXKeys.length > 0) {
          await Promise.all(monitorXKeys.map((k) => AsyncStorage.removeItem(k)));
        }
      } catch {}
      setUser(null);
      setSupabaseUser(null);
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        supabaseUser,
        session,
        isAuthenticated: !!session && !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        loginWithPassword,
        signUpCustomer,
        resetPassword,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type FarmerProfile = {
  id?: string;
  user_id?: string | null;
  full_name: string;
  phone?: string | null;
  age?: number | null;
  gender?: string | null;
  state: string;
  district?: string | null;
  farmer_category: string;
  farming_type?: string | null;
  crop_type?: string | null;
  crops?: string[] | null;
  farming_types?: string[] | null;
  land_size_acres?: number | null;
  land_ownership?: string | null;
  irrigation_available?: boolean | null;
  irrigation_type?: string | null;
  irrigation_sources?: string[] | null;
  annual_agricultural_income?: number | null;
  other_income?: number | null;
  existing_loans?: number | null;
  existing_monthly_emi?: number | null;
  monthly_expenses?: number | null;
  credit_score?: number | null;
  credit_score_unknown?: boolean | null;
  repayment_history?: string | null;
  livestock_type?: string | null;
  livestock_list?: string[] | null;
  equipment_needed?: string | null;
  equipment_list?: string[] | null;
  has_kcc?: boolean | null;
  kcc_status?: 'active' | 'inactive' | 'pending' | null;
  has_pmfby?: boolean | null;
  pmfby_status?: 'covered' | 'not_covered' | 'pending' | 'unknown' | null;
  created_at?: string;
  updated_at?: string;
};

export type EligibilityResult = {
  id?: string;
  farmer_id?: string;
  loan_type: string;
  requested_amount: number;
  eligibility_status: string;
  risk_level: string;
  eligibility_score: number;
  factors: EligibilityFactor[];
  recommendations: string[];
  created_at?: string;
};

export type EligibilityFactor = {
  factor: string;
  factorTamil: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  explanation: string;
  explanationTamil: string;
};

export type LoanApplication = {
  id?: string;
  farmer_id?: string;
  loan_type: string;
  bank_name: string;
  loan_amount: number;
  interest_rate?: number | null;
  tenure_months?: number | null;
  purpose?: string | null;
  status: string;
  // Admin workflow fields
  admin_status?: 'pending' | 'under_review' | 'approved' | 'rejected';
  admin_note?: string | null;
  rejection_reason?: string | null;
  decided_by?: string | null;
  decided_at?: string | null;
  updated_at?: string | null;
  created_at?: string;
  // Joined from farmer_profiles
  farmer_name?: string;
};

export type SchemeApplication = {
  id?: string;
  farmer_id?: string;
  scheme_id: string;
  scheme_name: string;
  scheme_type: string;
  status: string;
  created_at?: string;
};

export type AppNotification = {
  id?: string;
  farmer_id?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  application_id?: string | null;
  link_type?: string | null;
  created_at?: string;
};

export type AdminActivityLog = {
  id?: string;
  admin_id: string;
  admin_name?: string;
  action_type: string;
  description: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at?: string;
};

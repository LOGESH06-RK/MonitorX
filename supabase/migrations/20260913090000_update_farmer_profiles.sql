-- Migration: Add user_id and detailed farming/credit fields to farmer_profiles
ALTER TABLE farmer_profiles
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS existing_monthly_emi numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS farming_types text[],
  ADD COLUMN IF NOT EXISTS crops text[],
  ADD COLUMN IF NOT EXISTS irrigation_sources text[],
  ADD COLUMN IF NOT EXISTS livestock_list text[],
  ADD COLUMN IF NOT EXISTS equipment_list text[],
  ADD COLUMN IF NOT EXISTS kcc_status text DEFAULT 'not_active',
  ADD COLUMN IF NOT EXISTS pmfby_status text DEFAULT 'not_covered',
  ADD COLUMN IF NOT EXISTS credit_score_unknown boolean DEFAULT false;

-- Create index on user_id for fast user profile lookup
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id ON farmer_profiles(user_id);

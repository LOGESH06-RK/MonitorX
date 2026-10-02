-- ==============================================================================
-- Migration: 20260913100000_security_rls_hardening.sql
-- Description: Strict ownership-based Row Level Security (RLS) policies for MonitorX.
-- Removes dangerous USING(true) / WITH CHECK(true) policies.
-- ==============================================================================

-- 1. Ensure user_id column exists on farmer_profiles with foreign reference
ALTER TABLE farmer_profiles
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_farmer_profiles_user_id ON farmer_profiles(user_id);

-- 2. Drop all previous permissive/anon policies
DROP POLICY IF EXISTS "anon_select_farmer_profiles" ON farmer_profiles;
DROP POLICY IF EXISTS "anon_insert_farmer_profiles" ON farmer_profiles;
DROP POLICY IF EXISTS "anon_update_farmer_profiles" ON farmer_profiles;
DROP POLICY IF EXISTS "anon_delete_farmer_profiles" ON farmer_profiles;

DROP POLICY IF EXISTS "anon_select_loan_applications" ON loan_applications;
DROP POLICY IF EXISTS "anon_insert_loan_applications" ON loan_applications;
DROP POLICY IF EXISTS "anon_update_loan_applications" ON loan_applications;
DROP POLICY IF EXISTS "anon_delete_loan_applications" ON loan_applications;

DROP POLICY IF EXISTS "anon_select_scheme_applications" ON scheme_applications;
DROP POLICY IF EXISTS "anon_insert_scheme_applications" ON scheme_applications;
DROP POLICY IF EXISTS "anon_update_scheme_applications" ON scheme_applications;
DROP POLICY IF EXISTS "anon_delete_scheme_applications" ON scheme_applications;

DROP POLICY IF EXISTS "anon_select_eligibility_results" ON eligibility_results;
DROP POLICY IF EXISTS "anon_insert_eligibility_results" ON eligibility_results;
DROP POLICY IF EXISTS "anon_delete_eligibility_results" ON eligibility_results;

DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;

-- 3. Enable RLS on all tables
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheme_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper condition: Is caller an authorized Admin?
-- Admin role is verified via JWT metadata set by Supabase auth admin or database trigger
CREATE OR REPLACE FUNCTION is_admin() RETURNS boolean AS $$
BEGIN
  RETURN (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin' OR
    coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- 4. FARMER_PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can read their own profile; Admins can read all profiles
CREATE POLICY "farmers_select_own_or_admin" ON farmer_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR is_admin()
  );

-- Farmers can create their own profile bound to their authenticated user_id
CREATE POLICY "farmers_insert_own" ON farmer_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() OR is_admin()
  );

-- Farmers can update only their own profile
CREATE POLICY "farmers_update_own" ON farmer_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- Only admins can delete profiles
CREATE POLICY "admin_delete_profiles" ON farmer_profiles
  FOR DELETE TO authenticated
  USING (is_admin());

-- ------------------------------------------------------------------------------
-- 5. LOAN_APPLICATIONS POLICIES
-- ------------------------------------------------------------------------------
-- Farmers can view their own loan applications; Admins can view all
CREATE POLICY "farmers_select_own_loans" ON loan_applications
  FOR SELECT TO authenticated
  USING (
    farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()) OR is_admin()
  );

-- Farmers can insert loan interest applications only for their own profile
CREATE POLICY "farmers_insert_own_loans" ON loan_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()) OR is_admin()
  );

-- Admins can update loan application status (e.g. reviewed, approved, rejected)
CREATE POLICY "admin_update_loans" ON loan_applications
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ------------------------------------------------------------------------------
-- 6. SCHEME_APPLICATIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "farmers_select_own_schemes" ON scheme_applications
  FOR SELECT TO authenticated
  USING (
    farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()) OR is_admin()
  );

CREATE POLICY "farmers_insert_own_schemes" ON scheme_applications
  FOR INSERT TO authenticated
  WITH CHECK (
    farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()) OR is_admin()
  );

CREATE POLICY "admin_update_schemes" ON scheme_applications
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ------------------------------------------------------------------------------
-- 7. ELIGIBILITY_RESULTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "farmers_select_own_eligibility" ON eligibility_results
  FOR SELECT TO authenticated
  USING (
    farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()) OR is_admin()
  );

CREATE POLICY "farmers_insert_own_eligibility" ON eligibility_results
  FOR INSERT TO authenticated
  WITH CHECK (
    farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()) OR is_admin()
  );

-- ------------------------------------------------------------------------------
-- 8. NOTIFICATIONS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "farmers_select_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (
    farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid()) OR is_admin()
  );

CREATE POLICY "farmers_update_own_notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (
    farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    farmer_id IN (SELECT id FROM farmer_profiles WHERE user_id = auth.uid())
  );

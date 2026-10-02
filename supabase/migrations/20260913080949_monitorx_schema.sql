/*
# MonitorX - Farmer Financial Assistance Database Schema

1. Purpose
   Stores farmer profiles, loan applications, scheme applications, eligibility results,
   and notifications for the MonitorX farmer assistance app. This is a single-tenant
   demo app (no auth) so all policies allow anon + authenticated access.

2. New Tables
   - farmer_profiles: stores the farmer's personal, agricultural, and financial information
   - loan_applications: tracks loan applications the farmer has submitted interest in
   - scheme_applications: tracks government scheme applications the farmer has applied for
   - eligibility_results: stores AI-based loan eligibility assessment results
   - notifications: stores notifications about schemes, deadlines, and announcements

3. Security
   - RLS enabled on all tables.
   - All policies use TO anon, authenticated with USING (true) / WITH CHECK (true)
     because this is a single-tenant demo app with no sign-in screen. The data is
     intentionally shared/public for demonstration purposes.

4. Indexes
   - Created indexes on frequently queried columns (farmer_id, created_at, status).
*/

-- Farmer profiles table
CREATE TABLE IF NOT EXISTS farmer_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text,
  age integer,
  state text NOT NULL DEFAULT 'Tamil Nadu',
  district text,
  farmer_category text NOT NULL DEFAULT 'small',
  farming_type text,
  crop_type text,
  land_size_acres numeric,
  land_ownership text,
  irrigation_available boolean DEFAULT false,
  irrigation_type text,
  annual_agricultural_income numeric DEFAULT 0,
  other_income numeric DEFAULT 0,
  existing_loans numeric DEFAULT 0,
  monthly_expenses numeric DEFAULT 0,
  credit_score integer,
  repayment_history text DEFAULT 'good',
  livestock_type text,
  equipment_needed text,
  has_kcc boolean DEFAULT false,
  has_pmfby boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_farmer_profiles" ON farmer_profiles;
CREATE POLICY "anon_select_farmer_profiles" ON farmer_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_farmer_profiles" ON farmer_profiles;
CREATE POLICY "anon_insert_farmer_profiles" ON farmer_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_farmer_profiles" ON farmer_profiles;
CREATE POLICY "anon_update_farmer_profiles" ON farmer_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_farmer_profiles" ON farmer_profiles;
CREATE POLICY "anon_delete_farmer_profiles" ON farmer_profiles FOR DELETE
  TO anon, authenticated USING (true);

-- Loan applications table
CREATE TABLE IF NOT EXISTS loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  loan_type text NOT NULL,
  bank_name text NOT NULL,
  loan_amount numeric NOT NULL,
  interest_rate numeric,
  tenure_months integer,
  status text NOT NULL DEFAULT 'interested',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_loan_applications" ON loan_applications;
CREATE POLICY "anon_select_loan_applications" ON loan_applications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_loan_applications" ON loan_applications;
CREATE POLICY "anon_insert_loan_applications" ON loan_applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_loan_applications" ON loan_applications;
CREATE POLICY "anon_update_loan_applications" ON loan_applications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_loan_applications" ON loan_applications;
CREATE POLICY "anon_delete_loan_applications" ON loan_applications FOR DELETE
  TO anon, authenticated USING (true);

-- Scheme applications table
CREATE TABLE IF NOT EXISTS scheme_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  scheme_id text NOT NULL,
  scheme_name text NOT NULL,
  scheme_type text NOT NULL DEFAULT 'central',
  status text NOT NULL DEFAULT 'interested',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scheme_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_scheme_applications" ON scheme_applications;
CREATE POLICY "anon_select_scheme_applications" ON scheme_applications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_scheme_applications" ON scheme_applications;
CREATE POLICY "anon_insert_scheme_applications" ON scheme_applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_scheme_applications" ON scheme_applications;
CREATE POLICY "anon_update_scheme_applications" ON scheme_applications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_scheme_applications" ON scheme_applications;
CREATE POLICY "anon_delete_scheme_applications" ON scheme_applications FOR DELETE
  TO anon, authenticated USING (true);

-- Eligibility results table
CREATE TABLE IF NOT EXISTS eligibility_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  loan_type text NOT NULL,
  requested_amount numeric NOT NULL,
  eligibility_status text NOT NULL,
  risk_level text NOT NULL,
  eligibility_score integer NOT NULL,
  factors jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE eligibility_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_eligibility_results" ON eligibility_results;
CREATE POLICY "anon_select_eligibility_results" ON eligibility_results FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_eligibility_results" ON eligibility_results;
CREATE POLICY "anon_insert_eligibility_results" ON eligibility_results FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_eligibility_results" ON eligibility_results;
CREATE POLICY "anon_delete_eligibility_results" ON eligibility_results FOR DELETE
  TO anon, authenticated USING (true);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_notifications" ON notifications;
CREATE POLICY "anon_select_notifications" ON notifications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_notifications" ON notifications;
CREATE POLICY "anon_insert_notifications" ON notifications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_notifications" ON notifications;
CREATE POLICY "anon_update_notifications" ON notifications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_notifications" ON notifications;
CREATE POLICY "anon_delete_notifications" ON notifications FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_farmer_profiles_created_at ON farmer_profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_loan_applications_farmer_id ON loan_applications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);
CREATE INDEX IF NOT EXISTS idx_scheme_applications_farmer_id ON scheme_applications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_results_farmer_id ON eligibility_results(farmer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_farmer_id ON notifications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
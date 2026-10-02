/*
# MonitorX - Admin Portal Schema Extension

1. Purpose
   Extends the existing schema to support:
   - Proper loan application workflow with admin approval/rejection
   - Admin activity log
   - Enhanced notifications with application_id linking

2. Changes
   - Add columns to loan_applications: purpose, status workflow, admin decision fields
   - Create admin_activity_log table
   - Update notifications to link to applications
*/

-- Add missing columns to loan_applications for full workflow support
ALTER TABLE loan_applications
  ADD COLUMN IF NOT EXISTS purpose text,
  ADD COLUMN IF NOT EXISTS admin_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS admin_note text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS decided_by text,
  ADD COLUMN IF NOT EXISTS decided_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update index on admin_status
CREATE INDEX IF NOT EXISTS idx_loan_applications_admin_status ON loan_applications(admin_status);

-- Admin Activity Log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id text NOT NULL,
  admin_name text,
  action_type text NOT NULL,
  description text NOT NULL,
  entity_type text,
  entity_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_admin_activity_log" ON admin_activity_log;
CREATE POLICY "anon_select_admin_activity_log" ON admin_activity_log FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_admin_activity_log" ON admin_activity_log;
CREATE POLICY "anon_insert_admin_activity_log" ON admin_activity_log FOR INSERT
  TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);

-- Add application_id to notifications for linking
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS application_id text,
  ADD COLUMN IF NOT EXISTS link_type text;

CREATE INDEX IF NOT EXISTS idx_notifications_application_id ON notifications(application_id);

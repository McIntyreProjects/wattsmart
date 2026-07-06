-- Migration 012: RLS role-check hardening
--
-- Problem: admin/role policies checked user-writable metadata.
--   * Migrations 001/002 checked auth.users.raw_user_meta_data->>'role',
--     which any signed-in user can set via supabase.auth.updateUser()
--     — i.e. any user could grant themselves admin at the database layer.
--   * Migration 003 checked auth.jwt() ->> 'role', which is the Postgres
--     role claim ('authenticated'/'anon'/'service_role') and never equals
--     'admin' — those two policies silently never matched.
--
-- Fix: every role check now uses server-controlled app_metadata, which
-- users cannot modify:
--   * JWT-based checks:      auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
--   * auth.users subqueries: raw_app_meta_data->>'role' (the DB column
--     backing app_metadata)
--
-- All other policy conditions are unchanged. Each statement is
-- drop-if-exists → create, so this is safe to run on a live database.
--
-- DEPLOY ASSUMPTION: the admin user must already have
-- app_metadata.role = 'admin' set (the app's admin pages have required
-- app_metadata for days, so this should already be in place). Verify
-- before running, otherwise admin DB access via these policies stops
-- working until it is set:
--   select id, email, raw_app_meta_data->>'role'
--   from auth.users where raw_app_meta_data->>'role' = 'admin';

-- ─────────────────────────────────────────────
-- 001_initial_schema.sql policies
-- ─────────────────────────────────────────────

-- customers
drop policy if exists "admin_all_customers" on customers;
create policy "admin_all_customers" on customers
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- enquiries
drop policy if exists "admin_all_enquiries" on enquiries;
create policy "admin_all_enquiries" on enquiries
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- installers
drop policy if exists "admin_all_installers" on installers;
create policy "admin_all_installers" on installers
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- certifications
drop policy if exists "admin_all_certs" on certifications;
create policy "admin_all_certs" on certifications
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- jobs
drop policy if exists "admin_all_jobs" on jobs;
create policy "admin_all_jobs" on jobs
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- quotes
drop policy if exists "admin_all_quotes" on quotes;
create policy "admin_all_quotes" on quotes
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- payments
drop policy if exists "admin_all_payments" on payments;
create policy "admin_all_payments" on payments
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- fee_invoices
drop policy if exists "admin_all_fee_invoices" on fee_invoices;
create policy "admin_all_fee_invoices" on fee_invoices
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- reviews
drop policy if exists "admin_all_reviews" on reviews;
create policy "admin_all_reviews" on reviews
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- settings
drop policy if exists "admin_all_settings" on settings;
create policy "admin_all_settings" on settings
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- Note: "installers_no_pii_enquiries" (001) also checked raw_user_meta_data
-- but was already dropped and replaced by "installers_assigned_enquiries"
-- in migration 004, which is keyed on job assignment, not role. No action.

-- ─────────────────────────────────────────────
-- 002_missing_tables.sql policies
-- ─────────────────────────────────────────────

-- documents
drop policy if exists "admin_all_documents" on documents;
create policy "admin_all_documents" on documents
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- installer_terms
drop policy if exists "admin_all_installer_terms" on installer_terms;
create policy "admin_all_installer_terms" on installer_terms
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- automation_rules
drop policy if exists "admin_all_automation_rules" on automation_rules;
create policy "admin_all_automation_rules" on automation_rules
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- team_invites
drop policy if exists "admin_all_team_invites" on team_invites;
create policy "admin_all_team_invites" on team_invites
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- 003_missing_columns_and_tables.sql policies
-- (previously checked the top-level JWT 'role' claim, which is the
--  Postgres role — these never matched 'admin' and were dead policies)
-- ─────────────────────────────────────────────

-- installer_users
drop policy if exists "installer_users_admin_all" on installer_users;
create policy "installer_users_admin_all" on installer_users
  for all using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

-- installer_invites
drop policy if exists "installer_invites_admin_all" on installer_invites;
create policy "installer_invites_admin_all" on installer_invites
  for all using (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin');

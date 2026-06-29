-- Migration 007: Performance indexes
-- Supabase creates indexes on primary keys automatically.
-- It does NOT create indexes on foreign key columns or status columns.
-- All indexes below are net-new.

-- ─────────────────────────────────────────────
-- ENQUIRIES
-- ─────────────────────────────────────────────
-- Filtered on nearly every admin query and RLS policy row evaluation
create index if not exists idx_enquiries_status
  on enquiries (status);

-- FK lookup — customers_own_enquiries RLS policy + API joins
create index if not exists idx_enquiries_customer_id
  on enquiries (customer_id);

-- ─────────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────────
-- FK lookup — used heavily in joins from enquiry → jobs
create index if not exists idx_jobs_enquiry_id
  on jobs (enquiry_id);

-- FK lookup — installer own-jobs RLS policy + API routes
create index if not exists idx_jobs_installer_id
  on jobs (installer_id);

-- Status filter — brief_sent/quote_submitted pipelines
create index if not exists idx_jobs_status
  on jobs (status);

-- ─────────────────────────────────────────────
-- QUOTES
-- ─────────────────────────────────────────────
-- FK lookup — select-quote, reject-other-quotes, customer quote display
create index if not exists idx_quotes_enquiry_id
  on quotes (enquiry_id);

-- FK lookup — quote-selected job status update
create index if not exists idx_quotes_job_id
  on quotes (job_id);

-- Status filter — submitted/selected/rejected queries
create index if not exists idx_quotes_status
  on quotes (status);

-- ─────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────
-- FK lookup — payment released/refunded → job/enquiry chain
create index if not exists idx_payments_job_id
  on payments (job_id);

-- Status filter — pending/held/released/refunded admin views
create index if not exists idx_payments_status
  on payments (status);

-- Webhook lookup — Stripe payment intent id used in webhook handlers
create index if not exists idx_payments_stripe_payment_intent_id
  on payments (stripe_payment_intent_id)
  where stripe_payment_intent_id is not null;

-- ─────────────────────────────────────────────
-- FEE INVOICES
-- ─────────────────────────────────────────────
-- FK lookup — installer fee invoice listing
create index if not exists idx_fee_invoices_installer_id
  on fee_invoices (installer_id);

-- Status filter — issued/overdue admin queue
create index if not exists idx_fee_invoices_status
  on fee_invoices (status);

-- ─────────────────────────────────────────────
-- CERTIFICATIONS
-- ─────────────────────────────────────────────
-- FK lookup — installer cert display and RLS policy
create index if not exists idx_certifications_installer_id
  on certifications (installer_id);

-- Range query — expiry warning dashboard (certs expiring in next N days)
create index if not exists idx_certifications_expires_at
  on certifications (expires_at)
  where expires_at is not null;

-- ─────────────────────────────────────────────
-- INSTALLER USERS (team members)
-- ─────────────────────────────────────────────
-- FK lookup — team member listing + RLS policy union subquery
create index if not exists idx_installer_users_installer_id
  on installer_users (installer_id);

-- FK lookup — user → installer resolution in RLS policies
create index if not exists idx_installer_users_user_id
  on installer_users (user_id);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
-- FK lookup — user notification feed
create index if not exists idx_notifications_user_id
  on notifications (user_id);

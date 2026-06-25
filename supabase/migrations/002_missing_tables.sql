-- Migration 002: Fill schema gaps per WattSmart Complete Brief v2

-- ─────────────────────────────────────────────
-- QUOTES — add missing columns
-- ─────────────────────────────────────────────
alter table quotes
  add column if not exists line_items jsonb default '[]',
  add column if not exists match_score integer default 75,
  add column if not exists warranty_years integer,
  add column if not exists est_annual_saving_pence integer,
  add column if not exists deposit_percentage numeric(5,2),
  add column if not exists battery_brand text,
  add column if not exists panel_brand text;

-- ─────────────────────────────────────────────
-- JOBS — add missing columns
-- ─────────────────────────────────────────────
alter table jobs
  add column if not exists proposed_date date,
  add column if not exists date_proposed_at timestamptz,
  add column if not exists date_accepted_at timestamptz,
  add column if not exists date_declined_at timestamptz;

-- ─────────────────────────────────────────────
-- PAYMENTS — add missing columns
-- ─────────────────────────────────────────────
alter table payments
  add column if not exists payment_method text default 'platform' check (payment_method in ('platform','direct'));

-- ─────────────────────────────────────────────
-- FEE INVOICES — add missing columns
-- ─────────────────────────────────────────────
alter table fee_invoices
  add column if not exists vat_amount_pence integer default 0,
  add column if not exists total_pence integer,
  add column if not exists reminder_30_sent_at timestamptz,
  add column if not exists reminder_45_sent_at timestamptz,
  add column if not exists suspended_at timestamptz,
  add column if not exists invoice_number text;

-- ─────────────────────────────────────────────
-- REVIEWS — add missing columns
-- ─────────────────────────────────────────────
alter table reviews
  add column if not exists confidence_score numeric(4,3) default 1.0,
  add column if not exists reviewer_name_anonymised text;

-- ─────────────────────────────────────────────
-- DOCUMENTS
-- ─────────────────────────────────────────────
create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  enquiry_id uuid references enquiries(id) on delete cascade,
  installer_id uuid references installers(id) on delete set null,
  type text not null check (type in (
    'quote','installer_terms','deposit_receipt','survey_report',
    'dno_approval','mcs_cert','electrical_cert','warranty',
    'final_invoice','other'
  )),
  filename text not null,
  storage_path text not null,
  uploaded_by text not null check (uploaded_by in ('installer','system','customer')),
  visible_to_customer boolean default true,
  created_at timestamptz default now()
);

alter table documents enable row level security;

create policy "documents_customer_own" on documents
  for select using (
    enquiry_id in (
      select id from enquiries where customer_id in (
        select id from customers where user_id = auth.uid()
      )
    )
    and visible_to_customer = true
  );

create policy "documents_installer_own" on documents
  for all using (
    installer_id in (select id from installers where user_id = auth.uid())
  );

create policy "admin_all_documents" on documents
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- INSTALLER TERMS
-- ─────────────────────────────────────────────
create table if not exists installer_terms (
  id uuid primary key default uuid_generate_v4(),
  installer_id uuid references installers(id) on delete cascade,
  original_storage_path text not null,
  anonymised_storage_path text,
  items_stripped jsonb default '[]',
  uncertain_phrases jsonb default '[]',
  status text not null default 'pending_review'
    check (status in ('pending_review','approved','rejected')),
  admin_reviewed_at timestamptz,
  version integer default 1,
  created_at timestamptz default now()
);

alter table installer_terms enable row level security;

create policy "installer_terms_own" on installer_terms
  for all using (
    installer_id in (select id from installers where user_id = auth.uid())
  );

create policy "admin_all_installer_terms" on installer_terms
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- AUTOMATION RULES
-- ─────────────────────────────────────────────
create table if not exists automation_rules (
  id uuid primary key default uuid_generate_v4(),
  rule_key text unique not null,
  value text not null,
  label text,
  description text,
  updated_at timestamptz default now()
);

alter table automation_rules enable row level security;

create policy "automation_rules_public_read" on automation_rules
  for select using (true);

create policy "admin_all_automation_rules" on automation_rules
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Seed default automation rules
insert into automation_rules (rule_key, value, label, description) values
  ('auto_approve_refund_under_pence', '50000', 'Auto-approve refunds under', 'Deposit refunds below this amount are auto-approved within 24h'),
  ('flag_insurance_expiry_days', '14', 'Flag insurance within days of expiry', 'Surface installer to admin queue before auto-pause'),
  ('quote_deadline_days', '5', 'Quote response deadline', 'Days installers have to respond to a brief'),
  ('quote_hold_days', '14', 'Quote hold period', 'Days quotes are held for customer to decide'),
  ('cert_expiry_banner_days', '30', 'Cert expiry warning banner', 'Days before expiry the installer sees a login banner'),
  ('cert_expiry_email_days', '7', 'Cert expiry email', 'Days before expiry we send one reminder email'),
  ('auto_approve_applications', 'true', 'Auto-approve applications', 'Approve installer when all checks pass automatically'),
  ('manual_review_new_companies', 'false', 'Manual review new companies', 'Flag installers trading under 12 months for review'),
  ('auto_anonymise_terms', 'true', 'Auto-anonymise installer terms', 'Strip company identifiers from T&Cs automatically'),
  ('anonymisation_confidence_threshold', '0.95', 'Anonymisation confidence threshold', 'Flag for review if below this confidence'),
  ('digest_frequency', 'weekly_monday', 'Owner digest frequency', 'How often to send the owner summary email'),
  ('balance_due_days_default', '7', 'Balance due default (days before install)', 'Default for new installers — they can override in profile')
on conflict (rule_key) do nothing;

-- ─────────────────────────────────────────────
-- TEAM INVITES (for admin team access)
-- ─────────────────────────────────────────────
create table if not exists team_invites (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role text not null default 'admin' check (role in ('admin','support')),
  invited_by uuid references auth.users(id),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  accepted_at timestamptz,
  expires_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now()
);

alter table team_invites enable row level security;

create policy "admin_all_team_invites" on team_invites
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

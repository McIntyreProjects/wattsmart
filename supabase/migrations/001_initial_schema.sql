-- WattSmart initial schema
-- Run in Supabase SQL editor (EU West / London project)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- CUSTOMERS
-- ─────────────────────────────────────────────
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text,
  preferred_contact text[] default '{}',
  created_at timestamptz default now()
);

alter table customers enable row level security;

create policy "customers_own" on customers
  for all using (auth.uid() = user_id);

create policy "admin_all_customers" on customers
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- ENQUIRIES
-- ─────────────────────────────────────────────
create sequence if not exists enquiry_seq start 1;

create table if not exists enquiries (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid references customers(id) on delete cascade,
  reference text unique not null default 'WS-' || lpad(nextval('enquiry_seq')::text, 4, '0'),
  products text[] not null,
  postcode text not null,
  property_type text not null,
  property_age text not null,
  ownership text not null,
  roof_type text,
  roof_orientation text,
  shading text,
  monthly_elec_kwh integer,
  monthly_bill integer,
  electricity_supplier text,
  goal text not null check (goal in ('cover','export')),
  notes text,
  recommended_panels integer,
  recommended_system_kwp numeric(6,2),
  recommended_battery_kwh integer,
  status text not null default 'quotes_requested' check (status in (
    'quotes_requested','quotes_received','client_deciding','installer_chosen',
    'deposit_paid','survey_booked','installation_confirmed','complete','cancelled'
  )),
  created_at timestamptz default now()
);

alter table enquiries enable row level security;

create policy "customers_own_enquiries" on enquiries
  for all using (
    customer_id in (select id from customers where user_id = auth.uid())
  );

create policy "installers_no_pii_enquiries" on enquiries
  for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'installer'
    )
  );

create policy "admin_all_enquiries" on enquiries
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- INSTALLERS
-- ─────────────────────────────────────────────
create table if not exists installers (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  company_name text not null,
  companies_house_number text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  years_trading integer,
  products text[] not null default '{}',
  coverage_postcodes text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','active','paused','rejected')),
  stripe_account_id text,
  bank_account_last4 text,
  bank_sort_code_last2 text,
  average_rating_google numeric(3,2),
  average_rating_trustpilot numeric(3,2),
  google_place_id text,
  trustpilot_url text,
  created_at timestamptz default now(),
  approved_at timestamptz
);

alter table installers enable row level security;

create policy "installers_own" on installers
  for all using (user_id = auth.uid());

create policy "admin_all_installers" on installers
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- CERTIFICATIONS
-- ─────────────────────────────────────────────
create table if not exists certifications (
  id uuid primary key default uuid_generate_v4(),
  installer_id uuid references installers(id) on delete cascade,
  type text not null check (type in ('mcs','recc','hies','niceic','napit','ozev','trustmark')),
  certification_number text not null,
  status text not null default 'pending' check (status in ('pending','verified','failed','expired')),
  verified_at timestamptz,
  expires_at timestamptz,
  last_checked_at timestamptz default now(),
  register_source text
);

alter table certifications enable row level security;

create policy "certs_installer_own" on certifications
  for all using (
    installer_id in (select id from installers where user_id = auth.uid())
  );

create policy "admin_all_certs" on certifications
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- JOBS
-- ─────────────────────────────────────────────
create table if not exists jobs (
  id uuid primary key default uuid_generate_v4(),
  enquiry_id uuid references enquiries(id) on delete cascade,
  installer_id uuid references installers(id) on delete cascade,
  status text not null default 'brief_sent' check (status in (
    'brief_sent','quote_submitted','quote_selected','revealed',
    'survey_booked','installation_confirmed','complete','withdrawn'
  )),
  brief_sent_at timestamptz default now(),
  quote_deadline_at timestamptz default (now() + interval '5 days'),
  created_at timestamptz default now()
);

alter table jobs enable row level security;

create policy "jobs_installer_own" on jobs
  for all using (
    installer_id in (select id from installers where user_id = auth.uid())
  );

create policy "jobs_customer_own" on jobs
  for select using (
    enquiry_id in (
      select id from enquiries where customer_id in (
        select id from customers where user_id = auth.uid()
      )
    )
  );

create policy "admin_all_jobs" on jobs
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- QUOTES
-- ─────────────────────────────────────────────
create table if not exists quotes (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references jobs(id) on delete cascade,
  enquiry_id uuid references enquiries(id) on delete cascade,
  installer_id uuid references installers(id) on delete cascade,
  panel_count integer,
  system_kwp numeric(6,2),
  battery_kwh numeric(6,2),
  panel_brand text,
  inverter_brand text,
  total_price integer not null,
  deposit_amount integer not null,
  estimated_install_timeframe text not null,
  additional_notes text,
  label text check (label in ('A','B','C')),
  status text not null default 'submitted' check (status in ('submitted','selected','rejected')),
  submitted_at timestamptz default now(),
  selected_at timestamptz
);

alter table quotes enable row level security;

create policy "quotes_installer_own" on quotes
  for all using (
    installer_id in (select id from installers where user_id = auth.uid())
  );

create policy "quotes_customer_see_blind" on quotes
  for select using (
    enquiry_id in (
      select id from enquiries where customer_id in (
        select id from customers where user_id = auth.uid()
      )
    )
  );

create policy "admin_all_quotes" on quotes
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  enquiry_id uuid references enquiries(id) on delete cascade,
  quote_id uuid references quotes(id) on delete cascade,
  installer_id uuid references installers(id) on delete cascade,
  type text not null check (type in ('deposit','final')),
  amount integer not null,
  wattsmart_fee integer not null,
  installer_amount integer not null,
  stripe_payment_intent_id text,
  stripe_transfer_id text,
  status text not null default 'pending' check (status in ('pending','held','released','refunded')),
  paid_at timestamptz,
  released_at timestamptz,
  created_at timestamptz default now()
);

alter table payments enable row level security;

create policy "payments_customer_own" on payments
  for select using (
    enquiry_id in (
      select id from enquiries where customer_id in (
        select id from customers where user_id = auth.uid()
      )
    )
  );

create policy "payments_installer_own" on payments
  for select using (
    installer_id in (select id from installers where user_id = auth.uid())
  );

create policy "admin_all_payments" on payments
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- FEE INVOICES
-- ─────────────────────────────────────────────
create table if not exists fee_invoices (
  id uuid primary key default uuid_generate_v4(),
  payment_id uuid references payments(id) on delete cascade,
  installer_id uuid references installers(id) on delete cascade,
  amount integer not null,
  status text not null default 'issued' check (status in ('issued','paid','overdue')),
  due_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz default now()
);

alter table fee_invoices enable row level security;

create policy "fee_invoices_installer_own" on fee_invoices
  for all using (
    installer_id in (select id from installers where user_id = auth.uid())
  );

create policy "admin_all_fee_invoices" on fee_invoices
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- REVIEWS
-- ─────────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default uuid_generate_v4(),
  installer_id uuid references installers(id) on delete cascade,
  source text not null check (source in ('google','trustpilot')),
  rating integer not null check (rating between 1 and 5),
  review_text text not null,
  review_text_anonymised text,
  reviewer_date date not null,
  product_mentioned text,
  fetched_at timestamptz default now(),
  flagged boolean default false
);

alter table reviews enable row level security;

create policy "reviews_public_read" on reviews
  for select using (true);

create policy "admin_all_reviews" on reviews
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  type text not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "notifications_own" on notifications
  for all using (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- SETTINGS (for updatable rates in admin)
-- ─────────────────────────────────────────────
create table if not exists settings (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

alter table settings enable row level security;

create policy "settings_public_read" on settings
  for select using (true);

create policy "admin_all_settings" on settings
  for all using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Seed default settings
insert into settings (key, value) values
  ('unit_rate', '0.245'),
  ('seg_rate', '0.25'),
  ('panel_w', '350'),
  ('panel_cost', '280'),
  ('battery_cost_kwh', '600'),
  ('wattsmart_fee_pct', '5'),
  ('quote_deadline_days', '5'),
  ('cert_expiry_warning_days', '30'),
  ('heat_pump_grant', '7500')
on conflict (key) do nothing;

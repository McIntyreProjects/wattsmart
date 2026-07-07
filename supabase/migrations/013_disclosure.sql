-- Migration 013: pre-payment disclosure (UK Consumer Contracts Regulations)
--
-- The CCR require the trader's identity, geographical address, terms and
-- cancellation-rights information to be given to the consumer BEFORE they
-- pay. Installers therefore carry a business address and a terms reference
-- (an https URL or an uploaded PDF in the private 'installer-terms' bucket),
-- and every payment is preceded by a recorded disclosure acknowledgement.

-- ─────────────────────────────────────────────
-- Installer disclosure fields
-- ─────────────────────────────────────────────
alter table installers add column if not exists business_address text;
alter table installers add column if not exists terms_url text;
alter table installers add column if not exists terms_storage_path text;

-- ─────────────────────────────────────────────
-- Disclosure acknowledgements
--
-- One row per selected quote, written ONLY by the service role from
-- /api/quotes/acknowledge, snapshotting exactly what the customer was
-- shown at the moment they ticked the box. The PaymentIntent is never
-- created without this row existing first.
-- ─────────────────────────────────────────────
create table if not exists disclosure_acknowledgements (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid unique not null references quotes(id) on delete cascade,
  enquiry_id uuid not null references enquiries(id) on delete cascade,
  installer_id uuid not null references installers(id),
  customer_user_id uuid not null,
  installer_name_shown text not null,
  installer_address_shown text not null,
  installer_terms_ref text not null,
  acknowledged_at timestamptz not null default now()
);

alter table disclosure_acknowledgements enable row level security;

-- Customers can read acknowledgements for their own enquiries
-- (enquiry → customer → user_id chain, mirroring migration 009)
create policy "customers_own_disclosure_acknowledgements" on disclosure_acknowledgements
  for select using (
    exists (
      select 1
      from enquiries e
      join customers c on c.id = e.customer_id
      where e.id = disclosure_acknowledgements.enquiry_id
        and c.user_id = auth.uid()
    )
  );

-- Admin read access via server-controlled app_metadata (migration 012 pattern)
create policy "admin_all_disclosure_acknowledgements" on disclosure_acknowledgements
  for select using (
    exists (
      select 1 from auth.users
      where auth.users.id = auth.uid()
        and auth.users.raw_app_meta_data->>'role' = 'admin'
    )
  );

-- NO installer policy: installers never read acknowledgements.
-- NO insert/update/delete policies: writes happen only via the service role
-- (which bypasses RLS) — on purpose.

create index if not exists idx_disclosure_acknowledgements_enquiry_id
  on disclosure_acknowledgements(enquiry_id);

-- ─────────────────────────────────────────────
-- Private storage bucket for uploaded installer terms PDFs. NO public
-- access and no storage RLS read policies: the service role generates
-- short-lived signed URLs via the API, and filenames are installer UUIDs
-- only.
-- ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('installer-terms', 'installer-terms', false)
on conflict do nothing;

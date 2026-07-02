-- Migration 009: PII-isolated enquiry addresses (roof-layout Phase 1a)
--
-- Full customer addresses live here, NOT on enquiries, so installer RLS
-- on enquiries can never expose them. Installers get only the postcode
-- district via the API layer. Admin/service-role access is implicit
-- (the service role bypasses RLS).

create table if not exists enquiry_addresses (
  id uuid primary key default uuid_generate_v4(),
  enquiry_id uuid unique not null references enquiries(id) on delete cascade,
  address_line1 text not null,
  address_line2 text,
  city text,
  postcode text not null,
  lat double precision,
  lng double precision,
  created_at timestamptz default now()
);

alter table enquiry_addresses enable row level security;

-- Customers can read the address for their own enquiries
-- (enquiry → customer → user_id chain, mirroring enquiries RLS in 001/004)
create policy "customers_own_enquiry_addresses" on enquiry_addresses
  for select using (
    exists (
      select 1
      from enquiries e
      join customers c on c.id = e.customer_id
      where e.id = enquiry_addresses.enquiry_id
        and c.user_id = auth.uid()
    )
  );

-- NO installer policy: installers must never be able to read addresses.

create index if not exists idx_enquiry_addresses_enquiry_id
  on enquiry_addresses(enquiry_id);

-- Migration 011: roof_designs (roof-layout Phase 1b)
--
-- Stores the generated roof/panel layout per enquiry. PRIVACY: this table
-- is installer-readable (via assigned jobs), so it must contain NO address
-- data and NO coordinates. roof_segments holds azimuth/pitch/area summaries
-- only. The layout image lives in the private 'roof-designs' bucket, named
-- by enquiry UUID only, served via short-lived signed URLs from the API.

create table if not exists roof_designs (
  id uuid primary key default uuid_generate_v4(),
  enquiry_id uuid unique not null references enquiries(id) on delete cascade,
  source text not null check (source in ('google_solar', 'opensolar_manual')),
  status text not null default 'pending'
    check (status in ('pending', 'ready', 'unavailable', 'failed')),
  panel_count int,
  system_kwp numeric(6,2),
  est_annual_kwh int,
  -- Array of { azimuth_degrees, pitch_degrees, area_m2, panels_count } —
  -- deliberately NO lat/lng, bounding boxes, or plane centers.
  roof_segments jsonb,
  image_path text,
  imagery_quality text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table roof_designs enable row level security;

-- Customers can read the design for their own enquiries
-- (enquiry -> customer -> user_id chain, mirroring 009)
create policy "customers_own_roof_designs" on roof_designs
  for select using (
    exists (
      select 1
      from enquiries e
      join customers c on c.id = e.customer_id
      where e.id = roof_designs.enquiry_id
        and c.user_id = auth.uid()
    )
  );

-- Installers can read a design only when they have a job on that enquiry
-- (mirrors "installers_assigned_enquiries" from migration 004). Safe because
-- the table contains no address or coordinate data.
create policy "installers_assigned_roof_designs" on roof_designs
  for select using (
    exists (
      select 1
      from jobs j
      join installers i on i.id = j.installer_id
      where j.enquiry_id = roof_designs.enquiry_id
        and i.user_id = auth.uid()
    )
  );

-- Writes happen only via the service role (bypasses RLS) — no insert/update
-- policies on purpose.

create index if not exists idx_roof_designs_enquiry_id
  on roof_designs(enquiry_id);

-- Private storage bucket for layout images. NO public access and no storage
-- RLS read policies: the service role generates signed URLs via the API, and
-- filenames are enquiry UUIDs only (no address components).
insert into storage.buckets (id, name, public)
values ('roof-designs', 'roof-designs', false)
on conflict do nothing;

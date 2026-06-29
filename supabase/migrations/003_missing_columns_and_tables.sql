-- Migration 003: Add missing columns to installers + create installer team tables

-- Add missing columns to installers table (safe to run multiple times with IF NOT EXISTS)
alter table installers
  add column if not exists trading_name text,
  add column if not exists base_lat double precision,
  add column if not exists base_lng double precision,
  add column if not exists base_postcode text;

-- Installer team members
create table if not exists installer_users (
  id uuid primary key default gen_random_uuid(),
  installer_id uuid not null references installers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('manager', 'member')),
  status text not null default 'active' check (status in ('active', 'removed')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (installer_id, user_id)
);

-- Installer invites (token-based, 7-day expiry)
create table if not exists installer_invites (
  id uuid primary key default gen_random_uuid(),
  installer_id uuid not null references installers(id) on delete cascade,
  email text not null,
  role text not null check (role in ('manager', 'member')),
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired')),
  invited_by uuid references auth.users(id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz default now()
);

-- RLS: installer_users
alter table installer_users enable row level security;

create policy "installer_users_own_installer" on installer_users
  for select using (
    installer_id in (
      select id from installers where user_id = auth.uid()
      union
      select installer_id from installer_users where user_id = auth.uid()
    )
  );

create policy "installer_users_admin_all" on installer_users
  for all using (auth.jwt() ->> 'role' = 'admin');

-- RLS: installer_invites (admin client bypasses via service role)
alter table installer_invites enable row level security;

create policy "installer_invites_admin_all" on installer_invites
  for all using (auth.jwt() ->> 'role' = 'admin');

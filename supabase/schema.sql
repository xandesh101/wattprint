-- Wattprint Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Users table (extends Clerk auth)
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique not null,
  email text not null,
  full_name text,
  phone text,
  role text not null check (role in ('agent', 'homeowner')),
  brokerage_name text,
  license_number text,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- Properties table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  address_full text not null,
  street text,
  city text,
  state text,
  zip text,
  lat numeric,
  lng numeric,
  nickname text,
  created_at timestamptz default now()
);

-- Reports table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'generating', 'complete', 'failed')),
  energy_score integer,
  energy_grade text check (energy_grade in ('A', 'B', 'C', 'D', 'F')),
  baseline_data jsonb,
  scenarios_run jsonb,
  report_content text,
  share_token text unique,
  share_enabled boolean default false,
  regeneration_used boolean default false,
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Indexes for common queries
create index if not exists properties_user_id_idx on public.properties(user_id);
create index if not exists reports_property_id_idx on public.reports(property_id);
create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists reports_share_token_idx on public.reports(share_token);

-- Row Level Security
alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.reports enable row level security;

-- Users: can only read/update their own row
create policy "users_own" on public.users
  for all using (clerk_user_id = current_setting('app.clerk_user_id', true));

-- Properties: users own their properties
create policy "properties_own" on public.properties
  for all using (
    user_id = (
      select id from public.users
      where clerk_user_id = current_setting('app.clerk_user_id', true)
    )
  );

-- Reports: users own their reports, shared reports are public read
create policy "reports_own" on public.reports
  for all using (
    user_id = (
      select id from public.users
      where clerk_user_id = current_setting('app.clerk_user_id', true)
    )
  );

create policy "reports_shared_read" on public.reports
  for select using (share_enabled = true and share_token is not null);

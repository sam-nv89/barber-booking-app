-- 1. Enable Row Level Security (RLS)
-- alter default privileges revoke execute on functions from public;

-- 2. Create Tables (If they don't exist, this script handles updates)

-- TABLE: master_profiles
create table if not exists public.master_profiles (
  id uuid default gen_random_uuid() primary key,
  tg_id bigint unique not null,
  name text,
  phone text,
  avatar_url text,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Enable RLS for master_profiles
alter table public.master_profiles enable row level security;

-- DEVELOPMENT POLICY: Allow ALL access to master_profiles
drop policy if exists "Enable all for master_profiles" on public.master_profiles;
create policy "Enable all for master_profiles" on public.master_profiles
  for all using (true) with check (true);

-- TABLE: services
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  master_id uuid references public.master_profiles(id) on delete cascade not null,
  title text not null,
  price numeric default 0,
  duration_min integer default 60,
  category text,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

-- DEVELOPMENT POLICY: Allow ALL access to services
drop policy if exists "Enable all for services" on public.services;
create policy "Enable all for services" on public.services
  for all using (true) with check (true);


-- TABLE: clients
create table if not exists public.clients (
  id uuid default gen_random_uuid() primary key,
  master_id uuid references public.master_profiles(id) on delete cascade not null,
  name text not null,
  phone text,
  notes text,
  total_visits integer default 0,
  discount_percent integer default 0,
  avatar_color text,
  created_at timestamptz default now()
);

alter table public.clients enable row level security;

-- DEVELOPMENT POLICY: Allow ALL access to clients
drop policy if exists "Enable all for clients" on public.clients;
create policy "Enable all for clients" on public.clients
  for all using (true) with check (true);


-- TABLE: appointments
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  master_id uuid references public.master_profiles(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete set null,
  date date not null,
  time_start time not null,
  status text default 'pending',
  service_ids jsonb,
  price_final numeric,
  comment text,
  client_phone text, -- Cached for easy access if client is deleted or pure text appointment
  created_at timestamptz default now()
);

alter table public.appointments enable row level security;

-- DEVELOPMENT POLICY: Allow ALL access to appointments
drop policy if exists "Enable all for appointments" on public.appointments;
create policy "Enable all for appointments" on public.appointments
  for all using (true) with check (true);

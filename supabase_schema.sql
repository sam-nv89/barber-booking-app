-- 1. Enable Row Level Security (RLS)
alter default privileges revoke execute on functions from public;

-- 2. Create Tables

-- TABLE: master_profiles
create table public.master_profiles (
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

-- Policy: Masters can see and edit only their own profile
create policy "Masters can view own profile" on public.master_profiles
  for select using (tg_id::text = auth.uid()::text); -- Using text comparison for simplicity with basic auth

create policy "Masters can update own profile" on public.master_profiles
  for update using (tg_id::text = auth.uid()::text);

create policy "Masters can insert own profile" on public.master_profiles
  for insert with check (true); -- Allow insert, valid logic handled in app or trigger

-- TABLE: services
create table public.services (
  id uuid default gen_random_uuid() primary key,
  master_id uuid references public.master_profiles(id) on delete cascade not null,
  title text not null,
  price numeric default 0,
  duration_min integer default 60,
  category text,
  created_at timestamptz default now()
);

alter table public.services enable row level security;

create policy "Masters can manage own services" on public.services
  for all using (
    master_id in (select id from public.master_profiles where tg_id::text = auth.uid()::text)
  );


-- TABLE: clients
create table public.clients (
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

create policy "Masters can manage own clients" on public.clients
  for all using (
    master_id in (select id from public.master_profiles where tg_id::text = auth.uid()::text)
  );


-- TABLE: appointments
create table public.appointments (
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

create policy "Masters can manage own appointments" on public.appointments
  for all using (
    master_id in (select id from public.master_profiles where tg_id::text = auth.uid()::text)
  );

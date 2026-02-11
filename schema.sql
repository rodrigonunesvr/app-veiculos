-- Enable RLS
alter table auth.users enable row level security;

-- 1. PROFILES (Extends auth.users)
create table public.profiles (
  id uuid categories references auth.users(id) on delete cascade not null primary key,
  full_name text not null,
  phone text not null,
  rg5 char(5) not null,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- 2. VEHICLES (Registry)
create table public.vehicles (
  plate text primary key,
  last_driver text,
  updated_at timestamptz default now()
);
alter table public.vehicles enable row level security;

-- 3. EVENTS (Entry/Exit)
create table public.vehicle_events (
  id uuid default gen_random_uuid() primary key,
  plate text not null references public.vehicles(plate),
  driver_name text not null,
  entry_at timestamptz not null default now(),
  exit_at timestamptz,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);
alter table public.vehicle_events enable row level security;

-- POLICIES

-- Profiles: 
-- Anyone can read (needed for login/ui display of names)
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
-- Users can insert their own profile
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
-- Users can update own profile
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Vehicles:
-- Staff/Admin can read/insert/update
create policy "Enable all access for authenticated users" on vehicles for all using (auth.role() = 'authenticated');

-- Events:
-- Staff/Admin can read
create policy "Authenticated users can select events" on vehicle_events for select using (auth.role() = 'authenticated');
-- Staff/Admin can insert (Entry)
create policy "Authenticated users can insert events" on vehicle_events for insert with check (auth.role() = 'authenticated');
-- Staff/Admin can update (Exit)
create policy "Authenticated users can update events" on vehicle_events for update using (auth.role() = 'authenticated');

-- Trigger to update last_driver on vehicle
create or replace function public.handle_new_event() 
returns trigger as $$
begin
  insert into public.vehicles (plate, last_driver)
  values (new.plate, new.driver_name)
  on conflict (plate) do update
  set last_driver = excluded.last_driver,
      updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

create trigger on_event_created
  after insert on public.vehicle_events
  for each row execute procedure public.handle_new_event();

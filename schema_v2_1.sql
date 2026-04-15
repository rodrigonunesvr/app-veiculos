-- v2.1 Migration: Event Logging & Audit

-- 1. Create Movements Table
create table if not exists public.vehicle_movements (
  id uuid default gen_random_uuid() primary key,
  vehicle_code text not null, -- Renamed from plate to support prefixes like "ABSL-123"
  driver_name text not null,
  destination text, -- New field
  type text not null check (type in ('ENTRY', 'EXIT')),
  created_at timestamptz default now(),
  created_by uuid references auth.users(id) default auth.uid()
);

-- 2. Migrate Data (Best Effort)
-- Migrate Entries
insert into public.vehicle_movements (vehicle_code, driver_name, type, created_at, created_by)
select plate, driver_name, 'ENTRY', entry_at, created_by
from public.vehicle_events;

-- Migrate Exits
insert into public.vehicle_movements (vehicle_code, driver_name, type, created_at, created_by)
select plate, driver_name, 'EXIT', exit_at, created_by
from public.vehicle_events
where exit_at is not null;

-- 3. Security (RLS)
alter table public.vehicle_movements enable row level security;

-- Staff/Admin can insert
create policy "Auth users can insert movements" on vehicle_movements 
for insert with check (auth.role() = 'authenticated');

-- Admin can select all
create policy "Admin can select all movements" on vehicle_movements 
for select using (
  auth.role() = 'authenticated' and (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
    or
    true -- Actually staffs also need to select to see "Active Vehicles" list? 
         -- Or we make a secure view. Use 'true' for MVP simplicity or check Logic below.
  )
);
-- Simplify: Authenticated can read (Staff needs to see history/active list)
create policy "Auth users can read movements" on vehicle_movements
for select using (auth.role() = 'authenticated');


-- 4. View for Active Vehicles (Performance helper)
-- Logic: Group by vehicle, get last event. If type='ENTRY', it is inside.
create or replace view active_vehicles as
select distinct on (vehicle_code) 
  id,
  vehicle_code,
  driver_name,
  destination,
  created_at as entry_time,
  type,
  created_by
from vehicle_movements
order by vehicle_code, created_at desc;

-- 5. Update Profiles (Ensure RLS allows reading other profiles for Audit name display)
-- Already handled in v1 (Public profiles are viewable by everyone)

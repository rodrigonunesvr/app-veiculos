-- v2.2 Migration: Audit & Public Access

-- 1. Add Audit Columns
alter table public.vehicle_movements 
add column if not exists staff_name text,
add column if not exists staff_rg5 char(5);

-- 2. Enable Public Access (Anon) - "Staff sem login"
-- Risk: Anyone with the URL can view active vehicles and insert data.
-- Limit: Anon cannot UPDATE or DELETE, only INSERT.

-- Allow Anon to SELECT active vehicles (for Home/Exit screen)
create policy "Anon can read movements" on vehicle_movements
for select using (true);

-- Allow Anon to INSERT movements (Entry/Exit)
create policy "Anon can insert movements" on vehicle_movements
for insert with check (true);

-- Allow Anon to Read Vehicles (Autocomplete)
create policy "Anon can read vehicles" on vehicles
for select using (true);
create policy "Anon can insert/update vehicles" on vehicles
for insert with check (true); -- needed for upsert trigger/logic if any

-- Note: We rely on the App to enforce "staff_name" presence, but we can add DB constraint if we want strictness.
-- alter table vehicle_movements alter column staff_name set not null; 
-- (Skipping strict constraint update on existing rows to avoid migration issues, but app will enforce).

-- v3 Production Schema: Unified Movements, VTR Catalog, and Views

-- 1. VTR Catalog (Seed)
create table if not exists public.vtr_catalog (
  code text primary key
);

insert into public.vtr_catalog (code) values
('ABSL159'), ('ABT130'), ('AR496'), ('AR363'), ('AM-045'),
('ASE445'), ('BA050'), ('BA052'), ('BA053'), ('BA054'),
('BIR056'), ('RTE142'), ('VL-101(CMDT)'), ('ATT016'),
('V5232(DGS)'), ('APC033(DEF.CIVIL)')
on conflict (code) do nothing;

create policy "Auth users select vtr" on vtr_catalog for select using (auth.role() = 'authenticated');

-- 2. Movements Table (Unified)
create table if not exists public.movements (
  id uuid default gen_random_uuid() primary key,
  direction text not null check (direction in ('ENTRY', 'EXIT')),
  subject_type text not null check (subject_type in ('VEHICLE', 'VTR', 'PEDESTRIAN')),
  subject_code text not null, -- Placa, Prefixo VTR ou Nome(Pedestre) + Doc
  driver_name text, -- Apenas Vehicle
  destination text, -- Todos
  person_name text, -- Apenas Pedestrian (redundante se usar subject_code, mas pedido)
  person_doc text,  -- Apenas Pedestrian
  event_at timestamptz default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);

-- RLS
alter table public.movements enable row level security;
create policy "Auth users insert movements" on movements for insert with check (auth.role() = 'authenticated');
create policy "Auth users select movements" on movements for select using (auth.role() = 'authenticated');

-- 3. Views for Status (Inside/Outside)
-- Logic: Group by subject_code, get last event.
create or replace view latest_movements as
select distinct on (subject_code) *
from movements
order by subject_code, event_at desc;

create or replace view inside_subjects as
select * from latest_movements where direction = 'ENTRY';

create or replace view outside_subjects as
select * from latest_movements where direction = 'EXIT';


-- 4. Migration from v2.2 (Best Effort)
-- v2.2 had vehicle_movements (type=ENTRY/EXIT, vehicle_code, driver, destination, etc.)
-- We map everything to subject_type='VEHICLE' (Assuming only vehicles were tracked)
insert into public.movements (
  direction, subject_type, subject_code, driver_name, destination, event_at, created_by
)
select 
  type as direction,
  'VEHICLE' as subject_type,
  vehicle_code as subject_code,
  driver_name,
  destination,
  created_at as event_at,
  created_by
from public.vehicle_movements;
-- Note: 'staff_name/rg5' from v2.2 audit are lost in v3 movements structure unless we add metadata. 
-- But v3 requires "Logged User" (profiles) again, so we rely on created_by -> profiles join for new data.

-- 5. Ensure Profiles exist for Auth
-- (Already exists from v1/v2, enforcing role='staff' default via trigger is good practice but UI handles it)

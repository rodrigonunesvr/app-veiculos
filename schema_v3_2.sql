-- v3.2 Hotfix: Reporting View & RG Fix

-- 1. Fix Profiles RG column length (was char(5), needs to support up to 12)
-- We use TEXT to be safe, or VARCHAR(15). 
-- 'alter column' might fail if dependent objects exist, so we use safe modification where possible.
do $$ 
begin
  -- Try to alter if it exists
  if exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'rg5') then
    alter table public.profiles alter column rg5 type text;
    -- Optional: Rename it to just 'rg' if preferred, but keeping rg5 to avoid breaking existing queries 
    -- or we can add a new column 'rg' and migrate. Let's stick to modifying the type of rg5.
  end if;
end $$;

-- 2. Movements Report View (The Fix for Admin Join)
-- This view joins movements with created_by profile to provide a flat structure for the Admin report.
drop view if exists public.movements_report;
create or replace view public.movements_report as
select
  m.id,
  m.direction,
  m.subject_type,
  m.subject_code,
  m.driver_name,
  m.destination,
  m.person_name,
  m.person_doc,
  m.event_at,
  m.created_at,
  p.full_name as staff_full_name,
  p.rg5 as staff_rg
from public.movements m
left join public.profiles p on p.id = m.created_by;

-- Grant permissions
grant select on public.movements_report to authenticated;

-- 3. Ensure VTR Catalog (Idempotent seed)
insert into public.vtr_catalog (code) values
('ABSL159'), ('ABT130'), ('AR496'), ('AR363'), ('AM-045'),
('ASE445'), ('BA050'), ('BA052'), ('BA053'), ('BA054'),
('BIR056'), ('RTE142'), ('VL-101(CMDT)'), ('ATT016'),
('V5232(DGS)'), ('APC033(DEF.CIVIL)')
on conflict (code) do nothing;

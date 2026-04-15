-- v3.2 Hotfix: Reporting View & RG Fix (CORRIGIDO)

-- 1. DROP VIEW FIRST (Critical to avoid "cannot alter type of a column used by a view" error)
drop view if exists public.movements_report;

-- 2. Fix Profiles RG column length (was char(5), needs to support up to 12)
-- Now safe to alter because the dependent view is gone.
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_name = 'profiles' and column_name = 'rg5') then
    alter table public.profiles alter column rg5 type text;
  end if;
end $$;

-- 3. Re-create Movements Report View
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

-- 4. Ensure VTR Catalog (Idempotent seed)
insert into public.vtr_catalog (code) values
('ABSL159'), ('ABT130'), ('AR496'), ('AR363'), ('AM-045'),
('ASE445'), ('BA050'), ('BA052'), ('BA053'), ('BA054'),
('BIR056'), ('RTE142'), ('VL-101(CMDT)'), ('ATT016'),
('V5232(DGS)'), ('APC033(DEF.CIVIL)')
on conflict (code) do nothing;

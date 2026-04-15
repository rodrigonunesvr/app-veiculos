-- 1. Add Admin column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. ENABLE RLS (Ensure it's on)
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vtr_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. DROP OLD POLICIES (Clean slate)
DROP POLICY IF EXISTS "Auth users insert movements" ON public.movements;
DROP POLICY IF EXISTS "Auth users select movements" ON public.movements;
DROP POLICY IF EXISTS "Auth users select vtr" ON public.vtr_catalog;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 4. NEW SECURE POLICIES

-- MOVEMENTS:
-- All staff can insert new entries/exits
CREATE POLICY "Staff can insert movements" ON public.movements
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- All staff can see the current status (all active entries)
CREATE POLICY "Staff can view active movements" ON public.movements
FOR SELECT USING (auth.role() = 'authenticated');

-- ONLY Admins can Update or Delete historical records
CREATE POLICY "Admins only update movements" ON public.movements
FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins only delete movements" ON public.movements
FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- VTR CATALOG:
-- All staff can view the catalog for selection
CREATE POLICY "Staff can view vtr catalog" ON public.vtr_catalog
FOR SELECT USING (auth.role() = 'authenticated');

-- ONLY Admins can modify the catalog
CREATE POLICY "Admins can modify catalog" ON public.vtr_catalog
FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- PROFILES:
-- Users can see all profiles (for listing names in logs), but only update THEIR OWN
-- We restrict updates to prevent someone from making themselves Admin manually.
CREATE POLICY "Users view all profiles" ON public.profiles
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users update own record" ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (
  -- Prevent non-admins from changing their own is_admin flag
  (is_admin IS NOT DISTINCT FROM (SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
  OR 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE))
);

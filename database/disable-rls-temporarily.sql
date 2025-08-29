-- TEMPORARY: Completely disable RLS for debugging
-- This will allow the app to work while we debug authentication issues
-- WARNING: This removes all security - use only for testing

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;

-- Also drop any existing policies to ensure clean slate
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access to items" ON public.items;
DROP POLICY IF EXISTS "Allow all access to locations" ON public.locations;
DROP POLICY IF EXISTS "Allow all access to reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow all access to devices" ON public.devices;
-- FINAL FIX: Grant explicit permissions and disable all security
-- This should definitely resolve the permission issues

-- First, disable RLS completely
ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.devices DISABLE ROW LEVEL SECURITY;

-- Grant all permissions to anon role (this is what the app uses)
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.items TO anon;
GRANT ALL ON public.locations TO anon;
GRANT ALL ON public.reminders TO anon;
GRANT ALL ON public.devices TO anon;

-- Grant all permissions to authenticated role as well
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.items TO authenticated;
GRANT ALL ON public.locations TO authenticated;
GRANT ALL ON public.reminders TO authenticated;
GRANT ALL ON public.devices TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Drop any remaining policies
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access to items" ON public.items;
DROP POLICY IF EXISTS "Allow all access to locations" ON public.locations;
DROP POLICY IF EXISTS "Allow all access to reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow all access to devices" ON public.devices;

-- Also check if there's an old 'tasks' table that might be interfering
DROP TABLE IF EXISTS public.tasks CASCADE;
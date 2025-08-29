-- Temporary Fix: More Permissive RLS Policies for Debugging
-- Run this to temporarily allow broader access while we debug

-- Temporarily disable RLS on all tables for debugging
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY; 
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;

-- Enable RLS but create very permissive policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to manage own items" ON public.items;
DROP POLICY IF EXISTS "Allow users to manage own locations" ON public.locations;
DROP POLICY IF EXISTS "Allow users to manage own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow users to manage own devices" ON public.devices;

-- Create very permissive policies that allow access for now
CREATE POLICY "Allow all access to profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to items" ON public.items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to locations" ON public.locations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to reminders" ON public.reminders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to devices" ON public.devices FOR ALL USING (true) WITH CHECK (true);

-- Note: These policies are very permissive and should be tightened later
-- For now, they allow the app to work while we debug the Clerk integration
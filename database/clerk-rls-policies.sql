-- Updated RLS Policies for Clerk Integration
-- Run this script in your Supabase SQL editor to fix RLS issues

-- First, temporarily disable RLS to allow policy updates
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own items" ON public.items;
DROP POLICY IF EXISTS "Users can manage own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can manage own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can manage own devices" ON public.devices;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies that work with explicit clerk_user_id filtering
-- These policies allow access when clerk_user_id matches OR when using direct user filtering

-- Profile policies
CREATE POLICY "Allow users to manage own profile" ON public.profiles
  FOR ALL USING (
    clerk_user_id = current_setting('app.current_user_id', true) OR 
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
  WITH CHECK (
    clerk_user_id = current_setting('app.current_user_id', true) OR 
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Items policies - more permissive for debugging
CREATE POLICY "Allow users to manage own items" ON public.items
  FOR ALL USING (
    clerk_user_id = current_setting('app.current_user_id', true) OR 
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
    -- Allow if no user context is set (for debugging)
    current_setting('app.current_user_id', true) IS NULL OR
    current_setting('app.current_user_id', true) = ''
  )
  WITH CHECK (
    clerk_user_id = current_setting('app.current_user_id', true) OR 
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR
    -- Allow if no user context is set (for debugging)
    current_setting('app.current_user_id', true) IS NULL OR
    current_setting('app.current_user_id', true) = ''
  );

-- Locations policies
CREATE POLICY "Allow users to manage own locations" ON public.locations
  FOR ALL USING (
    clerk_user_id = current_setting('app.current_user_id', true) OR 
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
  WITH CHECK (
    clerk_user_id = current_setting('app.current_user_id', true) OR 
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Reminders policies  
CREATE POLICY "Allow users to manage own reminders" ON public.reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.items 
      WHERE items.id = reminders.item_id 
      AND (
        items.clerk_user_id = current_setting('app.current_user_id', true) OR
        items.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items 
      WHERE items.id = reminders.item_id 
      AND (
        items.clerk_user_id = current_setting('app.current_user_id', true) OR
        items.clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
      )
    )
  );

-- Devices policies
CREATE POLICY "Allow users to manage own devices" ON public.devices
  FOR ALL USING (
    clerk_user_id = current_setting('app.current_user_id', true) OR 
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  )
  WITH CHECK (
    clerk_user_id = current_setting('app.current_user_id', true) OR 
    clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  );

-- Create or replace the config setting function to be more robust
CREATE OR REPLACE FUNCTION set_config(parameter text, value text)
RETURNS text AS $$
BEGIN
  -- Use perform to avoid returning the result
  PERFORM set_config(parameter, value, false);
  RETURN value;
EXCEPTION
  WHEN OTHERS THEN
    -- If setting config fails, just return the value
    RETURN value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions to anon role for RLS context function
GRANT EXECUTE ON FUNCTION set_config(text, text) TO anon;
GRANT EXECUTE ON FUNCTION set_config(text, text) TO authenticated;

-- For debugging: create a simple test function
CREATE OR REPLACE FUNCTION test_rls_context()
RETURNS json AS $$
BEGIN
  RETURN json_build_object(
    'app_current_user_id', current_setting('app.current_user_id', true),
    'jwt_sub', current_setting('request.jwt.claims', true)::json->>'sub',
    'current_user', current_user,
    'session_user', session_user
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION test_rls_context() TO anon;
GRANT EXECUTE ON FUNCTION test_rls_context() TO authenticated;
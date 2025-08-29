-- Create RLS helper function for Clerk integration
-- This function allows us to set the current user ID for RLS policies

CREATE OR REPLACE FUNCTION public.set_config(parameter text, value text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set the configuration parameter
  PERFORM set_config(parameter, value, false);
  RETURN value;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.set_config(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_config(text, text) TO anon;
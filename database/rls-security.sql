-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (clerk_user_id = current_setting('app.current_user_id', true))
  WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

-- Create policies for items table  
CREATE POLICY "Users can manage own items" ON public.items
  FOR ALL USING (clerk_user_id = current_setting('app.current_user_id', true))
  WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

-- Create policies for locations table
CREATE POLICY "Users can manage own locations" ON public.locations
  FOR ALL USING (clerk_user_id = current_setting('app.current_user_id', true))
  WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

-- Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS items_clerk_user_id_idx ON public.items(clerk_user_id);
CREATE INDEX IF NOT EXISTS items_start_at_idx ON public.items(start_at);
CREATE INDEX IF NOT EXISTS items_due_at_idx ON public.items(due_at);
CREATE INDEX IF NOT EXISTS locations_clerk_user_id_idx ON public.locations(clerk_user_id);
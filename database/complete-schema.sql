-- Complete Taskonix Database Schema
-- Run this script in your Supabase SQL editor to create the complete schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ BEGIN
  CREATE TYPE item_type AS ENUM ('task', 'event');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE item_status AS ENUM ('pending', 'in_progress', 'done', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trigger_type AS ENUM ('absolute', 'offset', 'location_enter', 'location_exit');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create items table (main tasks/events)
CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  type item_type NOT NULL DEFAULT 'task',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,
  due_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/New_York',
  location_name TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  radius_m INTEGER DEFAULT 150,
  recurrence_rrule TEXT,
  priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
  tags TEXT[] DEFAULT '{}',
  category TEXT,
  ai_suggestions JSONB DEFAULT '{}',
  status item_status NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- For migration tracking
  migrated_from_task_id UUID
);

-- Create locations table (saved places)
CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius_m INTEGER NOT NULL DEFAULT 150,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reminders table
CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  trigger_type trigger_type NOT NULL DEFAULT 'absolute',
  trigger_at TIMESTAMPTZ,
  offset_minutes INTEGER,
  lead_time_minutes INTEGER DEFAULT 15,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'local',
  fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create devices table (for push notifications)
CREATE TABLE IF NOT EXISTS public.devices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  device_token TEXT,
  notification_permission BOOLEAN DEFAULT false,
  location_permission BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clerk_user_id, platform)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own items" ON public.items;
DROP POLICY IF EXISTS "Users can manage own locations" ON public.locations;
DROP POLICY IF EXISTS "Users can manage own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can manage own devices" ON public.devices;

-- Create RLS policies
CREATE POLICY "Users can manage own profile" ON public.profiles
  FOR ALL USING (clerk_user_id = current_setting('app.current_user_id', true))
  WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can manage own items" ON public.items
  FOR ALL USING (clerk_user_id = current_setting('app.current_user_id', true))
  WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can manage own locations" ON public.locations
  FOR ALL USING (clerk_user_id = current_setting('app.current_user_id', true))
  WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

CREATE POLICY "Users can manage own reminders" ON public.reminders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.items 
      WHERE items.id = reminders.item_id 
      AND items.clerk_user_id = current_setting('app.current_user_id', true)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.items 
      WHERE items.id = reminders.item_id 
      AND items.clerk_user_id = current_setting('app.current_user_id', true)
    )
  );

CREATE POLICY "Users can manage own devices" ON public.devices
  FOR ALL USING (clerk_user_id = current_setting('app.current_user_id', true))
  WITH CHECK (clerk_user_id = current_setting('app.current_user_id', true));

-- Create performance indexes
CREATE INDEX IF NOT EXISTS items_clerk_user_id_idx ON public.items(clerk_user_id);
CREATE INDEX IF NOT EXISTS items_start_at_idx ON public.items(start_at);
CREATE INDEX IF NOT EXISTS items_due_at_idx ON public.items(due_at);
CREATE INDEX IF NOT EXISTS items_status_idx ON public.items(status);
CREATE INDEX IF NOT EXISTS items_type_idx ON public.items(type);
CREATE INDEX IF NOT EXISTS locations_clerk_user_id_idx ON public.locations(clerk_user_id);
CREATE INDEX IF NOT EXISTS reminders_trigger_at_idx ON public.reminders(trigger_at);
CREATE INDEX IF NOT EXISTS reminders_item_id_idx ON public.reminders(item_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_items_updated_at ON public.items;
CREATE TRIGGER update_items_updated_at 
  BEFORE UPDATE ON public.items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON public.devices;
CREATE TRIGGER update_devices_updated_at 
  BEFORE UPDATE ON public.devices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create RLS context function
CREATE OR REPLACE FUNCTION set_config(parameter text, value text)
RETURNS text AS $$
BEGIN
  PERFORM set_config(parameter, value, false);
  RETURN value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
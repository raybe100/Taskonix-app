-- Check if tables exist and create them if they don't
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types if they don't exist
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

-- Create items table if it doesn't exist
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table if it doesn't exist
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

-- Create other tables
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

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL DEFAULT 'absolute',
  trigger_at TIMESTAMPTZ,
  offset_minutes INTEGER,
  lead_time_minutes INTEGER DEFAULT 15,
  location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  channel TEXT DEFAULT 'local',
  fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- DISABLE RLS on all tables (for now)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access to items" ON public.items;
DROP POLICY IF EXISTS "Allow all access to locations" ON public.locations;
DROP POLICY IF EXISTS "Allow all access to reminders" ON public.reminders;
DROP POLICY IF EXISTS "Allow all access to devices" ON public.devices;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS items_clerk_user_id_idx ON public.items(clerk_user_id);
CREATE INDEX IF NOT EXISTS items_created_at_idx ON public.items(created_at);
CREATE INDEX IF NOT EXISTS items_status_idx ON public.items(status);
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    timezone TEXT NOT NULL DEFAULT 'America/New_York',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE public.items (
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
    priority INTEGER CHECK (priority BETWEEN 1 AND 5) DEFAULT 3,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    ai_suggestions JSONB DEFAULT '{}',
    status item_status NOT NULL DEFAULT 'pending',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    radius_m INTEGER NOT NULL DEFAULT 150,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
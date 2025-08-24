-- Create the tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('Low', 'Medium', 'High')),
  start TIMESTAMPTZ,
  duration_min INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on created_at for faster queries
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- Create an index on start time for calendar queries
CREATE INDEX IF NOT EXISTS idx_tasks_start ON tasks(start);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON tasks 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data (optional, for testing)
INSERT INTO tasks (title, priority, start, duration_min) VALUES
  ('Sample Task 1', 'High', NOW() + INTERVAL '1 hour', 30),
  ('Sample Task 2', 'Medium', NOW() + INTERVAL '2 hours', 45),
  ('Sample Task 3', 'Low', NULL, 60)
ON CONFLICT (id) DO NOTHING;
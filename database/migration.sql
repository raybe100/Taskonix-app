-- Migration Script: Old Tasks Table to New Taskonix Schema
-- Run this AFTER creating the new schema to migrate existing data

-- Step 1: Migrate existing tasks to items table
-- This preserves existing data while upgrading to the new structure
INSERT INTO public.items (
  clerk_user_id,
  title,
  type,
  start_at,
  end_at,
  due_at,
  priority,
  category,
  notes,
  status,
  created_at,
  migrated_from_task_id
)
SELECT 
  'REPLACE_WITH_ACTUAL_CLERK_USER_ID' as clerk_user_id, -- You'll need to replace this
  title,
  CASE 
    WHEN start IS NOT NULL THEN 'event'::item_type
    ELSE 'task'::item_type
  END as type,
  
  -- Convert start time
  CASE 
    WHEN start IS NOT NULL THEN start::timestamptz
    ELSE NULL
  END as start_at,
  
  -- Calculate end time based on duration
  CASE 
    WHEN start IS NOT NULL AND duration_min IS NOT NULL 
    THEN (start::timestamptz + (duration_min || ' minutes')::interval)
    ELSE NULL
  END as end_at,
  
  -- Set due date for tasks without start time
  CASE 
    WHEN start IS NULL THEN created_at::timestamptz + interval '1 day'
    ELSE NULL
  END as due_at,
  
  -- Convert priority from text to number
  CASE 
    WHEN priority = 'High' THEN 5
    WHEN priority = 'Medium' THEN 3
    WHEN priority = 'Low' THEN 1
    ELSE 3
  END as priority,
  
  category,
  description as notes,
  'pending'::item_status as status,
  created_at::timestamptz,
  id::uuid as migrated_from_task_id

FROM public.tasks
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tasks');

-- Step 2: Create default reminders for migrated tasks
-- Add a 15-minute reminder for events with start times
INSERT INTO public.reminders (
  item_id,
  trigger_type,
  offset_minutes,
  lead_time_minutes,
  channel
)
SELECT 
  i.id,
  'offset'::trigger_type,
  15 as offset_minutes,
  15 as lead_time_minutes,
  'local' as channel
FROM public.items i
WHERE i.type = 'event' 
  AND i.start_at IS NOT NULL 
  AND i.migrated_from_task_id IS NOT NULL;

-- Step 3: Create default user profile if it doesn't exist
-- You'll need to replace the clerk_user_id with actual values
INSERT INTO public.profiles (clerk_user_id, full_name, timezone)
SELECT 
  'REPLACE_WITH_ACTUAL_CLERK_USER_ID',
  'Migrated User',
  'America/New_York'
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE clerk_user_id = 'REPLACE_WITH_ACTUAL_CLERK_USER_ID'
);

-- Step 4: Add some default locations that users commonly need
INSERT INTO public.locations (clerk_user_id, name, lat, lng, radius_m)
VALUES 
  ('REPLACE_WITH_ACTUAL_CLERK_USER_ID', 'Home', 0, 0, 150),  -- Users should update coordinates
  ('REPLACE_WITH_ACTUAL_CLERK_USER_ID', 'Work', 0, 0, 200),  -- Users should update coordinates
  ('REPLACE_WITH_ACTUAL_CLERK_USER_ID', 'Gym', 0, 0, 100)   -- Users should update coordinates
ON CONFLICT DO NOTHING;

-- Step 5: Register the current device
INSERT INTO public.devices (
  clerk_user_id,
  platform,
  notification_permission,
  location_permission
)
SELECT 
  'REPLACE_WITH_ACTUAL_CLERK_USER_ID',
  'web',
  false, -- Users will need to grant permissions
  false  -- Users will need to grant permissions
WHERE NOT EXISTS (
  SELECT 1 FROM public.devices 
  WHERE clerk_user_id = 'REPLACE_WITH_ACTUAL_CLERK_USER_ID' AND platform = 'web'
);

-- Step 6: Create some helpful summary views
CREATE OR REPLACE VIEW public.migration_summary AS
SELECT 
  'Total items migrated' as metric,
  count(*)::text as value
FROM public.items 
WHERE migrated_from_task_id IS NOT NULL
UNION ALL
SELECT 
  'Reminders created' as metric,
  count(*)::text as value
FROM public.reminders r
JOIN public.items i ON r.item_id = i.id
WHERE i.migrated_from_task_id IS NOT NULL
UNION ALL
SELECT 
  'Profiles created' as metric,
  count(*)::text as value
FROM public.profiles
UNION ALL
SELECT 
  'Default locations created' as metric,
  count(*)::text as value
FROM public.locations;

-- Clean up: After successful migration, you can drop the old tasks table
-- DROP TABLE IF EXISTS public.tasks CASCADE;

-- Instructions for manual steps:
-- 1. Replace 'REPLACE_WITH_ACTUAL_CLERK_USER_ID' with your actual Clerk user ID
-- 2. Update location coordinates in the locations table
-- 3. Test that the app works with the new schema
-- 4. Once confirmed, run the DROP TABLE command above to remove the old tasks table
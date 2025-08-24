import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'your-anon-key-here' &&
  supabaseUrl.includes('.supabase.co') &&
  supabaseAnonKey.startsWith('eyJ');

// Create client with fallback values to prevent errors
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Export configuration status
export const isConfigured = isSupabaseConfigured;

// Database types
export interface DatabaseTask {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  start?: string | null;
  duration_min?: number | null;
  created_at: string;
  updated_at?: string;
}

// Type for our app's task structure
export interface Task {
  id: string;
  title: string;
  priority: 'Low' | 'Medium' | 'High';
  start?: string;
  durationMin?: number;
  createdAt: string;
  updatedAt?: string;
}

// Convert database task to app task
export function dbTaskToAppTask(dbTask: DatabaseTask): Task {
  return {
    id: dbTask.id,
    title: dbTask.title,
    priority: dbTask.priority,
    start: dbTask.start || undefined,
    durationMin: dbTask.duration_min || undefined,
    createdAt: dbTask.created_at,
    updatedAt: dbTask.updated_at
  };
}

// Convert app task to database task
export function appTaskToDbTask(appTask: Partial<Task>): Partial<DatabaseTask> {
  return {
    id: appTask.id,
    title: appTask.title,
    priority: appTask.priority,
    start: appTask.start || null,
    duration_min: appTask.durationMin || null,
    created_at: appTask.createdAt!,
    updated_at: appTask.updatedAt
  };
}
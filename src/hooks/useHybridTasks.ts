import { useTasks } from './useTasks';
import { useSupabaseTasks } from './useSupabaseTasks';
import { isConfigured } from '../lib/supabase';

/**
 * Hybrid hook that tries Supabase first, falls back to localStorage
 * This allows development to continue even without Supabase setup
 */
export function useHybridTasks() {
  const supabaseHook = useSupabaseTasks();
  const localStorageHook = useTasks();
  
  // Use Supabase if configured AND no connection error, otherwise fall back to localStorage
  if (isConfigured && !supabaseHook.error) {
    return {
      ...supabaseHook,
      backend: 'supabase' as const
    };
  }
  
  return {
    ...localStorageHook,
    backend: 'localStorage' as const,
    error: null
  };
}
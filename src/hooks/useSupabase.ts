import { useAuth } from '@clerk/clerk-react';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export function useSupabase() {
  const { getToken } = useAuth();

  useEffect(() => {
    const setSupabaseAuth = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          // Set the auth token for Supabase
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: token,
          });
        }
      } catch (error) {
        console.warn('Failed to set Supabase auth token:', error);
      }
    };

    setSupabaseAuth();
  }, [getToken]);

  return { supabase };
}
/**
 * CITYFLOW AI - Frontend Supabase Client
 * Configured with safe public anonymous credentials for Supabase Auth and RLS.
 * 
 * SECURITY:
 * Never import or expose SUPABASE_SECRET_KEY in frontend code or bundles.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'CITYFLOW AI: Supabase URL or Publishable/Anon Key is missing in frontend environment. ' +
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured in frontend/.env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

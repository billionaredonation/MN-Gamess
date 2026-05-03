import { createClient } from '@supabase/supabase-js';

// src/supabaseClient.js  (стр. 3-11)
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Supabase env vars missing. ' +
    'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at build time.'
  );
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

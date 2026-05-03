import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://xqgopvdqcvqikvnbxxyc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iAAN9KsQ4Z-qAsoNtXEYAw_9Uh5VV8o
';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false
  }
});

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseProjectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split('.')[0] : null;
export const supabaseSqlEditorUrl = supabaseProjectRef
  ? `https://supabase.com/dashboard/project/${supabaseProjectRef}/sql/new`
  : 'https://supabase.com/dashboard/projects';

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'mff-data-hub-auth-token-v1',
      },
    })
  : null;

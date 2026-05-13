import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseBrowser: SupabaseClient | null =
  url && anon ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const matchVideoBucket =
  (import.meta.env.VITE_SUPABASE_MATCH_VIDEO_BUCKET as string | undefined) ?? 'match-video';

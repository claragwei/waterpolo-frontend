import { supabaseBrowser, matchVideoBucket } from '../lib/supabaseBrowser';

/**
 * Upload a quarter clip to Supabase Storage and return a public URL for MatchVideoSync.video_url.
 * Requires a public (or CDN) bucket policy, or replace with signed-URL flow for private buckets.
 */
export async function uploadMatchQuarterVideo(matchId: number, quarter: number, file: File): Promise<string> {
  if (!supabaseBrowser) throw new Error('Supabase is not configured');
  const ext = (file.name.split('.').pop() || 'mp4').replace(/[^a-zA-Z0-9]/g, '') || 'mp4';
  const path = `${matchId}/q${quarter}-${Date.now()}.${ext}`;
  const { error } = await supabaseBrowser.storage.from(matchVideoBucket).upload(path, file, {
    upsert: true,
    contentType: file.type || 'video/mp4',
  });
  if (error) throw new Error(error.message);
  const { data } = supabaseBrowser.storage.from(matchVideoBucket).getPublicUrl(path);
  if (!data?.publicUrl) throw new Error('No public URL returned');
  return data.publicUrl;
}

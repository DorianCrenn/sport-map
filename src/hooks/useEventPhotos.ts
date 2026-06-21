import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.js';

const BUCKET          = 'event-photos';
const MAX_PHOTOS      = 10;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES   = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface EventPhoto { id: string; url: string; caption?: string | null; user_id: string; created_at: string; }

export function useEventPhotos(eventId: string | null | undefined) {
  const { currentUser } = useAuth();
  const [photos,     setPhotos]     = useState<EventPhoto[]>([]);
  const [loading,    setLoading]    = useState(!!eventId);
  const [uploading,  setUploading]  = useState(false);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    let cancelled = false;
    supabase
      .from('event_photos')
      .select('id, url, caption, user_id, created_at')
      .eq('event_id', String(eventId))
      .order('created_at', { ascending: true })
      .limit(MAX_PHOTOS)
      .then(({ data }: { data: EventPhoto[] | null }) => {
        if (cancelled) return;
        setPhotos(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  const uploadPhoto = useCallback(async (file: File, clubId: string, caption = ''): Promise<EventPhoto | { error: string } | null> => {
    if (!currentUser || !eventId || !clubId) return null;
    if (photos.length >= MAX_PHOTOS) return null;
    if (!ALLOWED_TYPES.includes(file.type)) return { error: `Type non supporté. Utilisez JPG, PNG ou WebP.` };
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) return { error: `Fichier trop lourd (max ${MAX_FILE_SIZE_MB} Mo).` };

    setUploading(true);
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `${clubId}/${eventId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { data, error: dbErr } = await supabase
        .from('event_photos')
        .insert({ event_id: String(eventId), club_id: String(clubId), user_id: currentUser.id, url: publicUrl, caption: caption || null })
        .select('id, url, caption, user_id, created_at')
        .single() as { data: EventPhoto | null; error: { message: string } | null };
      if (dbErr) throw dbErr;

      setPhotos(prev => [...prev, data!]);
      return data;
    } catch (err) {
      console.error('[EventPhotos] upload failed:', (err as Error).message);
      return null;
    } finally { setUploading(false); }
  }, [currentUser, eventId, photos.length]);

  const deletePhoto = useCallback(async (photoId: string) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    const { error: dbErr } = await supabase.from('event_photos').delete().eq('id', photoId) as { error: { message: string } | null };
    if (dbErr) { setPhotos(prev => [...prev, photo].sort((a, b) => a.created_at.localeCompare(b.created_at))); return; }
    try {
      const url = new URL(photo.url);
      const bucketPrefix = `/storage/v1/object/public/${BUCKET}/`;
      const storagePath  = url.pathname.includes(bucketPrefix) ? decodeURIComponent(url.pathname.split(bucketPrefix)[1]) : null;
      if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath]);
    } catch { /* non-blocking */ }
  }, [photos]);

  return { photos, loading, uploading, uploadPhoto, deletePhoto, maxPhotos: MAX_PHOTOS };
}

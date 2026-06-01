import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const BUCKET = 'event-photos';
const MAX_PHOTOS = 10;
const MAX_FILE_SIZE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function useEventPhotos(eventId) {
  const { currentUser } = useAuth();
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(!!eventId);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!eventId) { setLoading(false); return; }
    let cancelled = false;
    supabase
      .from('event_photos')
      .select('id, url, caption, user_id, created_at')
      .eq('event_id', String(eventId))
      .order('created_at', { ascending: true })
      .limit(MAX_PHOTOS)
      .then(({ data }) => {
        if (cancelled) return;
        setPhotos(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [eventId]);

  const uploadPhoto = useCallback(async (file, clubId, caption = '') => {
    if (!currentUser || !eventId || !clubId) return null;
    if (photos.length >= MAX_PHOTOS) return null;

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error(`[EventPhotos] type non supporté: ${file.type}`);
      return { error: `Type non supporté. Utilisez JPG, PNG ou WebP.` };
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      console.error(`[EventPhotos] fichier trop lourd: ${(file.size / 1024 / 1024).toFixed(1)} Mo`);
      return { error: `Fichier trop lourd (max ${MAX_FILE_SIZE_MB} Mo).` };
    }

    setUploading(true);
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `${clubId}/${eventId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const { data, error: dbErr } = await supabase
        .from('event_photos')
        .insert({
          event_id:   String(eventId),
          club_id:    String(clubId),
          user_id:    currentUser.id,
          url:        publicUrl,
          caption:    caption || null,
        })
        .select('id, url, caption, user_id, created_at')
        .single();
      if (dbErr) throw dbErr;

      setPhotos(prev => [...prev, data]);
      return data;
    } catch (err) {
      console.error('[EventPhotos] upload failed:', err.message);
      return null;
    } finally {
      setUploading(false);
    }
  }, [currentUser, eventId, photos.length]);

  const deletePhoto = useCallback(async (photoId) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;

    // Optimistic update
    setPhotos(prev => prev.filter(p => p.id !== photoId));

    // Supprimer en DB
    const { error: dbErr } = await supabase.from('event_photos').delete().eq('id', photoId);
    if (dbErr) {
      // Rollback
      setPhotos(prev => [...prev, photo].sort((a, b) => a.created_at.localeCompare(b.created_at)));
      return;
    }

    // Supprimer le fichier du Storage (dériver le path depuis l'URL publique)
    try {
      const url = new URL(photo.url);
      // URL publique : .../storage/v1/object/public/event-photos/clubId/eventId/filename
      const bucketPrefix = `/storage/v1/object/public/${BUCKET}/`;
      const storagePath  = url.pathname.includes(bucketPrefix)
        ? decodeURIComponent(url.pathname.split(bucketPrefix)[1])
        : null;
      if (storagePath) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
      }
    } catch {
      // Échec Storage non bloquant — la DB est déjà nettoyée
    }
  }, [photos]);

  return { photos, loading, uploading, uploadPhoto, deletePhoto, maxPhotos: MAX_PHOTOS };
}

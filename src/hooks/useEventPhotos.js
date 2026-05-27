import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const BUCKET = 'event-photos';
const MAX_PHOTOS = 10;

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
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    const { error } = await supabase.from('event_photos').delete().eq('id', photoId);
    if (error && photo) setPhotos(prev => [...prev, photo]);
  }, [photos]);

  return { photos, loading, uploading, uploadPhoto, deletePhoto, maxPhotos: MAX_PHOTOS };
}

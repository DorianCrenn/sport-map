import { useState } from 'react';
import { supabase } from '../lib/supabase.js';

export type PosterType = 'announce' | 'convocation' | 'result';

interface EventRef { id?: string; }
interface ClubRef  { id?: string | number; }

interface PosterPublishOptions {
  getBlob:     () => Promise<Blob | null>;
  event?:      EventRef;
  club?:       ClubRef;
  userId?:     string;
  posterType?: PosterType;
  onError?:    (msg: string) => void;
}

export function usePosterPublish({ getBlob, event, club, userId, posterType = 'announce', onError }: PosterPublishOptions) {
  const [publishing, setPublishing] = useState(false);
  const [published,  setPublished]  = useState(false);

  const canPublish = Boolean(event?.id && club?.id && userId);

  async function handlePublish(): Promise<boolean> {
    if (!canPublish) { onError?.('Affiche non rattachée à un match — publication impossible.'); return false; }
    setPublishing(true);
    try {
      const blob = await getBlob();
      if (!blob) { onError?.('Export impossible — mémoire insuffisante ou navigateur incompatible.'); return false; }

      const path = `${club!.id}/${event!.id}_${posterType}.png`;
      const { error: uploadErr } = await supabase.storage
        .from('match-posters')
        .upload(path, blob, { upsert: true, contentType: 'image/png', cacheControl: '3600' });
      if (uploadErr) { onError?.("Échec de l'envoi de l'affiche."); return false; }

      const { data: { publicUrl } } = supabase.storage.from('match-posters').getPublicUrl(path);

      const { error: dbErr } = await supabase
        .from('match_posters')
        .upsert({
          event_id:    String(event!.id),
          club_id:     String(club!.id),
          poster_type: posterType,
          image_url:   `${publicUrl}?v=${Date.now()}`,
          created_by:  userId,
        }, { onConflict: 'event_id,poster_type' });
      if (dbErr) { onError?.("Échec de l'enregistrement de l'affiche."); return false; }

      setPublished(true);
      setTimeout(() => setPublished(false), 2500);
      return true;
    } finally {
      setPublishing(false);
    }
  }

  return { publishing, published, canPublish, handlePublish };
}

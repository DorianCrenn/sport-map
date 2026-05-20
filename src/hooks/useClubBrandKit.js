import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

const DEFAULTS = {
  primary_color:   '#22D96A',
  secondary_color: '#0D1117',
  accent_color:    '#ffffff',
  text_color:      '#ffffff',
  bg_color:        '#0D1117',
  primary_font:    'Inter',
  kit_name:        'Identité visuelle',
};

export function useClubBrandKit(clubId) {
  const [kit, setKit]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);

    supabase
      .from('club_brand_kits')
      .select('*')
      .eq('club_id', clubId)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setKit(data ?? { ...DEFAULTS, club_id: clubId });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [clubId]);

  const save = useCallback(async (patch) => {
    if (!clubId) return { error: 'No club' };
    setSaving(true);
    setError(null);

    const payload = { ...DEFAULTS, ...kit, ...patch, club_id: clubId };
    const { data, error: err } = await supabase
      .from('club_brand_kits')
      .upsert(payload, { onConflict: 'club_id' })
      .select()
      .maybeSingle();

    setSaving(false);
    if (err) { setError(err.message); return { error: err.message }; }
    setKit(data ?? payload);
    return { data };
  }, [clubId, kit]);

  return { kit: kit ?? DEFAULTS, loading, saving, error, save };
}

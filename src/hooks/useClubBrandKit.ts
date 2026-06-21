import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase.js';

interface BrandKit {
  club_id?:        string;
  primary_color:   string;
  secondary_color: string;
  accent_color:    string;
  text_color:      string;
  bg_color:        string;
  primary_font:    string;
  kit_name:        string;
  [key: string]:   unknown;
}

const DEFAULTS: Omit<BrandKit, 'club_id'> = {
  primary_color:   '#22D96A',
  secondary_color: '#0D1117',
  accent_color:    '#ffffff',
  text_color:      '#ffffff',
  bg_color:        '#0D1117',
  primary_font:    'Inter',
  kit_name:        'Identité visuelle',
};

export function useClubBrandKit(clubId: string | null | undefined) {
  const [kit,     setKit]     = useState<BrandKit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);

    supabase
      .from('club_brand_kits')
      .select('*')
      .eq('club_id', clubId)
      .maybeSingle()
      .then(({ data, error: err }: { data: BrandKit | null; error: { message: string } | null }) => {
        if (cancelled) return;
        if (err) { setError(err.message); setLoading(false); return; }
        setKit((data ?? { ...DEFAULTS, club_id: String(clubId) }) as BrandKit);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [clubId]);

  const save = useCallback(async (patch: Partial<BrandKit>) => {
    if (!clubId) return { error: 'No club' };
    setSaving(true);
    setError(null);

    const payload: BrandKit = { ...DEFAULTS, ...kit, ...patch, club_id: String(clubId) };
    const { data, error: err } = await supabase
      .from('club_brand_kits')
      .upsert(payload, { onConflict: 'club_id' })
      .select()
      .maybeSingle() as { data: BrandKit | null; error: { message: string } | null };

    setSaving(false);
    if (err) { setError(err.message); return { error: err.message }; }
    setKit(data ?? payload);
    return { data };
  }, [clubId, kit]);

  return { kit: kit ?? { ...DEFAULTS } as BrandKit, loading, saving, error, save };
}

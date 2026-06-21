import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

const COLS = 'id, club_id, sponsor_name, tier, logo_url, logo_white_url, website_url, bg_color, tagline, cta_label, cta_url, active, page_visible, show_in_poster, show_tier_labels, display_order, valid_from, valid_until, season_id, created_at';

export interface SponsorRow {
  id:               string;
  club_id:          string;
  sponsor_name:     string;
  tier:             string;
  logo_url?:        string | null;
  logo_white_url?:  string | null;
  website_url?:     string | null;
  bg_color?:        string | null;
  tagline?:         string | null;
  cta_label?:       string | null;
  cta_url?:         string | null;
  active:           boolean;
  page_visible:     boolean;
  show_in_poster:   boolean;
  show_tier_labels: boolean;
  display_order?:   number | null;
  valid_from?:      string | null;
  valid_until?:     string | null;
  season_id?:       string | null;
  created_at?:      string;
  [key: string]:    unknown;
}

export function useClubSponsorsAdmin(clubId: string | null | undefined) {
  const [sponsors, setSponsors] = useState<SponsorRow[]>([]);
  const [loading,  setLoading]  = useState(false);
  const prevRef = useRef<SponsorRow[]>([]);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('club_sponsors')
      .select(COLS)
      .eq('club_id', String(clubId))
      .order('created_at')
      .then(({ data }: { data: SponsorRow[] | null }) => {
        if (cancelled) return;
        setSponsors(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clubId]);

  const addSponsor = useCallback(async (fields: Partial<SponsorRow>): Promise<boolean> => {
    if (!clubId || !fields.sponsor_name?.trim()) return false;
    const row: Partial<SponsorRow> = {
      club_id: String(clubId), sponsor_name: fields.sponsor_name.trim(),
      tier: fields.tier ?? 'partner', logo_url: fields.logo_url ?? null, logo_white_url: fields.logo_white_url ?? null,
      website_url: fields.website_url ?? null, bg_color: fields.bg_color ?? '#111827',
      tagline: fields.tagline ?? null, cta_label: fields.cta_label ?? null, cta_url: fields.cta_url ?? null,
      active: false, page_visible: true, show_in_poster: fields.show_in_poster ?? true,
      show_tier_labels: fields.show_tier_labels ?? true, display_order: fields.display_order ?? 0,
      valid_from: fields.valid_from ?? null, valid_until: fields.valid_until ?? null, season_id: fields.season_id ?? null,
    };
    const tempId = `temp_${Date.now()}`;
    setSponsors(prev => { prevRef.current = prev; return [...prev, { ...row, id: tempId, created_at: new Date().toISOString() } as SponsorRow]; });
    const { data, error } = await supabase.from('club_sponsors').insert(row).select(COLS).single() as { data: SponsorRow | null; error: { message: string } | null };
    if (error || !data) { setSponsors(prevRef.current); return false; }
    setSponsors(prev => prev.map(s => s.id === tempId ? data : s));
    return true;
  }, [clubId]);

  const updateSponsor = useCallback(async (id: string, patch: Partial<SponsorRow>): Promise<boolean> => {
    setSponsors(prev => { prevRef.current = prev; return prev.map(s => s.id === id ? { ...s, ...patch } : s); });
    const { error } = await supabase.from('club_sponsors').update(patch).eq('id', id) as { error: { message: string } | null };
    if (error) { setSponsors(prevRef.current); return false; }
    return true;
  }, []);

  const removeSponsor = useCallback(async (id: string): Promise<boolean> => {
    setSponsors(prev => { prevRef.current = prev; return prev.filter(s => s.id !== id); });
    const { error } = await supabase.from('club_sponsors').delete().eq('id', id) as { error: { message: string } | null };
    if (error) { setSponsors(prevRef.current); return false; }
    return true;
  }, []);

  return { sponsors, loading, addSponsor, updateSponsor, removeSponsor };
}

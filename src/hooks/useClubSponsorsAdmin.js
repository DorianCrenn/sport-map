import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase.js';

const COLS = 'id, club_id, sponsor_name, tier, logo_url, logo_white_url, website_url, bg_color, tagline, cta_label, cta_url, active, page_visible, show_in_poster, show_tier_labels, display_order, valid_from, valid_until, season_id, created_at';

export function useClubSponsorsAdmin(clubId) {
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading]   = useState(false);
  const prevRef = useRef([]);

  useEffect(() => {
    if (!clubId) return;
    let cancelled = false;
    setLoading(true);
    supabase
      .from('club_sponsors')
      .select(COLS)
      .eq('club_id', String(clubId))
      .order('created_at')
      .then(({ data }) => {
        if (cancelled) return;
        setSponsors(data ?? []);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [clubId]);

  const addSponsor = useCallback(async (fields) => {
    if (!clubId || !fields.sponsor_name?.trim()) return false;
    const row = {
      club_id:          String(clubId),
      sponsor_name:     fields.sponsor_name.trim(),
      tier:             fields.tier              ?? 'partner',
      logo_url:         fields.logo_url          || null,
      logo_white_url:   fields.logo_white_url    || null,
      website_url:      fields.website_url       || null,
      bg_color:         fields.bg_color          || '#111827',
      tagline:          fields.tagline           || null,
      cta_label:        fields.cta_label         || null,
      cta_url:          fields.cta_url           || null,
      active:           false,
      page_visible:     true,
      show_in_poster:   fields.show_in_poster    ?? true,
      show_tier_labels: fields.show_tier_labels  ?? true,
      display_order:    fields.display_order      ?? 0,
      valid_from:       fields.valid_from         || null,
      valid_until:      fields.valid_until        || null,
      season_id:        fields.season_id          || null,
    };
    const tempId = `temp_${Date.now()}`;
    setSponsors(prev => { prevRef.current = prev; return [...prev, { ...row, id: tempId, created_at: new Date().toISOString() }]; });
    const { data, error } = await supabase.from('club_sponsors').insert(row).select(COLS).single();
    if (error || !data) {
      setSponsors(prevRef.current);
      return false;
    }
    setSponsors(prev => prev.map(s => s.id === tempId ? data : s));
    return true;
  }, [clubId]);

  const updateSponsor = useCallback(async (id, patch) => {
    setSponsors(prev => { prevRef.current = prev; return prev.map(s => s.id === id ? { ...s, ...patch } : s); });
    const { error } = await supabase.from('club_sponsors').update(patch).eq('id', id);
    if (error) {
      setSponsors(prevRef.current);
      return false;
    }
    return true;
  }, []);

  const removeSponsor = useCallback(async (id) => {
    setSponsors(prev => { prevRef.current = prev; return prev.filter(s => s.id !== id); });
    const { error } = await supabase.from('club_sponsors').delete().eq('id', id);
    if (error) {
      setSponsors(prevRef.current);
      return false;
    }
    return true;
  }, []);

  return { sponsors, loading, addSponsor, updateSponsor, removeSponsor };
}

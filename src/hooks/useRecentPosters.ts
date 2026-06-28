import { useState, useEffect } from 'react';
import { supabase, isDemoMode } from '../lib/supabase.js';

export interface RecentPoster {
  key: string;
  club_name: string;
  sport: string;
  template_id: string;
  format: 'story' | 'square' | 'landscape' | string;
  channel: string;
  created_at: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
  impact: 'Impact', simple: 'Simple', light: 'Light', color: 'Color',
  editorial: 'Éditorial', luxe: 'Luxe', blanc: 'Blanc', elegant: 'Élégant',
  magazine: 'Magazine', neon: 'Néon', fluo: 'Fluo', cinema: 'Cinéma',
  retro: 'Rétro', vivid: 'Vivid', bento: 'Bento', prestige: 'Prestige',
  pulse: 'Pulse', strike: 'Strike', glass: 'Glass', flag: 'Flag',
  ink: 'Ink', aurora: 'Aurora',
  'tr-premium': 'Tournoi Premium', 'tr-neon': 'Tournoi Néon',
  'tr-minimal': 'Tournoi Minimal', 'tr-gradient': 'Tournoi Gradient',
};

export function templateLabel(id: string): string {
  return TEMPLATE_LABELS[id] ?? id;
}

const FORMAT_LABELS: Record<string, string> = {
  story: 'Story', square: 'Post', landscape: 'Paysage',
};

export function formatLabel(f: string): string {
  return FORMAT_LABELS[f] ?? f;
}

export function useRecentPosters(limit = 5) {
  const [posters, setPosters]   = useState<RecentPoster[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (isDemoMode()) { setLoading(false); return; }
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from('poster_exports')
        .select('club_id, template_id, format, channel, created_at, clubs(name, sport)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!mounted) return;
      if (data) {
        setPosters(
          data.map((d: any, i: number) => ({
            key:          `${d.created_at ?? i}-${d.club_id ?? i}`,
            club_name:    d.clubs?.name  ?? 'Club',
            sport:        d.clubs?.sport ?? '',
            template_id:  d.template_id  ?? '',
            format:       d.format       ?? 'story',
            channel:      d.channel      ?? '',
            created_at:   d.created_at   ?? '',
          })),
        );
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [limit]);

  return { posters, loading };
}

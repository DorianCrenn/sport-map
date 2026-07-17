import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

interface Club {
  id: string;
  name: string;
  sport: string;
  city: string;
  logo_url?: string;
}

function ClubRow({ club, onNavigate }: { club: Club; onNavigate?: (page: string) => void }) {
  const { followClub } = useAuth();
  const [followed, setFollowed] = useState(false);

  const initials = club.name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  function handleFollow() {
    if (followed) return;
    followClub?.(club.id);
    setFollowed(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 14px', borderRadius: 'var(--sl-radius-2xl)',
        backgroundColor: 'var(--sl-card)',
        border: '1px solid var(--sl-border)',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--sl-radius-lg)', flexShrink: 0,
        backgroundColor: 'rgba(34,217,106,0.12)',
        border: '1px solid rgba(34,217,106,0.2)',
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 800, color: '#22d96a',
      }}>
        {club.logo_url
          ? <img src={club.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }} />
          : initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {club.name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>
          {[club.sport, club.city].filter(Boolean).join(' · ')}
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={handleFollow}
        style={{
          flexShrink: 0, fontSize: 12, fontWeight: 700, borderRadius: 'var(--sl-radius-lg)',
          padding: '6px 14px', border: 'none', cursor: followed ? 'default' : 'pointer',
          backgroundColor: followed ? 'rgba(34,217,106,0.15)' : '#22d96a',
          color: followed ? '#22d96a' : '#fff',
          transition: 'all 0.2s',
        }}
      >
        {followed ? '✓ Suivi' : 'Suivre'}
      </motion.button>
    </motion.div>
  );
}

interface DiscoveryClubsProps {
  onNavigate?:  (page: string) => void;
  userSport?:   string;
}

export default function DiscoveryClubs({ onNavigate, userSport }: DiscoveryClubsProps) {
  const [clubs,   setClubs]   = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSportMatch, setHasSportMatch] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      let result: Club[] = [];

      // 1. Si un sport favori est connu, chercher d'abord les clubs de ce sport
      if (userSport) {
        const { data } = await supabase
          .from('clubs')
          .select('id, name, sport, city, logo_url')
          .eq('sport', userSport)
          .order('created_at', { ascending: false })
          .limit(4) as { data: Club[] | null };
        result = data ?? [];
      }

      // 2. Compléter avec des clubs récents si on n'a pas assez
      if (result.length < 4) {
        const existingIds = new Set(result.map(c => c.id));
        const { data: fallback } = await supabase
          .from('clubs')
          .select('id, name, sport, city, logo_url')
          .order('created_at', { ascending: false })
          .limit(8) as { data: Club[] | null };
        const extras = (fallback ?? []).filter(c => !existingIds.has(c.id));
        result = [...result, ...extras].slice(0, 4);
      }

      if (mounted) {
        setClubs(result);
        setHasSportMatch(!!userSport && result.some(c => c.sport === userSport));
        setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [userSport]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-2xl animate-pulse bg-[var(--sl-surface)]" />)}
      </div>
    );
  }

  if (clubs.length === 0) return null;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)' }}>Clubs à suivre</span>
          {hasSportMatch && userSport && (
            <span style={{ fontSize: 10, color: 'var(--sl-t3)', marginLeft: 6 }}>· {userSport}</span>
          )}
        </div>
        <button
          onClick={() => onNavigate?.('clubs')}
          style={{ fontSize: 11, fontWeight: 600, color: '#22d96a', background: 'none', border: 'none', cursor: 'pointer', padding: '10px 4px', minHeight: 44 }}
        >
          Voir tout →
        </button>
      </div>
      <div className="space-y-2">
        {clubs.map((c, i) => (
          <motion.div key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
            <ClubRow club={c} onNavigate={onNavigate} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

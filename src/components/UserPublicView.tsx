import { useState, useEffect } from 'react';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase.js';
import { getLevel, BADGE_DEFS, BADGE_ORDER } from '../hooks/useBadges.js';
import SportIcon from './SportIcon.jsx';

interface Profile { id: string; xp?: number | null; favorite_sports?: string[] | null; badges?: string[] | null; role?: string | null; created_at?: string | null; }
interface FollowedClub { id: string | number; name: string; sport: string; logo_url?: string | null; }

function InitialAvatar({ userId, size = 56 }: { userId: string; size?: number }) {
  const seed = userId ? userId.slice(-4) : '0000';
  const hue = parseInt(seed, 16) % 360;
  const initials = seed.slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: `hsl(${hue}, 60%, 45%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.34, fontWeight: 800, color: '#fff', flexShrink: 0, letterSpacing: '-0.02em' }}>{initials}</div>
  );
}

interface UserPublicViewProps { userId: string; onClose: () => void; }

export default function UserPublicView({ userId, onClose }: UserPublicViewProps) {
  const [profile,       setProfile]       = useState<Profile | null>(null);
  const [followedClubs, setFollowedClubs] = useState<FollowedClub[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [copied,        setCopied]        = useState(false);

  useAndroidBack(true, onClose);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      supabase.from('profiles').select('id, xp, favorite_sports, badges, role, created_at').eq('id', userId).maybeSingle(),
      supabase.from('club_follows').select('club_id, clubs(id, name, sport, logo_url)').eq('user_id', userId).limit(12),
    ]).then(([{ data: prof }, { data: follows }]) => {
      setProfile(prof as Profile | null);
      setFollowedClubs(((follows ?? []) as any[]).map((f: any) => f.clubs).filter(Boolean));
      setLoading(false);
    });
  }, [userId]);

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}#user/${userId}`;
    if (navigator.share) { navigator.share({ url }); }
    else { navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }
  }

  const xp = profile?.xp ?? 0;
  const levelInfo = (getLevel as (xp: number) => any)(xp);
  const favSports = profile?.favorite_sports ?? [];
  const earnedBadgeIds = new Set(profile?.badges ?? []);
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : null;

  return (
    <motion.div role="dialog" aria-modal="true" aria-label="Profil membre" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 36 }} style={{ position: 'absolute', inset: 0, zIndex: 1100, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sl-bg)', fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif', overflowY: 'auto' }}>
      <div style={{ flexShrink: 0, padding: '14px 16px', backgroundColor: 'var(--sl-card)', borderBottom: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onClose} aria-label="Retour" style={{ width: 44, height: 44, borderRadius: 11, border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)', flexShrink: 0 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em', flex: 1 }}>Profil membre</h1>
        <button onClick={handleShare} style={{ width: 44, height: 44, borderRadius: 11, border: 'none', cursor: 'pointer', backgroundColor: copied ? 'rgba(34,217,106,0.12)' : 'var(--sl-surface)', color: copied ? 'var(--sl-green)' : 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} title="Partager ce profil">
          {copied ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>}
        </button>
      </div>
      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--sl-border)', borderTopColor: 'var(--sl-green)', animation: 'sl-spin 0.7s linear infinite' }} />
        </div>
      ) : !profile ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, textAlign: 'center' }}>
          <span style={{ fontSize: 48 }}>🔍</span>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)' }}>Profil introuvable</div>
          <div style={{ fontSize: 13, color: 'var(--sl-t3)' }}>Ce membre n'existe pas ou a supprimé son compte.</div>
        </div>
      ) : (
        <div style={{ flex: 1, padding: '20px 16px calc(32px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ borderRadius: 20, padding: '20px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <InitialAvatar userId={userId} size={60} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em', marginBottom: 4 }}>Membre SportLink</div>
              {memberSince && <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>Membre depuis {memberSince}</div>}
            </div>
          </div>
          <div style={{ borderRadius: 20, padding: '18px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)' }}>Niveau {levelInfo.level} — {levelInfo.name}</div>
                <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>{xp} XP{levelInfo.nextLevel ? ` · ${levelInfo.nextLevel.minXp - xp} XP pour ${levelInfo.nextLevel.name}` : ' · Niveau max'}</div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--sl-green), #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{levelInfo.level}</div>
            </div>
            {levelInfo.nextLevel && <div style={{ height: 6, borderRadius: 3, backgroundColor: 'var(--sl-border)', overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, var(--sl-green), #16a34a)', width: `${Math.round(levelInfo.progress * 100)}%`, transition: 'width 0.6s ease' }} /></div>}
          </div>
          {favSports.length > 0 && (
            <div style={{ borderRadius: 20, padding: '18px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 10 }}>Sports pratiqués</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {favSports.map(sport => (
                  <div key={sport} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                    <SportIcon sport={sport} size={14} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', textTransform: 'capitalize' }}>{sport}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {followedClubs.length > 0 && (
            <div style={{ borderRadius: 20, padding: '18px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 10 }}>Clubs suivis ({followedClubs.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {followedClubs.map(club => (
                  <div key={club.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {club.logo_url ? <img src={club.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <SportIcon sport={club.sport} size={18} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t3)', textTransform: 'capitalize' }}>{club.sport}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ borderRadius: 20, padding: '18px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 10 }}>Badges</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {(BADGE_ORDER as string[]).map(id => {
                const def = (BADGE_DEFS as Record<string, any>)[id];
                if (!def) return null;
                const earned = earnedBadgeIds.has(id);
                return (
                  <div key={id} title={`${def.name} — ${def.description}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 12, backgroundColor: earned ? `${def.color}12` : 'var(--sl-surface)', border: `1px solid ${earned ? def.color + '30' : 'var(--sl-border)'}`, opacity: earned ? 1 : 0.4, transition: 'all 0.2s' }}>
                    <span style={{ fontSize: 22, filter: earned ? 'none' : 'grayscale(100%)' }}>{def.icon}</span>
                    <span style={{ fontSize: 8, fontWeight: 700, color: earned ? def.color : 'var(--sl-t3)', textAlign: 'center', lineHeight: 1.2 }}>{def.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

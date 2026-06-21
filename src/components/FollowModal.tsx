import { useState, useMemo, useEffect, useRef } from 'react';
import { Z } from '../constants/zIndex.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import SportIcon from './SportIcon.jsx';

interface Club { id: string | number; name: string; sport: string; city: string; logo?: string | null; categories?: { teams?: { name: string }[] }[]; }
interface FollowData { teams: string[] | 'all'; notif: { match: boolean; news: boolean }; }
interface FollowModalProps { club: Club; allEvents?: any[]; currentFollow?: FollowData | null; onSave: (data: FollowData) => void; onClose: () => void; }

export default function FollowModal({ club, allEvents = [], currentFollow = null, onSave, onClose }: FollowModalProps) {
  const { allSports: SPORTS } = useSports();
  const sportData  = (SPORTS as any)[club.sport];
  const sportColor = sportData?.color ?? '#22d96a';
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);

  const availableTeams = useMemo(() => {
    const names = new Set<string>();
    allEvents.filter(e => String(e.clubId) === String(club.id) && e.teamName).forEach(e => names.add(e.teamName));
    (club.categories ?? []).flatMap(c => c.teams ?? []).forEach(t => names.add(t.name));
    return [...names];
  }, [allEvents, club]);

  const [followAll,     setFollowAll]     = useState(() => currentFollow ? currentFollow.teams === 'all' : true);
  const [selectedTeams, setSelectedTeams] = useState(() => { if (!currentFollow || currentFollow.teams === 'all') return new Set(availableTeams); return new Set(currentFollow.teams as string[]); });
  const [notif,         setNotif]         = useState(() => currentFollow?.notif ?? { match: true, news: true });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function toggleTeam(name: string) { setSelectedTeams(prev => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; }); }
  function handleSave() { const teams = followAll || availableTeams.length === 0 ? 'all' : [...selectedTeams]; onSave({ teams, notif }); }
  const isEditing = !!currentFollow;

  return (
    <AnimatePresence>
      <motion.div key="follow-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }} style={{ position: 'fixed', inset: 0, zIndex: (Z as any).followModal, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
        <motion.div ref={dialogRef} key="follow-sheet" role="dialog" aria-modal="true" aria-labelledby="follow-modal-title" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 38 }} style={{ width: '100%', maxWidth: 520, borderRadius: '22px 22px 0 0', padding: '0 0 env(safe-area-inset-bottom, 20px)', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', maxHeight: '90dvh', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--sl-border-s)' }} />
          </div>
          <div style={{ overflowY: 'auto', padding: '16px 20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, backgroundColor: `${sportColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {club.logo ? <img src={club.logo} alt={club.name} loading="lazy" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /> : <SportIcon sport={club.sport} size={22} color={sportColor} />}
                </div>
                <div><div id="follow-modal-title" style={{ fontWeight: 700, fontSize: 16, color: 'var(--sl-t1)', lineHeight: 1.2 }}>{club.name}</div><div style={{ fontSize: 12, color: 'var(--sl-t3)', marginTop: 2 }}>{club.sport} · {club.city}</div></div>
              </div>
              <button onClick={onClose} aria-label="Fermer" style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t3)', flexShrink: 0 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {availableTeams.length > 0 && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 10 }}>Que souhaitez-vous suivre ?</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                  {([{ val: true, title: 'Tout le club', sub: 'Tous les matchs et équipes' }, { val: false, title: 'Certaines équipes', sub: 'Choisir les équipes à suivre' }] as const).map(({ val, title, sub }) => (
                    <button key={String(val)} onClick={() => setFollowAll(val)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '12px 14px', borderRadius: 13, cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${followAll === val ? sportColor : 'var(--sl-border)'}`, backgroundColor: followAll === val ? `${sportColor}12` : 'var(--sl-surface)', transition: 'all 0.15s' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${followAll === val ? sportColor : 'var(--sl-border-s)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.15s' }}>{followAll === val && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: sportColor }} />}</div>
                      <div><div style={{ fontWeight: 600, fontSize: 13, color: 'var(--sl-t1)' }}>{title}</div><div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>{sub}</div></div>
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {!followAll && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden', marginBottom: 20 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 10 }}>Équipes</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {availableTeams.map(teamName => { const checked = selectedTeams.has(teamName); return (
                          <button key={teamName} onClick={() => toggleTeam(teamName)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '10px 14px', borderRadius: 11, cursor: 'pointer', textAlign: 'left', border: `1px solid ${checked ? sportColor : 'var(--sl-border)'}`, backgroundColor: checked ? `${sportColor}10` : 'var(--sl-surface)', transition: 'all 0.12s' }}>
                            <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0, border: `2px solid ${checked ? sportColor : 'var(--sl-border-s)'}`, backgroundColor: checked ? sportColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.12s' }}>
                              {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--sl-t1)' }}>{teamName}</span>
                          </button>
                        ); })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 10 }}>Notifications</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {([{ key: 'match', icon: '🏆', label: 'Matchs', sub: '1h avant chaque match' }, { key: 'news', icon: '📰', label: 'Événements', sub: 'Nouveaux événements' }] as const).map(({ key, icon, label, sub }) => (
                  <button key={key} onClick={() => setNotif(p => ({ ...p, [key]: !p[key] }))} style={{ flex: 1, padding: '11px 12px', borderRadius: 12, cursor: 'pointer', textAlign: 'left', border: `1.5px solid ${notif[key] ? sportColor : 'var(--sl-border)'}`, backgroundColor: notif[key] ? `${sportColor}12` : 'var(--sl-surface)', transition: 'all 0.15s' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)', marginBottom: 3 }}>{icon} {label}</div>
                    <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{sub}</div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 13, cursor: 'pointer', border: '1px solid var(--sl-border)', fontSize: 14, fontWeight: 600, color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)' }}>Annuler</button>
              <button onClick={handleSave} style={{ flex: 2, padding: '13px 0', borderRadius: 13, cursor: 'pointer', border: 'none', fontSize: 14, fontWeight: 700, color: '#fff', backgroundColor: sportColor, boxShadow: `0 4px 16px ${sportColor}40` }}>{isEditing ? 'Mettre à jour' : 'Suivre le club'}</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

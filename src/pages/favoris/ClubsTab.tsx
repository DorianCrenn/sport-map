import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../../hooks/useSports.js';
import { downloadICS } from '../../utils/exportICS.js';
import FollowModal from '../../components/FollowModal.jsx';
import SportIcon from '../../components/SportIcon.jsx';

interface CalSvgProps {
  size?: number;
}

const CalSvg = ({ size = 11 }: CalSvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

interface ClubsTabProps {
  allEvents: Record<string, any>[];
  allClubs: Record<string, any>[];
  follows: Record<string, any>[];
  onUnfollowClub: (clubId: any) => void;
  onUpdateFollow: (clubId: any, options: any) => void;
}

export default function ClubsTab({ allEvents, allClubs, follows, onUnfollowClub, onUpdateFollow }: ClubsTabProps) {
  const { allSports: SPORTS } = useSports() as any;
  const [editingClubId, setEditingClubId] = useState<any>(null);
  const [expandedClubId, setExpandedClubId] = useState<any>(null);

  const followedWithData = useMemo(() => {
    return follows.map(follow => {
      const club = allClubs.find(c => String(c.id) === String(follow.clubId));
      if (!club) return null;
      const clubEvents = allEvents
        .filter(e => {
          if (String(e.clubId) !== String(club.id)) return false;
          if (follow.teams === 'all') return true;
          return follow.teams.includes(e.teamName);
        })
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);
      return { follow, club, upcomingEvents: clubEvents };
    }).filter(Boolean);
  }, [follows, allClubs, allEvents]);

  if (follows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center' }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          style={{ width: 72, height: 72, borderRadius: 'var(--sl-radius-4xl)', background: 'rgba(34,217,106,0.08)', border: '1px solid rgba(34,217,106,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="1.5" strokeLinecap="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </motion.div>
        <p style={{ fontWeight: 900, fontSize: 18, color: 'var(--sl-t1)', fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: '-0.01em', marginBottom: 8 }}>
          Aucun club suivi
        </p>
        <p style={{ fontSize: 13, color: 'var(--sl-t3)', lineHeight: 1.6, maxWidth: 240, marginBottom: 0 }}>
          Retrouve tes clubs ici — visite la page d'un club et appuie sur "Suivre".
        </p>
      </motion.div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px calc(90px + env(safe-area-inset-bottom, 0px))' }}>
      {followedWithData.map((item: any) => {
        const { follow, club, upcomingEvents } = item;
        const sportColor = SPORTS[club.sport]?.color ?? '#22d96a';
        const isExpanded = expandedClubId === club.id;
        const teamsLabel = follow.teams === 'all' ? 'Tout le club' : `${follow.teams.length} équipe${follow.teams.length > 1 ? 's' : ''}`;

        return (
          <div key={club.id} style={{ marginBottom: 10 }}>
            <div style={{ borderRadius: 'var(--sl-radius-2xl)', overflow: 'hidden', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
              <div
                onClick={() => setExpandedClubId(isExpanded ? null : club.id)}
                style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 'var(--sl-radius-lg)', flexShrink: 0, backgroundColor: `${sportColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {club.logo
                    ? <img src={club.logo} alt={club.name} loading="lazy" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 'var(--sl-radius-sm)' }} onError={(e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = 'none'; }} />
                    : <SportIcon sport={club.sport} size={20} color={sportColor} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 'var(--sl-radius-sm)', color: sportColor, backgroundColor: `${sportColor}18` }}>{club.sport}</span>
                    <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{teamsLabel}</span>
                    {upcomingEvents.length > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 'var(--sl-radius-sm)', color: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.12)' }}>
                        {upcomingEvents.length} à venir
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditingClubId(club.id); }}
                    title="Modifier le suivi"
                    style={{ width: 36, height: 36, borderRadius: 'var(--sl-radius-md)', border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t3)' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>
                  </button>
                  <button
                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); onUnfollowClub(club.id); }}
                    title="Ne plus suivre"
                    style={{ width: 36, height: 36, borderRadius: 'var(--sl-radius-md)', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round" style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: 'hidden', borderTop: '1px solid var(--sl-border)' }}
                  >
                    <div style={{ padding: '10px 14px 12px' }}>
                      {upcomingEvents.length === 0 ? (
                        <p style={{ fontSize: 12, color: 'var(--sl-t3)', textAlign: 'center', padding: '8px 0', fontStyle: 'italic' }}>Aucun événement à venir</p>
                      ) : (
                        upcomingEvents.map((ev: any) => {
                          const d = new Date(ev.date);
                          return (
                            <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--sl-border)' }}>
                              <div style={{ width: 36, textAlign: 'center', flexShrink: 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, color: sportColor }}>{d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                                <div style={{ fontSize: 9, color: 'var(--sl-t3)' }}>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                                <div style={{ fontSize: 10, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.venue || ev.city}</div>
                              </div>
                              <button onClick={() => downloadICS(ev)} title="Ajouter au calendrier"
                                style={{ width: 36, height: 36, borderRadius: 'var(--sl-radius-md)', border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <CalSvg size={12} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {editingClubId === club.id && (
              <FollowModal
                club={club}
                allEvents={allEvents}
                currentFollow={follow}
                onSave={(options: any) => { onUpdateFollow(club.id, options); setEditingClubId(null); }}
                onClose={() => setEditingClubId(null)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

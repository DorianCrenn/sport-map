import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../../constants/zIndex.js';
import { supabase } from '../../lib/supabase.js';
import { useCanDo } from '../../hooks/useCanDo.js';
import { useClubDashboard } from '../../hooks/useClubDashboard.js';
import { useClubBrandKit } from '../../hooks/useClubBrandKit.js';
import { useClubAnnouncements } from '../../hooks/useClubAnnouncements.js';
import { useClubFeatures } from '../../hooks/useClubFeatures.js';
import { useClubChallenges } from '../../hooks/useClubChallenges.js';
import { useClubTrainings } from '../../hooks/useClubTrainings.js';
import { useClubs } from '../../hooks/useClubs.js';
import { FeaturedSection } from './PromoteFeedModal.jsx';
import SendAnnouncementModal from './SendAnnouncementModal.jsx';
import AnnouncementCard from '../AnnouncementCard.jsx';
import UpgradeDiff from '../ui/UpgradeDiff.jsx';
import PlansMiniModal from '../ui/PlansMiniModal.jsx';
import SubscriptionExpiryBanner from '../ui/SubscriptionExpiryBanner.jsx';
import { canUseFeature } from '../../lib/planHelpers.ts';
import { hasDemoData, deleteDemoData } from '../../lib/demoDataGenerator.js';
import ClubInvitePanel from './ClubInvitePanel.jsx';
import { IconRun, IconBall, IconTrophy, IconTarget, IconBarChart, IconRocket, IconZap, IconMegaphone } from '../icons.js';

interface ConvocStats { total: number; accepted: number; declined: number; pending: number; }

function useConvocStats(clubId: string | number | null | undefined) {
  const [stats, setStats] = useState<ConvocStats | null>(null);

  const load = useCallback(async () => {
    if (!clubId) return;
    const { data } = await supabase
      .from('convocation_reply_tokens')
      .select('reply_status')
      .eq('club_id', String(clubId))
      .gte('expires_at', new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()) as { data: { reply_status: string | null }[] | null };
    if (!data) return;
    const total    = data.length;
    const accepted = data.filter(r => r.reply_status === 'accepted').length;
    const declined = data.filter(r => r.reply_status === 'declined').length;
    const pending  = data.filter(r => !r.reply_status).length;
    setStats({ total, accepted, declined, pending });
  }, [clubId]);

  useEffect(() => { load(); }, [load]);
  return stats;
}

function StatCard({ label, value, sub, color = 'var(--sl-t1)' }: { label: string; value: number; sub?: string; color?: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, borderRadius: 'var(--sl-radius-2xl)', padding: '14px 12px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>{value}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t2)' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data }: { data: { count: number; label: string }[] }) {
  const max = Math.max(...(data ?? []).map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', backgroundColor: d.count > 0 ? '#3b82f6' : 'var(--sl-border)', borderRadius: '3px 3px 0 0', height: d.count > 0 ? `${Math.round((d.count / max) * 48) + 4}px` : '2px', transition: 'height 0.4s' }} />
          <div style={{ fontSize: 7, color: 'var(--sl-t3)', textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

const ANN_TYPE_COLOR: Record<string, string> = { urgent: '#ef4444', result: '#22C55E', event: '#3b82f6', info: '#f59e0b' };
const ANN_TYPE_LABEL: Record<string, string> = { urgent: 'Urgent', result: 'Résultat', event: 'Événement', info: 'Info' };

function CalendrierEditorial({ upcomingEvents, scheduledAnnouncements }: { upcomingEvents?: Record<string, any>[]; scheduledAnnouncements?: Record<string, any>[] }) {
  const now = new Date();
  const future30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const evItems = (upcomingEvents ?? [])
    .filter(ev => { const d = new Date(ev.date + 'T' + (ev.time ?? '23:59')); return d >= now && d <= future30; })
    .map(ev => ({ type: 'event', dt: new Date(ev.date + 'T' + (ev.time ?? '12:00')), label: ev.homeTeam && ev.awayTeam ? `${ev.homeTeam} vs ${ev.awayTeam}` : (ev.title ?? 'Match'), sub: ev.venue ?? '', annType: '' }));

  const annItems = (scheduledAnnouncements ?? []).map(a => ({ type: 'announcement', dt: new Date(a.scheduled_for), annType: a.type, label: a.title || a.message?.slice(0, 50) || 'Annonce', sub: '' }));

  const items = [...evItems, ...annItems].sort((a, b) => a.dt.getTime() - b.dt.getTime());
  if (items.length === 0) return null;

  return (
    <div style={{ borderRadius: 'var(--sl-radius-2xl)', padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 12 }}>Calendrier éditorial — 30 jours</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item, idx) => {
          const day  = item.dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
          const time = item.dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const isEvent = item.type === 'event';
          const dotColor = isEvent ? '#3b82f6' : (ANN_TYPE_COLOR[item.annType] ?? '#f59e0b');
          return (
            <div key={idx} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: idx < items.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: `${dotColor}18`, color: dotColor, flexShrink: 0 }}>{isEvent ? 'Match' : (ANN_TYPE_LABEL[item.annType] ?? 'Annonce')}</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{day} {isEvent ? `à ${time}` : `— envoi à ${time}`}{item.sub ? ` · ${item.sub}` : ''}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const DAY_TO_JS: Record<string, number> = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0 };

function TrainingsSection({ clubId }: { clubId: string | number }) {
  const [trainings] = useClubTrainings(String(clubId));
  const allSessions: any[] = Object.entries(trainings as Record<string, any[]>).flatMap(([, sessions]) => sessions ?? []);
  if (allSessions.length === 0) return null;

  const today = new Date().getDay();
  const sorted = [...allSessions].sort((a, b) => {
    const ra = ((DAY_TO_JS[a.day] ?? 0) - today + 7) % 7;
    const rb = ((DAY_TO_JS[b.day] ?? 0) - today + 7) % 7;
    return ra !== rb ? ra - rb : (a.time ?? '').localeCompare(b.time ?? '');
  });
  const next = sorted.slice(0, 3);

  return (
    <div style={{ borderRadius: 'var(--sl-radius-2xl)', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)' }}><IconRun size={12} strokeWidth={2} /> Entraînements</div>
          <div style={{ fontSize: 12, color: 'var(--sl-t2)', marginTop: 2 }}>{allSessions.length} séance{allSessions.length > 1 ? 's' : ''} par semaine</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid var(--sl-border)' }}>
        {next.map((s, idx) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', borderBottom: idx < next.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 'var(--sl-radius-md)', flexShrink: 0, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#6366f1', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{s.day?.slice(0, 2)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.category || 'Entraînement'}</div>
              <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{s.day} · {s.time}{s.location ? ` · ${s.location}` : ''}</div>
            </div>
            {s.duration ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t2)', flexShrink: 0 }}>{s.duration}min</span> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function AnnouncementsSection({ club }: { club: Record<string, any> }) {
  const { announcements, loading, sendAnnouncement, deleteAnnouncement } = useClubAnnouncements(club.id);
  const { can } = useCanDo();
  const [showModal, setShowModal] = useState(false);
  const [success, setSuccess]     = useState(false);
  // RBAC réel : la matrice (permission_matrix) décide. En démo / si la matrice
  // n'est pas chargée, useCanDo renvoie true (permissif) → pas de lockout.
  const canCreate = can('announcements', 'create');
  const canDelete = can('announcements', 'delete');

  const published = announcements.filter((a: any) => !a.scheduledFor || new Date(a.scheduledFor) <= new Date());

  async function handleSend({ type, title, message, targetTeams, scheduledFor }: Record<string, any>) {
    await sendAnnouncement({ type, title, message, targetTeams, clubName: club.name, scheduledFor });
    setShowModal(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    if (!scheduledFor) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const anonKey     = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      fetch(`${supabaseUrl}/functions/v1/notify-club-followers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey },
        body: JSON.stringify({ clubId: club.id, clubName: club.name, message: message.slice(0, 100) }),
      }).catch(() => {});
    }
  }

  return (
    <div style={{ borderRadius: 'var(--sl-radius-2xl)', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)' }}><IconMegaphone size={12} strokeWidth={2} /> Annonces envoyées</div>
          <div style={{ fontSize: 12, color: 'var(--sl-t2)', marginTop: 2 }}>{loading ? 'Chargement…' : published.length === 0 ? 'Aucune annonce publiée' : `${published.length} publiée${published.length > 1 ? 's' : ''}`}</div>
        </div>
        {canCreate && <button onClick={() => setShowModal(true)} style={{ padding: '7px 12px', borderRadius: 'var(--sl-radius-lg)', border: 'none', cursor: 'pointer', backgroundColor: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 700 }}>+ Nouvelle</button>}
      </div>
      {!loading && published.length > 0 && (
        <div style={{ borderTop: '1px solid var(--sl-border)' }}>
          {published.slice(0, 8).map((ann: any, idx: number) => (
            <AnnouncementCard key={ann.id} ann={ann} variant="dashboard" onDelete={canDelete ? deleteAnnouncement : undefined} isLast={idx === Math.min(published.length, 8) - 1} />
          ))}
        </div>
      )}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ padding: '10px 16px', backgroundColor: 'rgba(59,130,246,0.08)', borderTop: '1px solid var(--sl-border)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>✓ Annonce envoyée à tes abonnés — visible dans le fil d'actualité.</div>
          </motion.div>
        )}
      </AnimatePresence>
      {showModal && <SendAnnouncementModal club={club} onSend={handleSend} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function SubscriptionSection({ clubId }: { clubId: string | number }) {
  const features = useClubFeatures(String(clubId));
  const [showPlans, setShowPlans] = useState(false);
  if (features.loading) return null;

  const { planMeta, planId, nextPlanId, nextPlanMeta, isUpgradeable, periodEnd } = features;

  function openSubscriptionPage() {
    window.location.hash = `#subscription/${clubId}`;
  }
  const DASHBOARD_ROWS = [
    { key: 'POSTER_EXPERT',           label: 'Mode Expert PosterStudio' },
    { key: 'POSTER_WATERMARK_REMOVE', label: 'Sans filigrane'           },
    { key: 'POSTER_AI_BACKGROUND',    label: 'IA génération affiches'   },
    { key: 'CARPOOLING_ALL_TEAMS',    label: 'Covoiturage toutes équipes'},
    { key: 'FEATURED_EVENTS',         label: 'Événements À la Une'      },
    { key: 'AUTOMATIONS',             label: 'Automatisations IA'       },
  ];

  return (
    <>
      <SubscriptionExpiryBanner periodEnd={periodEnd} planId={planId} planName={planMeta?.name} />
      <div style={{ borderRadius: 'var(--sl-radius-2xl)', overflow: 'hidden', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
        <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sl-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{planMeta.badge}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: planMeta.color }}>{planMeta.name}</div>
              <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>{planMeta.price === 0 ? 'Gratuit' : `${planMeta.price} €/mois`}{periodEnd && ` · Renouvellement ${new Date(periodEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {planId !== 'free' && (
              <button
                onClick={openSubscriptionPage}
                data-testid="btn-manage-subscription"
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)', background: 'none', border: '1px solid var(--sl-border)', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--sl-radius-md)' }}
              >
                Mon abonnement
              </button>
            )}
            <button onClick={() => setShowPlans(true)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 'var(--sl-radius-md)', backgroundColor: 'rgba(77,166,255,0.08)' }}>Voir les plans</button>
          </div>
        </div>
        <div style={{ padding: '10px 16px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {DASHBOARD_ROWS.map(({ key, label }) => {
            const allowed = canUseFeature(key as any, planId);
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', flexShrink: 0, backgroundColor: allowed ? `${planMeta.color}18` : 'var(--sl-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {allowed ? <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke={planMeta.color} strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                </div>
                <span style={{ fontSize: 12, color: allowed ? 'var(--sl-t1)' : 'var(--sl-t3)', fontWeight: allowed ? 500 : 400 }}>{label}</span>
                {!allowed && nextPlanMeta && <span style={{ fontSize: 10, color: nextPlanMeta.color, fontWeight: 700, marginLeft: 'auto', flexShrink: 0 }}>→ {nextPlanMeta.name}</span>}
              </div>
            );
          })}
        </div>
        {isUpgradeable && nextPlanId && (
          <div style={{ borderTop: '1px solid var(--sl-border)', padding: '12px 16px' }}>
            <UpgradeDiff currentPlanId={planId} nextPlanId={nextPlanId} onUpgrade={() => setShowPlans(true)} />
          </div>
        )}
      </div>
      <PlansMiniModal open={showPlans} onClose={() => setShowPlans(false)} currentPlanId={planId} nextPlanId={nextPlanId} />
    </>
  );
}

function ArchiveSeasonSection({ club, allEvents, clubEventIds, onArchiveSeason }: { club: Record<string, any>; allEvents?: Record<string, any>[]; clubEventIds: (string | number)[]; onArchiveSeason?: ((id: string | number) => Promise<void>) | null }) {
  const [confirming, setConfirming] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);

  if (!onArchiveSeason) return null;

  const today = new Date().toISOString().split('T')[0];
  const pastCount = (allEvents ?? []).filter(e => clubEventIds.some(id => String(id) === String(e.id)) && e.date < today).length;
  if (pastCount === 0 && !done) return null;

  async function handleArchive() {
    setLoading(true);
    try { await onArchiveSeason!(club.id); setDone(true); setConfirming(false); }
    catch (err: any) { console.error('[ArchiveSeason]', err.message); }
    finally { setLoading(false); }
  }

  const year = new Date().getFullYear();

  return (
    <div style={{ borderRadius: 'var(--sl-radius-2xl)', padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 10 }}>Saison {year - 1}–{year}</div>
      {done ? (
        <div style={{ fontSize: 13, color: '#22D96A', fontWeight: 600 }}>✓ Saison archivée — {pastCount} match{pastCount > 1 ? 's' : ''} archivé{pastCount > 1 ? 's' : ''}</div>
      ) : confirming ? (
        <div>
          <div style={{ fontSize: 12, color: 'var(--sl-t2)', marginBottom: 10, lineHeight: 1.5 }}>{pastCount} match{pastCount > 1 ? 's' : ''} passé{pastCount > 1 ? 's' : ''} sera{pastCount > 1 ? 'ont' : ''} archivé{pastCount > 1 ? 's' : ''} et masqué{pastCount > 1 ? 's' : ''} du feed. Cette action est irréversible depuis l'app.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setConfirming(false)} style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
            <button onClick={handleArchive} disabled={loading} style={{ flex: 1, padding: '9px 0', borderRadius: 'var(--sl-radius-lg)', border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: 12, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>{loading ? 'Archivage…' : 'Confirmer'}</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--sl-t2)' }}>{pastCount} match{pastCount > 1 ? 's' : ''} passé{pastCount > 1 ? 's' : ''} à archiver</div>
          <button onClick={() => setConfirming(true)} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗂 Clôturer la saison</button>
        </div>
      )}
    </div>
  );
}

const NOTIF_ITEMS = [
  { key: 'match_j1',         label: 'J-1 — rappel veille de match',   desc: "Créez l'affiche avant le match" },
  { key: 'match_today',      label: 'Jour J — rappel le matin',        desc: "C'est aujourd'hui, partagez !" },
  { key: 'post_match_score', label: 'Post-match — saisir le score',    desc: 'Publiez le résultat' },
];

function NotifPrefsSection({ clubId }: { clubId: string | number }) {
  const { kit, saving, save } = useClubBrandKit(String(clubId));
  const prefs = (kit?.admin_notif_prefs as Record<string, boolean> | undefined) ?? { match_j1: true, match_today: true, post_match_score: true };
  function toggle(key: string) { save({ admin_notif_prefs: { ...prefs, [key]: !prefs[key] } }); }

  return (
    <div style={{ borderRadius: 'var(--sl-radius-2xl)', padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 12 }}>Rappels push — Préférences</div>
      {NOTIF_ITEMS.map(({ key, label, desc }, idx) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: idx < NOTIF_ITEMS.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)' }}>{label}</div>
            <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>{desc}</div>
          </div>
          <button disabled={saving} onClick={() => toggle(key)} aria-label={prefs[key] ? 'Désactiver' : 'Activer'} style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 'var(--sl-radius-xl)', border: 'none', cursor: saving ? 'wait' : 'pointer', backgroundColor: prefs[key] ? '#22D96A' : 'var(--sl-border)', position: 'relative', transition: 'background-color 0.2s' }}>
            <div style={{ position: 'absolute', top: 2, left: prefs[key] ? 22 : 2, width: 20, height: 20, borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
          </button>
        </div>
      ))}
    </div>
  );
}

const CHALLENGE_TYPE_OPTS = [
  { key: 'match',      label: 'Match amical',   Icon: IconBall },
  { key: 'tournament', label: 'Tournoi',         Icon: IconTrophy },
  { key: 'training',   label: 'Entraînement',   Icon: IconRun },
];
const STATUS_META: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: '#f59e0b' },
  accepted:  { label: 'Accepté',     color: '#22d96a' },
  declined:  { label: 'Refusé',      color: '#ef4444' },
  cancelled: { label: 'Annulé',      color: 'var(--sl-t3)' },
};

function ChallengesSection({ club }: { club: Record<string, any> }) {
  const { challenges, received, sent, pendingReceived, loading, sendChallenge, respond } = useClubChallenges(club.id);
  const { userClubs } = useClubs();
  const otherClubs = (userClubs ?? []).filter((c: any) => String(c.id) !== String(club.id));

  const [showForm, setShowForm]           = useState(false);
  const [targetClubId, setTargetClubId]   = useState('');
  const [chalType, setChalType]           = useState('match');
  const [chalMsg, setChalMsg]             = useState('');
  const [sending, setSending]             = useState(false);
  const [respondingId, setRespondingId]   = useState<string | null>(null);
  const [tab, setTab]                     = useState('received');

  async function handleSend() {
    if (!targetClubId) return;
    setSending(true);
    try { await sendChallenge(targetClubId, chalType, chalMsg); setShowForm(false); setChalMsg(''); }
    catch { /* best-effort */ }
    finally { setSending(false); }
  }

  async function handleRespond(id: string, status: string) {
    setRespondingId(id);
    try { await respond(id, status); }
    catch { /* best-effort */ }
    finally { setRespondingId(null); }
  }

  const displayList: any[] = tab === 'received' ? received : sent;

  return (
    <div style={{ borderRadius: 'var(--sl-radius-2xl)', overflow: 'hidden', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)' }}>
            <IconTarget size={14} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Défis inter-clubs
            {pendingReceived.length > 0 && <span style={{ marginLeft: 6, backgroundColor: '#ef4444', color: '#fff', fontSize: 9, fontWeight: 800, borderRadius: 'var(--sl-radius-4xl)', padding: '1px 6px' }}>{pendingReceived.length}</span>}
          </div>
          <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>Lancez ou répondez à un défi sportif</div>
        </div>
        <button onClick={() => setShowForm(v => !v)} style={{ padding: '7px 12px', borderRadius: 'var(--sl-radius-lg)', border: 'none', backgroundColor: showForm ? 'var(--sl-surface)' : '#3b82f6', color: showForm ? 'var(--sl-t2)' : '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>{showForm ? 'Annuler' : '+ Défi'}</button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', borderBottom: '1px solid var(--sl-border)' }}>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <select value={targetClubId} onChange={e => setTargetClubId(e.target.value)} style={{ width: '100%', padding: '9px 11px', borderRadius: 'var(--sl-radius-lg)', fontSize: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none' }}>
                <option value="">Sélectionner un club à défier…</option>
                {otherClubs.map((c: any) => <option key={c.id} value={c.id}>{c.name} — {c.sport}</option>)}
              </select>
              <div style={{ display: 'flex', gap: 6 }}>
                {CHALLENGE_TYPE_OPTS.map(opt => (
                  <button key={opt.key} onClick={() => setChalType(opt.key)} style={{ flex: 1, padding: '8px 4px', borderRadius: 'var(--sl-radius-lg)', border: `1.5px solid ${chalType === opt.key ? '#3b82f6' : 'var(--sl-border)'}`, backgroundColor: chalType === opt.key ? 'rgba(59,130,246,0.1)' : 'var(--sl-surface)', color: chalType === opt.key ? '#3b82f6' : 'var(--sl-t2)', fontSize: 11, fontWeight: 700, cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}><opt.Icon size={14} color={chalType === opt.key ? '#3b82f6' : 'var(--sl-t2)'} /></div><div style={{ fontSize: 9, marginTop: 2 }}>{opt.label}</div>
                  </button>
                ))}
              </div>
              <input value={chalMsg} onChange={e => setChalMsg(e.target.value)} placeholder="Message optionnel (ex : match retour, terrain neutre…)" style={{ width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 'var(--sl-radius-lg)', fontSize: 12, border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', outline: 'none', fontFamily: 'var(--sl-font-ui)' }} />
              <button onClick={handleSend} disabled={!targetClubId || sending} style={{ padding: '11px', borderRadius: 'var(--sl-radius-lg)', border: 'none', backgroundColor: !targetClubId || sending ? 'var(--sl-surface)' : '#3b82f6', color: !targetClubId || sending ? 'var(--sl-t3)' : '#fff', fontSize: 12, fontWeight: 700, cursor: !targetClubId || sending ? 'default' : 'pointer' }}>
                {sending ? 'Envoi…' : <><IconTarget size={14} /> Lancer le défi</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {challenges.length > 0 && (
        <div style={{ display: 'flex', borderBottom: '1px solid var(--sl-border)' }}>
          {[['received', `Reçus (${received.length})`], ['sent', `Envoyés (${sent.length})`]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ flex: 1, padding: '9px', border: 'none', borderBottom: `2px solid ${tab === key ? '#3b82f6' : 'transparent'}`, backgroundColor: 'transparent', color: tab === key ? '#3b82f6' : 'var(--sl-t3)', fontSize: 11, fontWeight: tab === key ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
          ))}
        </div>
      )}

      <div style={{ padding: '8px 0' }}>
        {loading ? (
          <div style={{ padding: '12px 16px', fontSize: 11, color: 'var(--sl-t3)', textAlign: 'center' }}>Chargement…</div>
        ) : displayList.length === 0 ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: 11, color: 'var(--sl-t3)' }}>{tab === 'received' ? "Aucun défi reçu pour l'instant." : 'Aucun défi envoyé.'}</div>
        ) : displayList.map(ch => {
          const opponent = tab === 'received' ? ch.challenger : ch.challenged;
          const statusMeta = STATUS_META[ch.status] ?? STATUS_META.pending;
          const typeOpt = CHALLENGE_TYPE_OPTS.find(o => o.key === ch.type);
          return (
            <div key={ch.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>{typeOpt && <typeOpt.Icon size={12} />}{opponent?.name ?? '—'}</div>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{typeOpt?.label} · {new Date(ch.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                {ch.message && <div style={{ fontSize: 10, color: 'var(--sl-t2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ch.message}</div>}
              </div>
              {tab === 'received' && ch.status === 'pending' ? (
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button onClick={() => handleRespond(ch.id, 'accepted')} disabled={respondingId === ch.id} style={{ padding: '5px 10px', borderRadius: 'var(--sl-radius-md)', border: 'none', backgroundColor: 'rgba(34,217,106,0.15)', color: '#22d96a', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>✓ Oui</button>
                  <button onClick={() => handleRespond(ch.id, 'declined')} disabled={respondingId === ch.id} style={{ padding: '5px 10px', borderRadius: 'var(--sl-radius-md)', border: 'none', backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>✕ Non</button>
                </div>
              ) : (
                <span style={{ fontSize: 10, fontWeight: 700, color: statusMeta.color, flexShrink: 0 }}>{statusMeta.label}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ClubDashboardProps {
  club: Record<string, any>;
  clubEventIds: (string | number)[];
  allEvents?: Record<string, any>[];
  onClose: () => void;
  onArchiveSeason?: ((id: string | number) => Promise<void>) | null;
}

export default function ClubDashboard({ club, clubEventIds, allEvents, onClose, onArchiveSeason }: ClubDashboardProps) {
  const data        = useClubDashboard(String(club.id), clubEventIds as string[]);
  const convocStats = useConvocStats(club.id);
  const isEmpty     = !data.loading && data.followers === 0 && data.pageViews.total === 0 && data.attendees.total === 0 && data.posterExports === 0 && data.posterShares === 0;
  const [hasDemo, setHasDemo]           = useState(false);
  const [deletingDemo, setDeletingDemo] = useState(false);

  useEffect(() => { hasDemoData(club.id).then(setHasDemo).catch(() => {}); }, [club.id]);

  const clubUpcomingEvents = useMemo(() => (allEvents ?? []).filter(e => clubEventIds.some(id => String(id) === String(e.id))), [allEvents, clubEventIds]);

  return (
    <motion.div data-demo="admin-dashboard" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', stiffness: 340, damping: 36 }} style={{ position: 'absolute', inset: 0, zIndex: (Z as any).formModal, backgroundColor: 'var(--sl-bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0, backgroundColor: '#0F1E3A', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
        <button onClick={onClose} aria-label="Retour à la page du club" style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)', border: 'none', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Tableau de bord</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{club.name}</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' } as React.CSSProperties}>
        {data.loading ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--sl-t3)', fontSize: 13 }}>Chargement des statistiques…</div>
        ) : (
          <>
            {/* Inviter des joueurs — toujours visible */}
            <ClubInvitePanel clubId={String(club.id)} clubName={club.name} />

            {isEmpty && (
              <div style={{ borderRadius: 'var(--sl-radius-3xl)', padding: '16px', marginBottom: 4, backgroundColor: 'rgba(34,217,106,0.08)', border: '1px solid rgba(34,217,106,0.2)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-green)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}><IconRocket size={15} /> Votre club vient d'être créé !</p>
                <p style={{ fontSize: 12, color: 'var(--sl-t2)', margin: 0, lineHeight: 1.5 }}>Partagez la page de votre club, ajoutez des événements et invitez vos membres à s'abonner pour voir vos premières statistiques apparaître ici.</p>
              </div>
            )}
            {hasDemo && (
              <button onClick={async () => { setDeletingDemo(true); await deleteDemoData(club.id).catch(() => {}); setHasDemo(false); setDeletingDemo(false); }} disabled={deletingDemo} style={{ marginBottom: 4, padding: '10px 14px', borderRadius: 'var(--sl-radius-xl)', cursor: deletingDemo ? 'not-allowed' : 'pointer', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                {deletingDemo ? 'Suppression…' : 'Supprimer les données de démonstration'}
              </button>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <StatCard label="Abonnés" value={data.followers} sub="personnes suivent ce club" color="#3b82f6" />
              <StatCard label="Vues totales" value={data.pageViews.total} sub={`+${data.pageViews.weekly} cette semaine`} color="#f97316" />
              <StatCard label="J'y serai" value={data.attendees.total} sub="participations cumulées" color="#22d96a" />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StatCard label="Affiches ce mois" value={data.posterExports} sub="exports & partages" color="#a855f7" />
              <StatCard label="Partages sociaux" value={data.posterShares} sub="WhatsApp, Insta, Facebook" color="#06b6d4" />
            </div>

            {convocStats && convocStats.total > 0 && (
              <div style={{ borderRadius: 'var(--sl-radius-2xl)', padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 10 }}>Convocations — 30 derniers jours</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{convocStats.accepted}</div>
                    <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2 }}>Présents</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#ef4444' }}>{convocStats.declined}</div>
                    <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2 }}>Absents</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{convocStats.pending}</div>
                    <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2 }}>Sans réponse</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--sl-t1)' }}>{convocStats.total}</div>
                    <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 2 }}>Total envoyés</div>
                  </div>
                </div>
                {convocStats.total > 0 && (
                  <div style={{ marginTop: 10, height: 6, borderRadius: 'var(--sl-radius-full)', background: 'var(--sl-border)', overflow: 'hidden', display: 'flex' }}>
                    <div style={{ width: `${(convocStats.accepted / convocStats.total) * 100}%`, background: '#22c55e', borderRadius: '999px 0 0 999px', transition: 'width 0.4s' }} />
                    <div style={{ width: `${(convocStats.declined / convocStats.total) * 100}%`, background: '#ef4444' }} />
                    <div style={{ flex: 1, background: 'var(--sl-border-s)' }} />
                  </div>
                )}
              </div>
            )}

            <div style={{ borderRadius: 'var(--sl-radius-2xl)', padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)' }}>Vues de la page — 8 semaines</div>
                {data.pageViews.distinctViewers > 0 && <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{data.pageViews.distinctViewers} visiteur{data.pageViews.distinctViewers > 1 ? 's' : ''} identifié{data.pageViews.distinctViewers > 1 ? 's' : ''}</span>}
              </div>
              <BarChart data={data.pageViews.byWeek} />
            </div>

            {data.attendees.topEvents.length > 0 && (
              <div style={{ borderRadius: 'var(--sl-radius-2xl)', padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 10 }}>Top matchs — J'y serai</div>
                {data.attendees.topEvents.map((row: any, idx: number) => {
                  const ev = (allEvents ?? []).find(e => String(e.id) === String(row.event_id));
                  return (
                    <div key={row.event_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: idx < data.attendees.topEvents.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev?.title ?? row.event_id}</div>
                        {ev?.date && <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>{new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                      </div>
                      <div style={{ flexShrink: 0, textAlign: 'right' }}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#22d96a', fontVariantNumeric: 'tabular-nums' }}>{row.count}</div>
                        <div style={{ fontSize: 9, color: 'var(--sl-t3)' }}>J'y serai</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <TrainingsSection clubId={club.id} />
            <FeaturedSection club={club} upcomingEvents={clubUpcomingEvents} />
            <AnnouncementsSection club={club} />
            <ChallengesSection club={club} />
            <CalendrierEditorial upcomingEvents={clubUpcomingEvents} scheduledAnnouncements={data.scheduledAnnouncements} />
            <NotifPrefsSection clubId={club.id} />
            <ArchiveSeasonSection club={club} allEvents={allEvents} clubEventIds={clubEventIds} onArchiveSeason={onArchiveSeason} />
            <SubscriptionSection clubId={club.id} />

            {isEmpty && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--sl-t3)', fontSize: 13, lineHeight: 1.7 }}>
                <IconBarChart size={36} color="var(--sl-t3)" style={{ marginBottom: 12 }} />
                Aucune donnée pour l'instant.<br />
                Les statistiques s'alimenteront dès que des utilisateurs visiteront la page, suivront le club ou cliqueront sur "J'y serai".
              </div>
            )}

            <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '14px 16px', borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4, paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' } as React.CSSProperties}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              Retour à la page du club
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}

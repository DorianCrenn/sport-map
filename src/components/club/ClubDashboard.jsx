import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../../constants/zIndex.js';
import { useClubDashboard } from '../../hooks/useClubDashboard.js';
import { useClubBrandKit } from '../../hooks/useClubBrandKit.js';
import { useClubAnnouncements } from '../../hooks/useClubAnnouncements.js';
import { FeaturedSection } from './PromoteFeedModal.jsx';
import SendAnnouncementModal from './SendAnnouncementModal.jsx';

function StatCard({ label, value, sub, color = 'var(--sl-t1)' }) {
  return (
    <div style={{
      flex: 1, minWidth: 0, borderRadius: 14, padding: '14px 12px',
      backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--sl-t2)' }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...(data ?? []).map(d => d.count), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 64 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{
            width: '100%',
            backgroundColor: d.count > 0 ? '#3b82f6' : 'var(--sl-border)',
            borderRadius: '3px 3px 0 0',
            height: d.count > 0 ? `${Math.round((d.count / max) * 48) + 4}px` : '2px',
            transition: 'height 0.4s',
          }} />
          <div style={{ fontSize: 7, color: 'var(--sl-t3)', textAlign: 'center', lineHeight: 1, whiteSpace: 'nowrap' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

const ANN_TYPE_COLOR = { urgent: '#ef4444', result: '#22C55E', event: '#3b82f6', info: '#f59e0b' };
const ANN_TYPE_LABEL = { urgent: 'Urgent', result: 'Résultat', event: 'Événement', info: 'Info' };

function CalendrierEditorial({ upcomingEvents, scheduledAnnouncements }) {
  const now = new Date();
  const future30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const evItems = (upcomingEvents ?? [])
    .filter(ev => {
      const d = new Date(ev.date + 'T' + (ev.time ?? '23:59'));
      return d >= now && d <= future30;
    })
    .map(ev => ({
      type: 'event',
      dt: new Date(ev.date + 'T' + (ev.time ?? '12:00')),
      label: ev.homeTeam && ev.awayTeam ? `${ev.homeTeam} vs ${ev.awayTeam}` : (ev.title ?? 'Match'),
      sub: ev.venue ?? '',
    }));

  const annItems = (scheduledAnnouncements ?? []).map(a => ({
    type: 'announcement',
    dt: new Date(a.scheduled_for),
    annType: a.type,
    label: a.title || a.message?.slice(0, 50) || 'Annonce',
    sub: '',
  }));

  const items = [...evItems, ...annItems].sort((a, b) => a.dt - b.dt);

  if (items.length === 0) return null;

  return (
    <div style={{ borderRadius: 14, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 12 }}>
        Calendrier éditorial — 30 jours
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {items.map((item, idx) => {
          const day = item.dt.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
          const time = item.dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const isEvent = item.type === 'event';
          const dotColor = isEvent ? '#3b82f6' : (ANN_TYPE_COLOR[item.annType] ?? '#f59e0b');
          return (
            <div key={idx} style={{ display: 'flex', gap: 10, padding: '9px 0', borderBottom: idx < items.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dotColor, marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 10, backgroundColor: `${dotColor}18`, color: dotColor, flexShrink: 0 }}>
                    {isEvent ? 'Match' : (ANN_TYPE_LABEL[item.annType] ?? 'Annonce')}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>
                  {day} {isEvent ? `à ${time}` : `— envoi à ${time}`}
                  {item.sub ? ` · ${item.sub}` : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ANN_ICON = { urgent: '🚨', result: '⚽', event: '🎉', info: 'ℹ️' };

function AnnouncementsSection({ club }) {
  const { announcements, loading, sendAnnouncement, deleteAnnouncement } = useClubAnnouncements(club.id);
  const [showModal, setShowModal]       = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [confirmId, setConfirmId]       = useState(null);
  const [success, setSuccess]           = useState(false);

  const published = announcements.filter(a => !a.scheduledFor || new Date(a.scheduledFor) <= new Date());

  async function handleSend({ type, title, message, targetTeams, scheduledFor }) {
    await sendAnnouncement({ type, title, message, targetTeams, clubName: club.name, scheduledFor });
    setShowModal(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  }

  async function handleDelete(id) {
    setDeletingId(id);
    await deleteAnnouncement(id);
    setDeletingId(null);
    setConfirmId(null);
  }

  function fmtAgo(iso) {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'à l\'instant';
    if (h < 24) return `il y a ${h}h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `il y a ${d}j`;
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  return (
    <div style={{ borderRadius: 14, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)' }}>
            📢 Flash Info
          </div>
          <div style={{ fontSize: 12, color: 'var(--sl-t2)', marginTop: 2 }}>
            {loading ? 'Chargement…' : published.length === 0 ? 'Aucune annonce publiée' : `${published.length} publiée${published.length > 1 ? 's' : ''}`}
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '7px 12px', borderRadius: 10, border: 'none', cursor: 'pointer',
            backgroundColor: '#3b82f6', color: 'white', fontSize: 12, fontWeight: 700,
          }}
        >
          + Nouvelle
        </button>
      </div>

      {/* List */}
      {!loading && published.length > 0 && (
        <div style={{ borderTop: '1px solid var(--sl-border)' }}>
          {published.slice(0, 8).map((ann, idx) => {
            const color = ANN_TYPE_COLOR[ann.type] ?? '#f59e0b';
            const isConfirming = confirmId === ann.id;
            return (
              <div key={ann.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 16px',
                borderBottom: idx < Math.min(published.length, 8) - 1 ? '1px solid var(--sl-border)' : 'none',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: color, flexShrink: 0, marginTop: 5,
                  boxShadow: `0 0 5px ${color}80`,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, backgroundColor: `${color}18`, color }}>
                      {ANN_ICON[ann.type]} {ANN_TYPE_LABEL[ann.type] ?? ann.type}
                    </span>
                    <span style={{ fontSize: 9, color: 'var(--sl-t3)' }}>{fmtAgo(ann.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ann.message}
                  </div>
                </div>
                {isConfirming ? (
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => setConfirmId(null)}
                      style={{ padding: '4px 8px', borderRadius: 7, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', fontSize: 10, cursor: 'pointer' }}
                    >
                      Non
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      disabled={deletingId === ann.id}
                      style={{ padding: '4px 8px', borderRadius: 7, border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, cursor: deletingId === ann.id ? 'wait' : 'pointer' }}
                    >
                      {deletingId === ann.id ? '…' : 'Supprimer'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmId(ann.id)}
                    style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Succès */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ padding: '10px 16px', backgroundColor: 'rgba(59,130,246,0.08)', borderTop: '1px solid var(--sl-border)' }}
          >
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6' }}>
              ✓ Annonce publiée — visible dans le fil d'actualité.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal création */}
      {showModal && (
        <SendAnnouncementModal
          club={club}
          onSend={handleSend}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function ArchiveSeasonSection({ club, allEvents, clubEventIds, onArchiveSeason }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!onArchiveSeason) return null;

  const today = new Date().toISOString().split('T')[0];
  const pastCount = (allEvents ?? []).filter(e =>
    clubEventIds.some(id => String(id) === String(e.id)) && e.date < today
  ).length;

  if (pastCount === 0 && !done) return null;

  async function handleArchive() {
    setLoading(true);
    try {
      await onArchiveSeason(club.id);
      setDone(true);
      setConfirming(false);
    } catch (err) {
      console.error('[ArchiveSeason]', err.message);
    } finally {
      setLoading(false);
    }
  }

  const year = new Date().getFullYear();

  return (
    <div style={{ borderRadius: 14, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 10 }}>
        Saison {year - 1}–{year}
      </div>
      {done ? (
        <div style={{ fontSize: 13, color: '#22D96A', fontWeight: 600 }}>
          ✓ Saison archivée — {pastCount} match{pastCount > 1 ? 's' : ''} archivé{pastCount > 1 ? 's' : ''}
        </div>
      ) : confirming ? (
        <div>
          <div style={{ fontSize: 12, color: 'var(--sl-t2)', marginBottom: 10, lineHeight: 1.5 }}>
            {pastCount} match{pastCount > 1 ? 's' : ''} passé{pastCount > 1 ? 's' : ''} sera{pastCount > 1 ? 'ont' : ''} archivé{pastCount > 1 ? 's' : ''} et masqué{pastCount > 1 ? 's' : ''} du feed. Cette action est irréversible depuis l'app.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setConfirming(false)}
              style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              Annuler
            </button>
            <button
              onClick={handleArchive}
              disabled={loading}
              style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', backgroundColor: '#ef4444', color: 'white', fontSize: 12, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Archivage…' : 'Confirmer'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ fontSize: 12, color: 'var(--sl-t2)' }}>
            {pastCount} match{pastCount > 1 ? 's' : ''} passé{pastCount > 1 ? 's' : ''} à archiver
          </div>
          <button
            onClick={() => setConfirming(true)}
            style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 10, border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            🗂 Clôturer la saison
          </button>
        </div>
      )}
    </div>
  );
}

const NOTIF_ITEMS = [
  { key: 'match_j1',         label: 'J-1 — rappel veille de match',   desc: 'Créez l\'affiche avant le match' },
  { key: 'match_today',      label: 'Jour J — rappel le matin',        desc: 'C\'est aujourd\'hui, partagez !' },
  { key: 'post_match_score', label: 'Post-match — saisir le score',    desc: 'Publiez le résultat' },
];

function NotifPrefsSection({ clubId }) {
  const { kit, saving, save } = useClubBrandKit(clubId);
  const prefs = kit?.admin_notif_prefs ?? { match_j1: true, match_today: true, post_match_score: true };

  function toggle(key) {
    save({ admin_notif_prefs: { ...prefs, [key]: !prefs[key] } });
  }

  return (
    <div style={{ borderRadius: 14, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 12 }}>
        Rappels push — Préférences
      </div>
      {NOTIF_ITEMS.map(({ key, label, desc }, idx) => (
        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: idx < NOTIF_ITEMS.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)' }}>{label}</div>
            <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>{desc}</div>
          </div>
          <button
            disabled={saving}
            onClick={() => toggle(key)}
            aria-label={prefs[key] ? 'Désactiver' : 'Activer'}
            style={{
              flexShrink: 0, width: 44, height: 24, borderRadius: 12, border: 'none',
              cursor: saving ? 'wait' : 'pointer',
              backgroundColor: prefs[key] ? '#22D96A' : 'var(--sl-border)',
              position: 'relative', transition: 'background-color 0.2s',
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: prefs[key] ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%', backgroundColor: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            }} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function ClubDashboard({ club, clubEventIds, allEvents, onClose, onArchiveSeason }) {
  const data = useClubDashboard(club.id, clubEventIds);
  const isEmpty = !data.loading && data.followers === 0 && data.pageViews.total === 0 && data.attendees.total === 0 && data.posterExports === 0 && data.posterShares === 0;

  const clubUpcomingEvents = (allEvents ?? []).filter(e =>
    clubEventIds.some(id => String(id) === String(e.id))
  );

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      style={{
        position: 'absolute', inset: 0, zIndex: Z.formModal,
        backgroundColor: 'var(--sl-bg)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{ flexShrink: 0, backgroundColor: '#0F1E3A', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, color: 'white' }}>
        <button
          onClick={onClose}
          aria-label="Retour à la page du club"
          style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Tableau de bord</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{club.name}</div>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14, WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        {data.loading ? (
          <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--sl-t3)', fontSize: 13 }}>
            Chargement des statistiques…
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div style={{ display: 'flex', gap: 8 }}>
              <StatCard
                label="Abonnés"
                value={data.followers}
                sub="personnes suivent ce club"
                color="#3b82f6"
              />
              <StatCard
                label="Vues totales"
                value={data.pageViews.total}
                sub={`+${data.pageViews.weekly} cette semaine`}
                color="#f97316"
              />
              <StatCard
                label="J'y serai"
                value={data.attendees.total}
                sub="participations cumulées"
                color="#22d96a"
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <StatCard
                label="Affiches ce mois"
                value={data.posterExports}
                sub="exports & partages"
                color="#a855f7"
              />
              <StatCard
                label="Partages sociaux"
                value={data.posterShares}
                sub="WhatsApp, Insta, Facebook"
                color="#06b6d4"
              />
            </div>

            {/* Page views chart */}
            <div style={{ borderRadius: 14, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)' }}>
                  Vues de la page — 8 semaines
                </div>
                {data.pageViews.distinctViewers > 0 && (
                  <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>
                    {data.pageViews.distinctViewers} visiteur{data.pageViews.distinctViewers > 1 ? 's' : ''} identifié{data.pageViews.distinctViewers > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <BarChart data={data.pageViews.byWeek} />
            </div>

            {/* Top events by attendees */}
            {data.attendees.topEvents.length > 0 && (
              <div style={{ borderRadius: 14, padding: '14px 16px', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--sl-t3)', marginBottom: 10 }}>
                  Top matchs — J'y serai
                </div>
                {data.attendees.topEvents.map((row, idx) => {
                  const ev = (allEvents ?? []).find(e => String(e.id) === String(row.event_id));
                  return (
                    <div key={row.event_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: idx < data.attendees.topEvents.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
                      <span style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {idx + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ev?.title ?? row.event_id}
                        </div>
                        {ev?.date && (
                          <div style={{ fontSize: 10, color: 'var(--sl-t3)' }}>
                            {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
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

            <FeaturedSection
              club={club}
              upcomingEvents={clubUpcomingEvents}
            />

            <AnnouncementsSection club={club} />

            <CalendrierEditorial
              upcomingEvents={clubUpcomingEvents}
              scheduledAnnouncements={data.scheduledAnnouncements}
            />

            <NotifPrefsSection clubId={club.id} />

            <ArchiveSeasonSection
              club={club}
              allEvents={allEvents}
              clubEventIds={clubEventIds}
              onArchiveSeason={onArchiveSeason}
            />

            {isEmpty && (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--sl-t3)', fontSize: 13, lineHeight: 1.7 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
                Aucune donnée pour l'instant.<br />
                Les statistiques s'alimenteront dès que des utilisateurs visiteront la page, suivront le club ou cliqueront sur "J'y serai".
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

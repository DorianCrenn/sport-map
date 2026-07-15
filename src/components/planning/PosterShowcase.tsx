import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecentPosters, templateLabel, formatLabel } from '../../hooks/useRecentPosters.js';

// ── Sport colors (subset used in recent-posters tab) ─────────────────────────
const SPORT_COLORS: Record<string, string> = {
  Football: '#22d96a', Handball: '#f97316', Basketball: '#f59e0b',
  Rugby: '#8b5cf6', Volleyball: '#3b82f6', Tennis: '#ec4899',
  'Trail / Running': '#06b6d4', Cyclisme: '#f97316', Natation: '#0ea5e9',
  default: '#64748b',
};
function sportColor(s: string) { return SPORT_COLORS[s] ?? SPORT_COLORS.default; }

function relativeDate(iso: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7)  return `Il y a ${days} j`;
  if (days < 30) return `Il y a ${Math.floor(days / 7)} sem.`;
  return `Il y a ${Math.floor(days / 30)} mois`;
}

// ── Onglet 1 : mini-posters CSS ───────────────────────────────────────────────
const EXAMPLES = [
  {
    type: 'Match',
    gradient: 'linear-gradient(160deg, #0a1628 0%, #0d2847 60%, #0a3d1e 100%)',
    accent: '#22d96a',
    sport: '⚽',
    line1: 'FC Brest',
    line2: 'vs',
    line3: 'Stade Rouzig',
    meta: 'Sam. 15h · Brest',
  },
  {
    type: 'Tournoi',
    gradient: 'linear-gradient(160deg, #1a0a00 0%, #3d1a00 60%, #1a0a28 100%)',
    accent: '#f97316',
    sport: '🏆',
    line1: 'COUPE DE',
    line2: 'FINISTÈRE',
    line3: '8 équipes',
    meta: 'Dim. 29 juin · 9h',
  },
  {
    type: 'Résultat',
    gradient: 'linear-gradient(160deg, #051a0a 0%, #0a3d1e 50%, #0a1628 100%)',
    accent: '#22d96a',
    sport: '🎉',
    line1: '3 — 1',
    line2: 'VICTOIRE',
    line3: 'FC Brest',
    meta: 'Man of the match : A. Kervella',
  },
];

function MiniPosterCard({ ex }: { ex: typeof EXAMPLES[0] }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      style={{
        width: 110, flexShrink: 0, borderRadius: 'var(--sl-radius-2xl)',
        background: ex.gradient,
        border: `1px solid ${ex.accent}33`,
        boxShadow: `0 4px 20px ${ex.accent}22`,
        padding: '12px 10px 10px',
        display: 'flex', flexDirection: 'column', gap: 4,
        cursor: 'default',
      }}
    >
      {/* Type badge */}
      <span style={{ fontSize: 9, fontWeight: 800, color: ex.accent, letterSpacing: 1, textTransform: 'uppercase' }}>
        {ex.type}
      </span>

      {/* Sport emoji */}
      <div style={{ fontSize: 22, margin: '4px 0' }}>{ex.sport}</div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: `${ex.accent}44`, margin: '2px 0' }} />

      {/* Main text */}
      <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1.2, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
        {ex.line1}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: `${ex.accent}cc` }}>
        {ex.line2}
      </div>
      <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1.2, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
        {ex.line3}
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: `${ex.accent}33`, margin: '4px 0' }} />

      {/* Meta */}
      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{ex.meta}</div>

      {/* Watermark */}
      <div style={{ marginTop: 'auto', paddingTop: 6, fontSize: 7, color: `${ex.accent}88`, fontWeight: 700 }}>
        SportLink ✦
      </div>
    </motion.div>
  );
}

function ExamplesTab({ onOpenPoster }: { onOpenPoster?: () => void }) {
  return (
    <div>
      <p className="text-xs text-[var(--sl-t3)] mb-3 px-1">
        Créez des affiches pro pour vos matchs en quelques secondes.
      </p>
      {/* Horizontal scroll */}
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}
           className="no-scrollbar">
        {EXAMPLES.map(ex => <MiniPosterCard key={ex.type} ex={ex} />)}
      </div>
      {onOpenPoster && (
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onOpenPoster}
          className="w-full mt-4 py-3 rounded-2xl text-sm font-bold text-white cursor-pointer"
          style={{ background: 'linear-gradient(90deg, #22d96a, #16a34a)', border: 'none', boxShadow: '0 4px 16px rgba(34,217,106,0.3)' }}
        >
          🎨 Créer une affiche
        </motion.button>
      )}
    </div>
  );
}

// ── Onglet 2 : dernières affiches Supabase ────────────────────────────────────
function RecentCard({ poster }: { poster: ReturnType<typeof useRecentPosters>['posters'][0] }) {
  const color = sportColor(poster.sport);
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 'var(--sl-radius-2xl)',
        backgroundColor: 'var(--sl-card)',
        border: '1px solid var(--sl-border)',
      }}
    >
      {/* Color dot */}
      <div style={{
        width: 40, height: 40, borderRadius: 'var(--sl-radius-lg)', flexShrink: 0,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>
        🎨
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {poster.club_name}
        </div>
        <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>
          {[poster.sport, templateLabel(poster.template_id), formatLabel(poster.format)]
            .filter(Boolean).join(' · ')}
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--sl-t3)', flexShrink: 0 }}>
        {relativeDate(poster.created_at)}
      </div>
    </motion.div>
  );
}

function RecentTab({ onOpenPoster }: { onOpenPoster?: () => void }) {
  const { posters, loading } = useRecentPosters(5);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-2xl animate-pulse bg-[var(--sl-surface)]" />)}
      </div>
    );
  }

  if (posters.length === 0) {
    return (
      <div className="text-center py-6">
        <div style={{ fontSize: 32, marginBottom: 8 }}>🖼️</div>
        <p className="text-sm font-bold text-[var(--sl-t2)] mb-1">Pas encore d'affiche</p>
        <p className="text-xs text-[var(--sl-t3)] mb-4">Soyez le premier à en créer une !</p>
        {onOpenPoster && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onOpenPoster}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer"
            style={{ background: '#22d96a', border: 'none' }}
          >
            Créer la première affiche
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posters.map(p => <RecentCard key={p.key} poster={p} />)}
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
interface PosterShowcaseProps {
  onOpenPoster?: () => void;
}

export default function PosterShowcase({ onOpenPoster }: PosterShowcaseProps) {
  const [tab, setTab] = useState<'examples' | 'recent'>('examples');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="pt-2"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span style={{ fontSize: 18 }}>🎨</span>
        <p className="text-sm font-bold text-[var(--sl-t1)]">Affiches SportLink</p>
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-2xl p-1 mb-4"
           style={{ backgroundColor: 'var(--sl-surface)' }}>
        {([['examples', 'Exemples'], ['recent', 'Dernières créées']] as const).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer"
            style={tab === id
              ? { backgroundColor: '#22d96a', color: '#fff', boxShadow: '0 2px 8px rgba(34,217,106,0.35)', border: 'none' }
              : { backgroundColor: 'transparent', color: 'var(--sl-t3)', border: 'none' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, x: tab === 'examples' ? -10 : 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'examples'
            ? <ExamplesTab onOpenPoster={onOpenPoster} />
            : <RecentTab   onOpenPoster={onOpenPoster} />}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

import { motion } from 'framer-motion';

// Mini-poster CSS cards — données statiques
const CARDS = [
  {
    key: 'match',
    gradient: 'linear-gradient(150deg, #0a1628 0%, #0d2847 55%, #0a3d1e 100%)',
    accent: '#22d96a',
    sport: '⚽',
    label: 'MATCH',
    title: 'FC Brest',
    sub: 'vs Rouzig',
    meta: 'Sam. 15h',
  },
  {
    key: 'tournoi',
    gradient: 'linear-gradient(150deg, #1a0a00 0%, #3d1a00 55%, #1a0a28 100%)',
    accent: '#f97316',
    sport: '🏆',
    label: 'TOURNOI',
    title: 'COUPE',
    sub: 'Finistère',
    meta: '8 équipes',
  },
  {
    key: 'result',
    gradient: 'linear-gradient(150deg, #051a0a 0%, #0a3d1e 50%, #0a1628 100%)',
    accent: '#22d96a',
    sport: '🎉',
    label: 'RÉSULTAT',
    title: '3 — 1',
    sub: 'Victoire !',
    meta: 'Man of the match',
  },
];

interface PosterFeatureStripProps {
  onOpen?: () => void;
}

export default function PosterFeatureStrip({ onOpen }: PosterFeatureStripProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{ padding: '12px 16px 8px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15 }}>🎨</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)' }}>Studio d'affiches</span>
        </div>
        {onOpen && (
          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={onOpen}
            style={{
              fontSize: 12, fontWeight: 700, color: '#22d96a',
              background: 'rgba(34,217,106,0.1)', border: '1px solid rgba(34,217,106,0.25)',
              borderRadius: 10, padding: '5px 12px', cursor: 'pointer',
            }}
          >
            Créer →
          </motion.button>
        )}
      </div>

      {/* Mini-posters horizontal scroll */}
      <div
        className="no-scrollbar"
        style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}
      >
        {CARDS.map(card => (
          <motion.div
            key={card.key}
            whileTap={{ scale: 0.96 }}
            onClick={onOpen}
            style={{
              width: 100, flexShrink: 0, borderRadius: 12,
              background: card.gradient,
              border: `1px solid ${card.accent}33`,
              padding: '10px 9px 8px',
              display: 'flex', flexDirection: 'column', gap: 3,
              cursor: onOpen ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 8, fontWeight: 800, color: card.accent, letterSpacing: 1, textTransform: 'uppercase' }}>
              {card.label}
            </span>
            <div style={{ fontSize: 18, margin: '2px 0' }}>{card.sport}</div>
            <div style={{ height: 1, background: `${card.accent}44`, margin: '1px 0' }} />
            <div style={{ fontSize: 10, fontWeight: 900, color: '#fff', lineHeight: 1.2, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
              {card.title}
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: `${card.accent}bb` }}>
              {card.sub}
            </div>
            <div style={{ height: 1, background: `${card.accent}22`, margin: '2px 0' }} />
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.45)' }}>{card.meta}</div>
          </motion.div>
        ))}

        {/* Card CTA */}
        {onOpen && (
          <motion.div
            whileTap={{ scale: 0.96 }}
            onClick={onOpen}
            style={{
              width: 80, flexShrink: 0, borderRadius: 12,
              border: '1.5px dashed rgba(34,217,106,0.35)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 6, cursor: 'pointer',
              padding: '10px 8px',
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'rgba(34,217,106,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14,
            }}>
              +
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#22d96a', textAlign: 'center', lineHeight: 1.3 }}>
              Créer la mienne
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

import { motion } from 'framer-motion';

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
      transition={{ duration: 0.3, delay: 0.05 }}
      data-demo="poster-feature-strip"
      style={{
        margin: '8px 12px 4px',
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(34,217,106,0.07) 0%, rgba(10,22,40,0.06) 100%)',
        border: '1px solid rgba(34,217,106,0.18)',
        padding: '14px 14px 12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'rgba(34,217,106,0.15)',
            border: '1px solid rgba(34,217,106,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, flexShrink: 0,
          }}>
            🎨
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--sl-t1)', lineHeight: 1.2 }}>Studio d'affiches</div>
            <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>Créez vos affiches de match en quelques taps</div>
          </div>
        </div>
        {onOpen && (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={onOpen}
            style={{
              fontSize: 12, fontWeight: 700, color: '#fff',
              background: '#22d96a',
              border: 'none', borderRadius: 10,
              padding: '7px 13px', cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 2px 8px rgba(34,217,106,0.35)',
            }}
          >
            Créer
          </motion.button>
        )}
      </div>

      {/* Mini-posters */}
      <div
        className="no-scrollbar"
        style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}
      >
        {CARDS.map(card => (
          <motion.div
            key={card.key}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onOpen}
            style={{
              width: 108, flexShrink: 0, borderRadius: 13,
              background: card.gradient,
              border: `1.5px solid ${card.accent}40`,
              boxShadow: `0 3px 14px ${card.accent}18`,
              padding: '11px 10px 9px',
              display: 'flex', flexDirection: 'column', gap: 4,
              cursor: onOpen ? 'pointer' : 'default',
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 800, color: card.accent, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {card.label}
            </span>
            <div style={{ fontSize: 20, margin: '2px 0' }}>{card.sport}</div>
            <div style={{ height: 1, background: `${card.accent}50`, margin: '1px 0' }} />
            <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', lineHeight: 1.2, fontFamily: "'Barlow Condensed', sans-serif", textTransform: 'uppercase' }}>
              {card.title}
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: `${card.accent}dd` }}>
              {card.sub}
            </div>
            <div style={{ height: 1, background: `${card.accent}25`, margin: '2px 0' }} />
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)' }}>{card.meta}</div>
          </motion.div>
        ))}

        {onOpen && (
          <motion.div
            whileTap={{ scale: 0.96 }}
            onClick={onOpen}
            style={{
              width: 84, flexShrink: 0, borderRadius: 13,
              border: '1.5px dashed rgba(34,217,106,0.4)',
              background: 'rgba(34,217,106,0.04)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 7, cursor: 'pointer',
              padding: '10px 8px',
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 9,
              background: 'rgba(34,217,106,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, color: '#22d96a',
            }}>
              +
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#22d96a', textAlign: 'center', lineHeight: 1.3 }}>
              La mienne
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

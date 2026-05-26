import { memo } from 'react';
import { BG_PRESETS } from './posterBgLibrary.jsx';
import { ELEMENT_LIBRARY } from './posterElements.jsx';
import TplSimple from './templates/TplSimple.jsx';
import TplLight from './templates/TplLight.jsx';
import TplColor from './templates/TplColor.jsx';
import TplElegant from './templates/TplElegant.jsx';
import TplPrestige from './templates/TplPrestige.jsx';
import TplEditorial from './templates/TplEditorial.jsx';
import TplImpact from './templates/TplImpact.jsx';
import TplLuxe from './templates/TplLuxe.jsx';
import TplBlanc from './templates/TplBlanc.jsx';
import TplMagazine from './templates/TplMagazine.jsx';
import TplNeon from './templates/TplNeon.jsx';
import TplFluo from './templates/TplFluo.jsx';
import TplCinema from './templates/TplCinema.jsx';
import TplRetro from './templates/TplRetro.jsx';
import TplVivid from './templates/TplVivid.jsx';
import TplBento from './templates/TplBento.jsx';
import TplPulse from './templates/TplPulse.jsx';
import TplStrike from './templates/TplStrike.jsx';
import TplGlass from './templates/TplGlass.jsx';
import TplFlag from './templates/TplFlag.jsx';
import TplInk from './templates/TplInk.jsx';
import TplAurora from './templates/TplAurora.jsx';
import TplTrPremium from './templates/TplTrPremium.jsx';
import TplTrNeon from './templates/TplTrNeon.jsx';
import TplTrMinimal from './templates/TplTrMinimal.jsx';
import TplTrStreet from './templates/TplTrStreet.jsx';
import TplTrEsport from './templates/TplTrEsport.jsx';
import TplTrCinema from './templates/TplTrCinema.jsx';
import TplTrCoupe from './templates/TplTrCoupe.jsx';
import TplTrSummer from './templates/TplTrSummer.jsx';
import TplTrGlass from './templates/TplTrGlass.jsx';
import TplTrGradient from './templates/TplTrGradient.jsx';
import TplTrChampion from './templates/TplTrChampion.jsx';
import TplTrField from './templates/TplTrField.jsx';
import TplTrDynamic from './templates/TplTrDynamic.jsx';

export const POSTER_TEMPLATES = [
  {
    id: 'simple',
    label: 'Classique',
    desc: 'Sombre · Épuré · Gratuit',
    icon: '◻',
    color: '#3b82f6',
    Component: TplSimple,
  },
  {
    id: 'light',
    label: 'Light',
    desc: 'Clair · Éditorial · Gratuit',
    icon: '◽',
    color: '#E05C2A',
    Component: TplLight,
  },
  {
    id: 'color',
    label: 'Color',
    desc: 'Coloré · Dynamique · Gratuit',
    icon: '◼',
    color: '#22D96A',
    Component: TplColor,
  },
  {
    id: 'editorial',
    label: 'Éditorial',
    desc: 'Navy · Or · Élégant',
    icon: '◆',
    color: '#D4AF37',
    isPremium: true,
    Component: TplEditorial,
  },
  {
    id: 'impact',
    label: 'Impact',
    desc: 'Noir · Dynamique · Bold',
    icon: '⚡',
    color: '#22D96A',
    isPremium: true,
    Component: TplImpact,
  },
  {
    id: 'luxe',
    label: 'Luxe',
    desc: 'Noir · Or · Premium',
    icon: '◈',
    color: '#D4AF37',
    isPremium: true,
    Component: TplLuxe,
  },
  {
    id: 'blanc',
    label: 'Blanc',
    desc: 'Crème · Éditorial · Clair',
    icon: '○',
    color: '#B38B59',
    isPremium: true,
    Component: TplBlanc,
  },
  {
    id: 'elegant',
    label: 'Élégant',
    desc: 'Crème · Serif · Raffiné',
    icon: '◇',
    color: '#C4922A',
    isPremium: true,
    Component: TplElegant,
  },
  {
    id: 'magazine',
    label: 'Magazine',
    desc: 'Sombre · Typo Forte · Éditorial',
    icon: '▣',
    color: '#C41E3A',
    isPremium: true,
    Component: TplMagazine,
  },
  {
    id: 'neon',
    label: 'Neon',
    desc: 'Sombre · Glow · Futuriste',
    icon: '◉',
    color: '#00F5FF',
    isPremium: true,
    Component: TplNeon,
  },
  {
    id: 'fluo',
    label: 'Fluo',
    desc: 'Jaune vif · Minimal · Swiss',
    icon: '◐',
    color: '#EDFF3A',
    isPremium: true,
    Component: TplFluo,
  },
  {
    id: 'cinema',
    label: 'Cinéma',
    desc: 'Noir · Letterbox · Cinématique',
    icon: '▬',
    color: '#D4B896',
    isPremium: true,
    Component: TplCinema,
  },
  {
    id: 'retro',
    label: 'Rétro',
    desc: 'Sombre · Vintage · Orné',
    icon: '✦',
    color: '#D4A017',
    isPremium: true,
    Component: TplRetro,
  },
  {
    id: 'vivid',
    label: 'Vivid',
    desc: 'Sombre · Coloré · Dynamique',
    icon: '◆',
    color: '#7C3AED',
    isPremium: true,
    Component: TplVivid,
  },
  {
    id: 'bento',
    label: 'Bento',
    desc: 'Clair · Cartes · Moderne',
    icon: '⊟',
    color: '#2563EB',
    isPremium: true,
    Component: TplBento,
  },
  {
    id: 'prestige',
    label: 'Prestige',
    desc: 'Navy · Or · Serif · Luxe',
    icon: '◈',
    color: '#C8A96E',
    isPremium: true,
    Component: TplPrestige,
  },
  {
    id: 'pulse',
    label: 'Pulse',
    desc: 'Sombre · Cercles · Énergie',
    icon: '◎',
    color: '#10B981',
    isPremium: true,
    Component: TplPulse,
  },
  {
    id: 'strike',
    label: 'Strike',
    desc: 'Rayures · Athletic · Dynamique',
    icon: '⚡',
    color: '#22D96A',
    isPremium: true,
    Component: TplStrike,
  },
  {
    id: 'glass',
    label: 'Glass',
    desc: 'Sombre · Glassmorphisme · Premium',
    icon: '◻',
    color: '#6366f1',
    isPremium: true,
    Component: TplGlass,
  },
  {
    id: 'flag',
    label: 'Flag',
    desc: 'Split · Couleurs · Équipes',
    icon: '⚑',
    color: '#ef4444',
    isPremium: true,
    Component: TplFlag,
  },
  {
    id: 'ink',
    label: 'Ink',
    desc: 'Crème · Tampon · Imprimé',
    icon: '✒',
    color: '#111111',
    isPremium: true,
    Component: TplInk,
  },
  {
    id: 'aurora',
    label: 'Aurora',
    desc: 'Sombre · Lueurs · Futuriste',
    icon: '✦',
    color: '#10B981',
    isPremium: true,
    Component: TplAurora,
  },
  // ── Tournoi ──────────────────────────────────────────────────────────────────
  {
    id: 'tr-premium',
    label: 'Premium',
    desc: 'Noir · Or · Champions League',
    icon: '🏆',
    color: '#C9A84C',
    isTournament: true,
    Component: TplTrPremium,
  },
  {
    id: 'tr-neon',
    label: 'Neon',
    desc: 'Futuriste · Glow · Esport',
    icon: '◉',
    color: '#00E5FF',
    isTournament: true,
    Component: TplTrNeon,
  },
  {
    id: 'tr-minimal',
    label: 'Minimal',
    desc: 'Blanc · Swiss · Épuré',
    icon: '○',
    color: '#111111',
    isTournament: true,
    Component: TplTrMinimal,
  },
  {
    id: 'tr-street',
    label: 'Street',
    desc: 'Urban · Bold · Dynamique',
    icon: '⚡',
    color: '#FF6B00',
    isTournament: true,
    Component: TplTrStreet,
  },
  {
    id: 'tr-esport',
    label: 'Esport',
    desc: 'Gaming · HUD · Tech',
    icon: '◈',
    color: '#7C3AED',
    isTournament: true,
    Component: TplTrEsport,
  },
  {
    id: 'tr-cinema',
    label: 'Cinéma',
    desc: 'Letterbox · Epic · Cinématique',
    icon: '▬',
    color: '#F5E6C8',
    isTournament: true,
    Component: TplTrCinema,
  },
  {
    id: 'tr-coupe',
    label: 'Coupe',
    desc: 'Officiel · Navy · Prestige',
    icon: '✦',
    color: '#C0A060',
    isTournament: true,
    Component: TplTrCoupe,
  },
  {
    id: 'tr-summer',
    label: 'Summer',
    desc: 'Chaud · Festival · Vibrant',
    icon: '☀',
    color: '#FF8C42',
    isTournament: true,
    Component: TplTrSummer,
  },
  {
    id: 'tr-glass',
    label: 'Glass',
    desc: 'Glassmorphisme · Sombre · Premium',
    icon: '◻',
    color: '#6366F1',
    isTournament: true,
    Component: TplTrGlass,
  },
  {
    id: 'tr-gradient',
    label: 'Gradient',
    desc: 'Dégradé · Social · Moderne',
    icon: '◆',
    color: '#6D28D9',
    isTournament: true,
    Component: TplTrGradient,
  },
  {
    id: 'tr-champion',
    label: 'Champion',
    desc: 'Neon · Spotlight · Radial',
    icon: '◉',
    color: '#00F5FF',
    isTournament: true,
    Component: TplTrChampion,
  },
  {
    id: 'tr-field',
    label: 'Field',
    desc: 'Terrain · Immersif · Sport',
    icon: '⬡',
    color: '#22C55E',
    isTournament: true,
    Component: TplTrField,
  },
  {
    id: 'tr-dynamic',
    label: 'Dynamic',
    desc: 'Diagonal · Contrasté · Impact',
    icon: '◧',
    color: '#FF6B00',
    isTournament: true,
    Component: TplTrDynamic,
  },
];

export const BASE_DIMS = {
  story: { w: 360, h: 640 },
  post:  { w: 360, h: 450 },
};

export { BG_PRESETS };

// ── Player layer renderer ─────────────────────────────────────────────────────

function PlayerLayer({ layer, accentColor }) {
  const { assetUrl, x = 50, yBottom = 0, scale = 1, opacity = 1, shadow, glow, flip } = layer;
  if (!assetUrl) return null;

  const filters = [
    shadow ? 'drop-shadow(0 10px 28px rgba(0,0,0,0.65))' : '',
    glow   ? `drop-shadow(0 0 18px ${accentColor || '#ffffff'}66)` : '',
  ].filter(Boolean).join(' ');

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <img
        src={assetUrl}
        alt=""
        crossOrigin="anonymous"
        style={{
          position: 'absolute',
          left: `${x}%`,
          bottom: `${yBottom}%`,
          transform: `translateX(-50%)${flip ? ' scaleX(-1)' : ''}`,
          transformOrigin: 'bottom center',
          height: `${Math.round(80 * scale)}%`,
          width: 'auto',
          maxWidth: '90%',
          objectFit: 'contain',
          opacity,
          filter: filters || undefined,
        }}
      />
    </div>
  );
}

const PosterRenderer = memo(function PosterRenderer({ templateId, data, format = 'story', previewWidth = 158, innerRef, outerRef, transforms = {}, bgPresetId = '', bgImageOverlay = 0.52, bgImageGradient = false, effects = {}, overlayElements = [], aiOverlayElements = [], playerLayers = [] }) {
  const { w, h } = BASE_DIMS[format] || BASE_DIMS.story;
  const scale = previewWidth / w;
  const previewH = Math.round(h * scale);

  const tpl = POSTER_TEMPLATES.find(t => t.id === templateId) || POSTER_TEMPLATES[0];
  const { Component } = tpl;

  const bgPreset = bgPresetId ? BG_PRESETS.find(b => b.id === bgPresetId) : null;
  const BgComp = bgPreset?.Component ?? null;

  const belowEls = overlayElements.filter(e => !e.above);
  const aboveEls = overlayElements.filter(e => e.above);
  const belowAiEls = aiOverlayElements.filter(e => !e.above);
  const aboveAiEls = aiOverlayElements.filter(e => e.above);
  const belowPlayers = playerLayers.filter(p => !p.zAbove);
  const abovePlayers = playerLayers.filter(p => p.zAbove !== false);

  return (
    <div ref={outerRef} style={{ width: previewWidth, height: previewH, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div
        ref={innerRef}
        style={{
          width: w, height: h,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute', top: 0, left: 0,
        }}
      >
        {/* Each template owns its bgImage layer with its own overlay (dark templates use dark overlays, light templates use light overlays) */}
        <Component {...data} format={format} transforms={transforms} />

        {/* Ambient tint overlay — sits above template bg, below content (z=10) */}
        {effects.tint && effects.tintOp > 0 && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none',
              backgroundColor: effects.tint,
              opacity: effects.tintOp,
              mixBlendMode: 'overlay',
            }}
          />
        )}

        {BgComp && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
            <BgComp format={format} />
          </div>
        )}

        {/* Decorative elements — below content (z=6) */}
        {belowEls.map(el => {
          const meta = ELEMENT_LIBRARY.find(e => e.id === el.type);
          if (!meta) return null;
          const { Component: ElComp } = meta;
          return (
            <div key={el.uid} style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', opacity: el.opacity }}>
              <ElComp h={h} color={el.color} />
            </div>
          );
        })}

        {/* AI overlay elements — below content (z=6, screen blend) */}
        {belowAiEls.map(el => (
          <div key={el.uid} style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', opacity: el.opacity ?? 0.85, mixBlendMode: el.blendMode || 'screen', transform: `translate(${el.dx ?? 0}px, ${el.dy ?? 0}px) scale(${el.scale ?? 1}) rotate(${el.rotation ?? 0}deg)`, transformOrigin: 'center center' }}>
            <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
        ))}

        {/* Player layers — below content (z=7) */}
        {belowPlayers.map(pl => (
          <div key={pl.uid} style={{ position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none' }}>
            <PlayerLayer layer={pl} accentColor={data?.accentColor} />
          </div>
        ))}

        {/* Player layers — above content (z=12) */}
        {abovePlayers.map(pl => (
          <div key={pl.uid} style={{ position: 'absolute', inset: 0, zIndex: 12, pointerEvents: 'none' }}>
            <PlayerLayer layer={pl} accentColor={data?.accentColor} />
          </div>
        ))}

        {/* AI overlay elements — above content (z=16, screen blend) */}
        {aboveAiEls.map(el => (
          <div key={el.uid} style={{ position: 'absolute', inset: 0, zIndex: 16, pointerEvents: 'none', opacity: el.opacity ?? 0.85, mixBlendMode: el.blendMode || 'screen', transform: `translate(${el.dx ?? 0}px, ${el.dy ?? 0}px) scale(${el.scale ?? 1}) rotate(${el.rotation ?? 0}deg)`, transformOrigin: 'center center' }}>
            <img src={el.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
        ))}

        {/* Decorative elements — above content (z=15) */}
        {aboveEls.map(el => {
          const meta = ELEMENT_LIBRARY.find(e => e.id === el.type);
          if (!meta) return null;
          const { Component: ElComp } = meta;
          return (
            <div key={el.uid} style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none', opacity: el.opacity }}>
              <ElComp h={h} color={el.color} />
            </div>
          );
        })}

        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 10, right: 12, zIndex: 20,
            fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', fontFamily: 'Inter, sans-serif',
            color: 'rgba(255,255,255,0.30)',
            pointerEvents: 'none', userSelect: 'none',
            mixBlendMode: 'screen',
          }}
        >
          SportLink
        </div>
      </div>
    </div>
  );
});

export default PosterRenderer;

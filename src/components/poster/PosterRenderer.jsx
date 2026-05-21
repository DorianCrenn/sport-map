import { memo } from 'react';
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
import TplTournamentArena from './templates/TplTournamentArena.jsx';
import TplTournamentBracket from './templates/TplTournamentBracket.jsx';
import TplTournamentFlame from './templates/TplTournamentFlame.jsx';
import TplTournamentCrown from './templates/TplTournamentCrown.jsx';
import TplTournamentGrid from './templates/TplTournamentGrid.jsx';
import TplTournamentStripes from './templates/TplTournamentStripes.jsx';

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
    id: 'tournament-arena',
    label: 'Arène',
    desc: 'Tournoi · Spotlight · Trophée',
    icon: '🏆',
    color: '#8b5cf6',
    isTournament: true,
    Component: TplTournamentArena,
  },
  {
    id: 'tournament-bracket',
    label: 'Bracket',
    desc: 'Tournoi · Tableau · Compétition',
    icon: '⚔',
    color: '#6366f1',
    isTournament: true,
    Component: TplTournamentBracket,
  },
  {
    id: 'tournament-flame',
    label: 'Flamme',
    desc: 'Tournoi · Feu · Énergie',
    icon: '🔥',
    color: '#f97316',
    isTournament: true,
    Component: TplTournamentFlame,
  },
  {
    id: 'tournament-crown',
    label: 'Couronne',
    desc: 'Tournoi · Or · Prestige',
    icon: '👑',
    color: '#D4AF37',
    isTournament: true,
    Component: TplTournamentCrown,
  },
  {
    id: 'tournament-grid',
    label: 'Grille',
    desc: 'Tournoi · Équipes · Clair',
    icon: '⊞',
    color: '#8b5cf6',
    isTournament: true,
    Component: TplTournamentGrid,
  },
  {
    id: 'tournament-stripes',
    label: 'Rayures',
    desc: 'Tournoi · Athletic · Maillot',
    icon: '⚡',
    color: '#7c3aed',
    isTournament: true,
    Component: TplTournamentStripes,
  },
];

export const BASE_DIMS = {
  story: { w: 360, h: 640 },
  post:  { w: 360, h: 450 },
};

const PosterRenderer = memo(function PosterRenderer({ templateId, data, format = 'story', previewWidth = 158, innerRef, outerRef, transforms = {} }) {
  const { w, h } = BASE_DIMS[format] || BASE_DIMS.story;
  const scale = previewWidth / w;
  const previewH = Math.round(h * scale);

  const tpl = POSTER_TEMPLATES.find(t => t.id === templateId) || POSTER_TEMPLATES[0];
  const { Component } = tpl;

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
        <Component {...data} format={format} transforms={transforms} />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', bottom: 10, right: 12,
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

import TplEditorial from './templates/TplEditorial.jsx';
import TplImpact from './templates/TplImpact.jsx';
import TplLuxe from './templates/TplLuxe.jsx';
import TplBlanc from './templates/TplBlanc.jsx';
import TplSplit from './templates/TplSplit.jsx';
import TplMagazine from './templates/TplMagazine.jsx';
import TplNeon from './templates/TplNeon.jsx';
import TplFluo from './templates/TplFluo.jsx';
import TplCinema from './templates/TplCinema.jsx';
import TplRetro from './templates/TplRetro.jsx';
import TplVivid from './templates/TplVivid.jsx';
import TplBento from './templates/TplBento.jsx';
import TplDark from './templates/TplDark.jsx';
import TplPulse from './templates/TplPulse.jsx';

export const POSTER_TEMPLATES = [
  {
    id: 'editorial',
    label: 'Éditorial',
    desc: 'Navy · Or · Élégant',
    icon: '◆',
    color: '#D4AF37',
    Component: TplEditorial,
  },
  {
    id: 'impact',
    label: 'Impact',
    desc: 'Noir · Dynamique · Bold',
    icon: '⚡',
    color: '#22D96A',
    Component: TplImpact,
  },
  {
    id: 'luxe',
    label: 'Luxe',
    desc: 'Noir · Or · Premium',
    icon: '◈',
    color: '#D4AF37',
    Component: TplLuxe,
  },
  {
    id: 'blanc',
    label: 'Blanc',
    desc: 'Crème · Éditorial · Clair',
    icon: '○',
    color: '#B38B59',
    Component: TplBlanc,
  },
  {
    id: 'split',
    label: 'Duel',
    desc: 'Sombre · Bilatéral · Épuré',
    icon: '⊞',
    color: '#3b82f6',
    isPremium: true,
    Component: TplSplit,
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
    id: 'dark',
    label: 'Dark',
    desc: 'Noir · Minimaliste · Luxe',
    icon: '◯',
    color: '#E2C97E',
    isPremium: true,
    Component: TplDark,
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
];

export const BASE_DIMS = {
  story: { w: 360, h: 640 },
  post:  { w: 360, h: 450 },
};

export default function PosterRenderer({ templateId, data, format = 'story', previewWidth = 158, innerRef, outerRef, transforms = {} }) {
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
      </div>
    </div>
  );
}

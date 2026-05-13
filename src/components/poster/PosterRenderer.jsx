import TplEditorial from './templates/TplEditorial.jsx';
import TplImpact from './templates/TplImpact.jsx';
import TplLuxe from './templates/TplLuxe.jsx';
import TplBlanc from './templates/TplBlanc.jsx';

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
];

export const BASE_DIMS = {
  story: { w: 360, h: 640 },
  post:  { w: 360, h: 450 },
};

export default function PosterRenderer({ templateId, data, format = 'story', previewWidth = 158, innerRef }) {
  const { w, h } = BASE_DIMS[format] || BASE_DIMS.story;
  const scale = previewWidth / w;
  const previewH = Math.round(h * scale);

  const tpl = POSTER_TEMPLATES.find(t => t.id === templateId) || POSTER_TEMPLATES[0];
  const { Component } = tpl;

  return (
    <div style={{ width: previewWidth, height: previewH, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
      <div
        ref={innerRef}
        style={{
          width: w, height: h,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'absolute', top: 0, left: 0,
        }}
      >
        <Component {...data} format={format} />
      </div>
    </div>
  );
}

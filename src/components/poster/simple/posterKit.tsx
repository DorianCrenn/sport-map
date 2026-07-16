// Kit partagé pour les affiches « simples » paramétriques (SeasonPoster, MatchPoster).
// Thème dark/light, fonds décoratifs, contrôles labellisés — tout self-contained
// pour l'export html-to-image (aucune var() CSS, couleurs concrètes).

export type Format = 'post' | 'story' | 'square';
export type Bg = 'spot' | 'rayures' | 'bande' | 'terrain' | 'vif' | 'epure' | 'halo' | 'points' | 'ondes' | 'diagonale';
export type Mode = 'dark' | 'light';

export interface Theme {
  bg: string; text: string; dim: string; faint: string; surface: string;
  foot: string; jStroke: string; jNum: string; vignette: string; inset: string;
}

export const FORMATS: { id: Format; label: string; w: number; h: number; rows: number }[] = [
  { id: 'post',   label: 'Publication', w: 360, h: 450, rows: 5 },
  { id: 'story',  label: 'Story',       w: 360, h: 640, rows: 7 },
  { id: 'square', label: 'Carré',       w: 360, h: 360, rows: 3 },
];

export const BGS: { id: Bg; label: string }[] = [
  { id: 'spot',      label: 'Spot' },
  { id: 'halo',      label: 'Halo' },
  { id: 'rayures',   label: 'Rayures' },
  { id: 'bande',     label: 'Bande' },
  { id: 'diagonale', label: 'Diagonale' },
  { id: 'terrain',   label: 'Terrain' },
  { id: 'points',    label: 'Points' },
  { id: 'ondes',     label: 'Ondes' },
  { id: 'vif',       label: 'Vif' },
  { id: 'epure',     label: 'Épuré' },
];

// Modal plein écran : doit recouvrir le calque démo (bandeau z:10000, guide z:10001)
export const DEMO_OVERLAY_Z = 10050;

export const isHex = (c: unknown): c is string => typeof c === 'string' && /^#[0-9a-fA-F]{6}$/.test(c);

export function resolveClubAccent(accentColor: string, club: Record<string, any> | null | undefined): string {
  return isHex(accentColor) ? accentColor
    : (isHex(club?.theme?.primary) ? club!.theme.primary
    : isHex(club?.primary_color) ? club!.primary_color : '#22c55e');
}

export function buildPalette(clubAccent: string, club: Record<string, any> | null | undefined): string[] {
  const raw = [clubAccent, club?.primary_color, club?.theme?.primary, club?.theme?.accent, club?.colors?.accent,
    '#22c55e', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#0ea5e9', '#ec4899'];
  const seen = new Set<string>();
  return raw.filter(c => isHex(c) && !seen.has(c.toLowerCase()) && seen.add(c.toLowerCase())) as string[];
}

export function makeTheme(mode: Mode): Theme {
  return mode === 'dark'
    ? {
        bg: 'linear-gradient(160deg, #0b1220 0%, #13233f 55%, #0b1220 100%)',
        text: '#fff', dim: 'rgba(255,255,255,0.55)', faint: 'rgba(255,255,255,0.5)',
        surface: 'rgba(255,255,255,0.05)', foot: 'rgba(255,255,255,0.28)',
        jStroke: 'rgba(255,255,255,0.7)', jNum: '#fff',
        vignette: 'rgba(0,0,0,0.7)', inset: 'rgba(0,0,0,0.5)',
      }
    : {
        bg: 'linear-gradient(160deg, #ffffff 0%, #eef2f7 55%, #f6f9fc 100%)',
        text: '#0f1e3a', dim: 'rgba(15,30,58,0.6)', faint: 'rgba(15,30,58,0.42)',
        surface: 'rgba(15,30,58,0.05)', foot: 'rgba(15,30,58,0.4)',
        jStroke: 'rgba(15,30,58,0.35)', jNum: '#0f1e3a',
        vignette: 'rgba(0,0,0,0.14)', inset: 'rgba(0,0,0,0.1)',
      };
}

export function chipStyle(active: boolean, accent: string): React.CSSProperties {
  return {
    fontSize: 10.5, fontWeight: 800, padding: '5px 11px', borderRadius: 999, cursor: 'pointer',
    border: 'none', whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s',
    background: active ? accent : 'rgba(255,255,255,0.1)',
    color: active ? '#000' : 'rgba(255,255,255,0.65)',
  };
}

export function ControlRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ width: 52, flexShrink: 0, paddingTop: 6, fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>{children}</div>
    </div>
  );
}

export function ColorControl({ palette, accent, setAccent }: { palette: string[]; accent: string; setAccent: (c: string) => void }) {
  return (
    <>
      {palette.map(c => (
        <button key={c} onClick={() => setAccent(c)} aria-label={`Couleur ${c}`}
          style={{ width: 22, height: 22, borderRadius: '50%', background: c, cursor: 'pointer', border: accent.toLowerCase() === c.toLowerCase() ? '2px solid #fff' : '2px solid rgba(255,255,255,0.15)' }} />
      ))}
      <label title="Couleur personnalisée" style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.3)', cursor: 'pointer', position: 'relative', display: 'inline-block', background: 'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' }}>
        <input type="color" value={accent} onChange={e => setAccent(e.target.value)} style={{ position: 'absolute', inset: -4, opacity: 0, cursor: 'pointer' }} />
      </label>
    </>
  );
}

export function PosterBg({ bg, accent, t }: { bg: Bg; accent: string; t: Theme }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {bg === 'spot' && <>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 75% 55% at 50% -12%, ${accent}66, transparent 60%)` }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 120% 75% at 50% 130%, ${t.vignette}, transparent 55%)` }} />
        <div style={{ position: 'absolute', inset: 0, boxShadow: `inset 0 0 90px 20px ${t.inset}` }} />
      </>}

      {bg === 'rayures' && <>
        <div style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: '50%', background: accent, opacity: 0.16, filter: 'blur(10px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(45deg, ${accent}1a 0 3px, transparent 3px 18px)` }} />
      </>}

      {bg === 'bande' && <>
        <div style={{ position: 'absolute', top: '12%', left: '-25%', width: '150%', height: 130, background: `linear-gradient(90deg, transparent, ${accent}55, transparent)`, transform: 'rotate(-24deg)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '-25%', width: '150%', height: 70, background: `linear-gradient(90deg, transparent, ${accent}2e, transparent)`, transform: 'rotate(-24deg)' }} />
        <div style={{ position: 'absolute', top: '60%', left: '-25%', width: '150%', height: 40, background: `linear-gradient(90deg, transparent, ${accent}1c, transparent)`, transform: 'rotate(-24deg)' }} />
      </>}

      {bg === 'terrain' && <>
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 2, background: `${accent}22` }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 170, height: 170, borderRadius: '50%', border: `2px solid ${accent}22` }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 7, height: 7, borderRadius: '50%', background: `${accent}44` }} />
        <div style={{ position: 'absolute', top: -34, left: '50%', transform: 'translate(-50%,-50%)', width: 90, height: 90, borderRadius: '50%', border: `2px solid ${accent}1e` }} />
        <div style={{ position: 'absolute', bottom: -34, left: '50%', transform: 'translate(-50%,50%)', width: 90, height: 90, borderRadius: '50%', border: `2px solid ${accent}1e` }} />
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${accent}20, transparent 60%)` }} />
      </>}

      {bg === 'vif' && <>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(145deg, ${accent}dd 0%, ${accent}55 28%, transparent 58%)` }} />
        <div style={{ position: 'absolute', bottom: -110, right: -80, width: 260, height: 260, borderRadius: '50%', background: accent, opacity: 0.3, filter: 'blur(12px)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 20px)` }} />
      </>}

      {bg === 'halo' && <>
        <div style={{ position: 'absolute', top: -90, right: -70, width: 280, height: 280, borderRadius: '50%', background: accent, opacity: 0.22, filter: 'blur(11px)' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -80, width: 250, height: 250, borderRadius: '50%', background: accent, opacity: 0.12, filter: 'blur(11px)' }} />
      </>}

      {bg === 'points' && <>
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 45% at 50% -5%, ${accent}22, transparent 65%)` }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${accent}33 1.6px, transparent 1.7px)`, backgroundSize: '18px 18px', opacity: 0.9 }} />
      </>}

      {bg === 'ondes' && <>
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} style={{ position: 'absolute', top: -70, left: '50%', transform: 'translateX(-50%)', width: 150 + i * 115, height: 150 + i * 115, borderRadius: '50%', border: `1.5px solid ${accent}${['40', '2e', '20', '15', '0d'][i]}` }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 50% at 50% 0%, ${accent}1c, transparent 60%)` }} />
      </>}

      {bg === 'diagonale' && <>
        <div style={{ position: 'absolute', top: '-35%', left: '-30%', width: '170%', height: '85%', background: `linear-gradient(135deg, ${accent}4d 0%, ${accent}12 55%, transparent 75%)`, transform: 'rotate(-11deg)', transformOrigin: 'top left' }} />
        <div style={{ position: 'absolute', top: -70, right: -50, width: 200, height: 200, borderRadius: '50%', background: accent, opacity: 0.16, filter: 'blur(10px)' }} />
      </>}

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, background: `linear-gradient(90deg, ${accent}, ${accent}44)` }} />
    </div>
  );
}

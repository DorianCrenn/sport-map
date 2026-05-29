/**
 * TeamsPanelTab — Saisie des équipes, logos et badge compétition.
 */
import { SLabel, TextInput } from '../PosterAtoms.jsx';

export default function TeamsPanelTab({ ps }) {
  const { homeName, awayName, homeLogo, awayLogo, championship, tagline, accentColor, set, readFile, homeLogoRef, awayLogoRef } = ps;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <TextInput label="Équipe domicile" value={homeName} onChange={v => set('homeName', v)} placeholder="Extrait du titre automatiquement" />
      <div style={{ marginBottom: 10 }}>
        <SLabel>Logo domicile</SLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => homeLogoRef.current?.click()}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: homeLogo ? `${accentColor}14` : 'var(--sl-surface)', border: homeLogo ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: homeLogo ? accentColor : 'var(--sl-t2)' }}>
            {homeLogo ? '✓ Logo chargé' : '+ Uploader le logo'}
          </button>
          {homeLogo && <button onClick={() => set('homeLogo', '')} style={{ padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
          <input ref={homeLogoRef} type="file" accept="image/*" onChange={e => readFile(e, v => set('homeLogo', v))} style={{ display: 'none' }} />
        </div>
      </div>
      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0 10px' }} />
      <TextInput label="Équipe extérieure" value={awayName} onChange={v => set('awayName', v)} placeholder="Extrait du titre automatiquement" />
      <div style={{ marginBottom: 10 }}>
        <SLabel>Logo extérieur</SLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => awayLogoRef.current?.click()}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 10, fontSize: 11, fontWeight: 600, cursor: 'pointer', backgroundColor: awayLogo ? `${accentColor}14` : 'var(--sl-surface)', border: awayLogo ? `1.5px solid ${accentColor}` : '1.5px dashed var(--sl-border-s)', color: awayLogo ? accentColor : 'var(--sl-t2)' }}>
            {awayLogo ? '✓ Logo chargé' : '+ Uploader le logo'}
          </button>
          {awayLogo && <button onClick={() => set('awayLogo', '')} style={{ padding: '9px 10px', borderRadius: 10, fontSize: 12, fontWeight: 700, backgroundColor: 'var(--sl-surface)', color: '#ef4444', border: '1px solid var(--sl-border)', cursor: 'pointer' }}>✕</button>}
          <input ref={awayLogoRef} type="file" accept="image/*" onChange={e => readFile(e, v => set('awayLogo', v))} style={{ display: 'none' }} />
        </div>
      </div>
      <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0 10px' }} />
      <TextInput label="Badge compétition" value={championship} onChange={v => set('championship', v)} placeholder="Championnat D1, Coupe…" />
      <TextInput label="Accroche" value={tagline} onChange={v => set('tagline', v)} placeholder="Venez nombreux !" />
    </div>
  );
}

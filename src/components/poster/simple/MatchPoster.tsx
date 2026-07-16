import { useState, useMemo } from 'react';
import { deriveInitialFields } from '../../../lib/posterVariables.js';
import SimplePosterFrame from './SimplePosterFrame.js';
import type { Theme } from './posterKit.js';

type MatchType = 'annonce' | 'result';

interface SimplePosterBodyProps {
  event: Record<string, any>;
  club: Record<string, any>;
  accentColor?: string;
  score?: { home: number | string; away: number | string } | null;
}

// Corps du mode Simple (match), intégré dans la coquille du PosterStudio via le
// cadre partagé SimplePosterFrame. Ne fournit que les données + le design.
export default function SimplePosterBody({ event, club, accentColor = '', score = null }: SimplePosterBodyProps) {
  const fields = useMemo(() => deriveInitialFields(event, club), [event, club]);
  const homeName = fields.homeName || club?.name || 'Domicile';
  const awayName = fields.awayName || event?.adversaire || 'Adversaire';
  const homeLogo = fields.homeLogo || null;
  const awayLogo = fields.awayLogo || null;
  const championship = fields.championship || event?.level || event?.championship || '';

  const d = event?.date ? new Date(event.date) : null;
  const dateStr = d && !isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const timeStr = event?.time || (d && !isNaN(d.getTime()) ? d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');
  const venue = event?.venue || event?.city || '';

  const sc = score ?? (event?.score && event.score.home != null ? event.score : null);
  const hasScore = !!(sc && sc.home != null && sc.away != null);
  const available: MatchType[] = hasScore ? ['result', 'annonce'] : ['annonce'];

  const [type, setType] = useState<MatchType>(available[0]);
  const contentTabs = available.length > 1
    ? [{ id: 'annonce', label: '📣 Annonce' }, { id: 'result', label: '🏆 Résultat' }]
    : undefined;

  return (
    <SimplePosterFrame
      club={club}
      accentColor={accentColor}
      fileBase={`match-${type}-${(awayName || 'match').toLowerCase().replace(/\s+/g, '-')}`}
      contentTabs={contentTabs}
      content={type}
      onContent={id => setType(id as MatchType)}
      renderPoster={({ t, accent }) => (
        <>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px 0', flexShrink: 0 }}>
            <span style={{ color: accent, fontSize: 10, fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{type === 'result' ? 'Résultat' : 'Match à venir'}</span>
            {championship && <span style={{ color: t.dim, fontSize: 10, fontWeight: 700, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{championship}</span>}
          </div>

          <div style={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 16 }}>
              <TeamSide name={homeName} logo={homeLogo} accent={accent} t={t} />
              <div style={{ flexShrink: 0, alignSelf: 'center', textAlign: 'center', minWidth: 70 }}>
                {type === 'result' && hasScore
                  ? <div style={{ color: t.text, fontSize: 34, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{sc!.home}<span style={{ color: accent, margin: '0 4px' }}>–</span>{sc!.away}</div>
                  : <div style={{ color: accent, fontSize: 26, fontWeight: 900, letterSpacing: '0.04em' }}>VS</div>}
              </div>
              <TeamSide name={awayName} logo={awayLogo} accent={accent} t={t} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              {(dateStr || timeStr) && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: `${accent}1f`, border: `1px solid ${accent}44`, borderRadius: 999, padding: '6px 14px' }}>
                  <span style={{ color: t.text, fontSize: 12.5, fontWeight: 800, textTransform: 'capitalize' }}>{dateStr}</span>
                  {timeStr && <span style={{ color: accent, fontSize: 12.5, fontWeight: 900 }}>{timeStr}</span>}
                </div>
              )}
              {venue && <div style={{ color: t.dim, fontSize: 11, fontWeight: 600 }}>📍 {venue}</div>}
              {type === 'annonce' && <div style={{ color: t.faint, fontSize: 11, fontWeight: 700, marginTop: 2 }}>Venez nombreux !</div>}
            </div>
          </div>

          <div style={{ position: 'relative', textAlign: 'center', color: t.foot, fontSize: 8.5, paddingBottom: 12, letterSpacing: '0.12em', fontWeight: 700, flexShrink: 0 }}>
            {club?.name ?? 'SportLink'} · SPORTLINK
          </div>
        </>
      )}
    />
  );
}

function TeamSide({ name, logo, accent, t }: { name: string; logo: string | null; accent: string; t: Theme }) {
  const initials = String(name).split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {logo
        ? <img src={logo} alt="" crossOrigin="anonymous" style={{ width: 58, height: 58, objectFit: 'contain', borderRadius: 14, background: t.surface }} />
        : <div style={{ width: 58, height: 58, borderRadius: 14, background: `${accent}22`, border: `1.5px solid ${accent}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent, fontWeight: 900, fontSize: 20 }}>{initials}</div>}
      <div style={{ color: t.text, fontSize: 13.5, fontWeight: 800, textAlign: 'center', lineHeight: 1.15, wordBreak: 'break-word', width: '100%' }}>{name}</div>
    </div>
  );
}

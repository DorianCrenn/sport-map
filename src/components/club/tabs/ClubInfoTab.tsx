interface ClubInfoTabProps {
  club: Record<string, any>;
  accentColor?: string;
}

export default function ClubInfoTab({ club, accentColor }: ClubInfoTabProps) {
  const teamCount = (club.categories ?? []).flatMap((c: any) => c.teams ?? []).length;
  const catCount  = (club.categories ?? []).length;

  return (
    <div style={{ padding: '14px 14px calc(90px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {club.description && (
        <div style={{ padding: '14px 16px', borderRadius: 14, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', marginBottom: 8 }}>
            À propos
          </div>
          <p style={{ fontSize: 13, color: 'var(--sl-t1)', lineHeight: 1.6, margin: 0 }}>{club.description}</p>
        </div>
      )}

      <div style={{ padding: '14px 16px', borderRadius: 14, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', marginBottom: 12 }}>
          Informations
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { icon: '⚽', label: 'Sport', value: club.sport },
            { icon: '📍', label: 'Ville', value: club.city },
            teamCount > 0 ? { icon: '👥', label: 'Équipes', value: `${teamCount} équipe${teamCount > 1 ? 's' : ''} · ${catCount} catégorie${catCount > 1 ? 's' : ''}` } : null,
            club.members ? { icon: '❤️', label: 'Abonnés', value: `${club.members} membre${club.members > 1 ? 's' : ''}` } : null,
            club.level ? { icon: '🏆', label: 'Niveau', value: club.level } : null,
          ].filter(Boolean).map((item: any, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0, width: 24, textAlign: 'center' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: 'var(--sl-t1)', fontWeight: 600 }}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {club.contact && (
        <div style={{ padding: '14px 16px', borderRadius: 14, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', marginBottom: 12 }}>Contact</div>
          <a
            href={`mailto:${club.contact}`}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}25`, textDecoration: 'none', minHeight: 44 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: accentColor }}>{club.contact}</span>
          </a>
        </div>
      )}

      {club.city && (
        <div style={{ padding: '14px 16px', borderRadius: 14, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', marginBottom: 12 }}>Localisation</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, backgroundColor: `${accentColor}12`, border: `1px solid ${accentColor}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--sl-t1)' }}>{club.city}</div>
              <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{club.region ? `${club.region}, France` : 'France'}</div>
            </div>
          </div>
        </div>
      )}

      {catCount > 0 && (
        <div style={{ padding: '14px 16px', borderRadius: 14, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sl-t3)', marginBottom: 10 }}>Sections & Équipes</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(club.categories ?? []).map((cat: any) => (
              <div key={cat.id}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)', marginBottom: 4 }}>{cat.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {(cat.teams ?? []).map((team: any) => (
                    <span key={team.id} style={{ padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 600, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)', color: 'var(--sl-t2)' }}>
                      {team.name}{team.level ? ` · ${team.level}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

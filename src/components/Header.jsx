import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import SportLinkLogo from './SportLinkLogo.jsx';

export default function Header({
  cities = [], clubs = [], allEvents = [], cityFilter, onCityFilter, onSelectClub, onSelectEvent, onClearCity,
  onTabChange, onShowAuth,
}) {
  const { allSports } = useSports();
  const { currentUser, isClubAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const q = query.trim().toLowerCase();
  const matchedCities = q.length >= 1
    ? (() => {
        const s = cities.filter(c => c.toLowerCase().startsWith(q));
        const r = cities.filter(c => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q));
        return [...s, ...r].slice(0, 6);
      })()
    : [];
  const matchedClubs = q.length >= 2
    ? clubs.filter(c =>
        c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.sport.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];
  const now = new Date();
  const matchedEvents = q.length >= 2
    ? allEvents
        .filter(e => new Date(e.date) >= now &&
          (e.title.toLowerCase().includes(q) || e.sport.toLowerCase().includes(q) || (e.city ?? '').toLowerCase().includes(q))
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4)
    : [];
  const hasResults = matchedCities.length > 0 || matchedClubs.length > 0 || matchedEvents.length > 0;

  function selectCity(city) { onCityFilter?.(city); setQuery(''); setSearchOpen(false); }
  function selectClub(club) { onSelectClub?.(club); setQuery(''); setSearchOpen(false); }
  function selectEvent(event) { onSelectEvent?.(event); setQuery(''); setSearchOpen(false); }

  const initials = currentUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <header style={{
      flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
      padding: '0 14px', minHeight: 56,
      background: 'var(--sl-header-bg)',
      boxShadow: 'var(--sl-header-shadow)',
      position: 'relative', zIndex: 1000,
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <SportLinkLogo size={24} onDark />
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#deeeff', letterSpacing: '-0.02em', lineHeight: 1 }}>
            SportLink
          </div>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--sl-green)', marginTop: 2, letterSpacing: '0.04em' }}>
            FINISTÈRE
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }} ref={searchRef}>
        {cityFilter ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 10,
              backgroundColor: 'rgba(34,217,106,0.15)',
              border: '1px solid rgba(34,217,106,0.3)',
              color: 'var(--sl-green)', fontSize: 12, fontWeight: 600,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {cityFilter}
              <button onClick={onClearCity} aria-label="Retirer le filtre ville" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', opacity: 0.7, display: 'flex', alignItems: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <svg
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'opacity 0.2s' }}
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke={inputFocused ? 'rgba(34,217,106,0.7)' : 'rgba(222,238,255,0.3)'}
              strokeWidth="2.5" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              type="text" value={query}
              onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => { setSearchOpen(true); setInputFocused(true); }}
              onBlur={() => setInputFocused(false)}
              placeholder="Ville, club, sport…"
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 34, paddingTop: 9, paddingBottom: 9,
                borderRadius: 14,
                backgroundColor: inputFocused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${inputFocused ? 'rgba(34,217,106,0.4)' : 'rgba(255,255,255,0.12)'}`,
                color: 'var(--sl-t1)',
                fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                outline: 'none', boxSizing: 'border-box',
                boxShadow: inputFocused
                  ? '0 0 0 3px rgba(34,217,106,0.1), 0 2px 12px rgba(0,0,0,0.25)'
                  : '0 1px 4px rgba(0,0,0,0.2)',
                transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
              }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchOpen(false); inputRef.current?.focus(); }} aria-label="Effacer la recherche" style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                width: 18, height: 18, borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(222,238,255,0.7)" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Search dropdown */}
        <AnimatePresence>
          {searchOpen && hasResults && !cityFilter && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0,
                borderRadius: 16, backgroundColor: 'var(--sl-card)',
                boxShadow: 'var(--sl-shadow-xl)', border: '1px solid var(--sl-border-s)',
                zIndex: 200, overflow: 'hidden',
              }}
            >
              {matchedCities.length > 0 && (
                <div>
                  <div style={{ padding: '10px 14px 6px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)' }}>Villes</span>
                  </div>
                  <div style={{ padding: '0 6px 6px' }}>
                    {matchedCities.map(city => (
                      <button key={city} onClick={() => selectCity(city)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 10px', borderRadius: 10, border: 'none',
                        backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left', color: 'var(--sl-t1)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sl-hover)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, backgroundColor: 'rgba(34,217,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{city}</span>
                        <svg style={{ marginLeft: 'auto', flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {matchedCities.length > 0 && (matchedClubs.length > 0 || matchedEvents.length > 0) && (
                <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '0 14px' }} />
              )}
              {matchedClubs.length > 0 && (
                <div>
                  <div style={{ padding: '10px 14px 6px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)' }}>Clubs</span>
                  </div>
                  <div style={{ padding: '0 6px 6px' }}>
                    {matchedClubs.map(club => {
                      const sportColor = allSports[club.sport]?.color ?? '#64748b';
                      const init = club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <button key={club.id} onClick={() => selectClub(club)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 10, border: 'none',
                          backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sl-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, backgroundColor: sportColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                            {init}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <span style={{ fontSize: 11, color: 'var(--sl-t2)' }}>{club.city}</span>
                              <span style={{ color: 'var(--sl-t3)', fontSize: 10 }}>·</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: sportColor }}>{club.sport}</span>
                            </div>
                          </div>
                          <svg style={{ flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {matchedClubs.length > 0 && matchedEvents.length > 0 && (
                <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '0 14px' }} />
              )}
              {matchedEvents.length > 0 && (
                <div>
                  <div style={{ padding: '10px 14px 6px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)' }}>Événements</span>
                  </div>
                  <div style={{ padding: '0 6px 6px' }}>
                    {matchedEvents.map(event => {
                      const sportColor = allSports[event.sport]?.color ?? '#64748b';
                      const d = new Date(event.date);
                      const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                      const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <button key={event.id} onClick={() => selectEvent(event)} style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 10, border: 'none',
                          backgroundColor: 'transparent', cursor: 'pointer', textAlign: 'left',
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sl-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, backgroundColor: `${sportColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: sportColor }} />
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <span style={{ fontSize: 11, color: 'var(--sl-t2)' }}>{dateStr} · {timeStr}</span>
                              {event.city && <><span style={{ color: 'var(--sl-t3)', fontSize: 10 }}>·</span><span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{event.city}</span></>}
                            </div>
                          </div>
                          <svg style={{ flexShrink: 0 }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round">
                            <polyline points="9 18 15 12 9 6"/>
                          </svg>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Profile button */}
      <div ref={profileRef} style={{ position: 'relative', flexShrink: 0 }}>
        {currentUser ? (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setProfileOpen(o => !o)}
            aria-label={`Menu profil — ${currentUser.name}`}
            aria-expanded={profileOpen}
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--sl-green)', color: '#fff',
              fontWeight: 800, fontSize: 13, fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: profileOpen ? '0 0 0 2px var(--sl-green), 0 0 0 4px rgba(34,217,106,0.2)' : 'none',
              transition: 'box-shadow 0.15s',
            }}
          >
            {initials}
          </motion.button>
        ) : (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => onShowAuth?.()}
            style={{
              padding: '6px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--sl-green)', color: '#fff',
              fontSize: 12, fontWeight: 700, fontFamily: 'Inter, sans-serif',
            }}
          >
            Connexion
          </motion.button>
        )}

        {/* Profile dropdown */}
        <AnimatePresence>
          {profileOpen && currentUser && (
            <motion.div
              key="profile-dropdown"
              initial={{ opacity: 0, scale: 0.94, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -8 }}
              transition={{ duration: 0.14 }}
              style={{
                position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                width: 224, borderRadius: 16,
                backgroundColor: 'var(--sl-card)',
                border: '1px solid var(--sl-border-s)',
                boxShadow: 'var(--sl-shadow-xl)',
                zIndex: 300, overflow: 'hidden',
              }}
            >
              {/* User info */}
              <div style={{ padding: '14px 14px 10px', borderBottom: '1px solid var(--sl-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    backgroundColor: 'var(--sl-green)', color: '#fff',
                    fontWeight: 800, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentUser.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--sl-t3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {currentUser.email}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px' }}>
                <DropdownItem
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                  label="Mon profil"
                  onClick={() => { setProfileOpen(false); onTabChange?.('profil'); }}
                />
                {isClubAdmin && (
                  <DropdownItem
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                    label="Mon club"
                    onClick={() => { setProfileOpen(false); onTabChange?.('clubs'); }}
                  />
                )}
                <DropdownItem
                  icon={theme === 'dark'
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  }
                  label={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                  onClick={() => { toggleTheme(); setProfileOpen(false); }}
                />
              </div>

              <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '0 6px' }} />

              <div style={{ padding: '6px' }}>
                <DropdownItem
                  icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>}
                  label="Déconnexion"
                  labelColor="#ef4444"
                  onClick={() => { logout(); setProfileOpen(false); }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

function DropdownItem({ icon, label, onClick, labelColor }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
        backgroundColor: hover ? 'var(--sl-hover)' : 'transparent',
        color: labelColor ?? 'var(--sl-t1)',
        fontSize: 13, fontWeight: 500, textAlign: 'left',
        transition: 'background-color 0.1s',
      }}
    >
      <span style={{ color: labelColor ?? 'var(--sl-t2)', flexShrink: 0 }}>{icon}</span>
      {label}
    </button>
  );
}

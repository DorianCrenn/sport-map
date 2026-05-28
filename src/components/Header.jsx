import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useClubRequests } from '../hooks/useClubRequests.js';
import SportLinkLogo from './SportLinkLogo.jsx';

export default function Header({
  cities = [], clubs = [], allEvents = [], cityFilter, onCityFilter, onSelectClub, onSelectEvent, onClearCity,
  onTabChange, onShowAuth, onMyRides, rideNotifCount = 0,
  onShowAnnouncements, announcementsUnreadCount = 0,
}) {
  const { allSports } = useSports();
  const { currentUser, isAdmin, isClubAdmin, logout,
          devRole, setDevRole, devClubId, setDevClubId } = useAuth();
  const { pendingRequests } = useClubRequests();
  const pendingCount = isAdmin ? pendingRequests.length : 0;
  const totalBadge = pendingCount + rideNotifCount;
  const { theme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
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

  // Debounce the filter query by 150ms — input display stays instant
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query.trim().toLowerCase()), 150);
    return () => clearTimeout(t);
  }, [query]);

  const q = debouncedQ;
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
  const now = useMemo(() => new Date(), []);
  const matchedEvents = q.length >= 2
    ? allEvents
        .filter(e => new Date(e.date) >= now &&
          (e.title.toLowerCase().includes(q) || e.sport.toLowerCase().includes(q) || (e.city ?? '').toLowerCase().includes(q))
        )
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4)
    : [];
  const hasResults = matchedCities.length > 0 || matchedClubs.length > 0 || matchedEvents.length > 0;
  const showEmpty = q.length >= 2 && !hasResults;

  // Flat list of all results for keyboard navigation
  const allResults = useMemo(() => [
    ...matchedCities.map(c => ({ type: 'city', key: c, data: c })),
    ...matchedClubs.map(c => ({ type: 'club', key: String(c.id), data: c })),
    ...matchedEvents.map(e => ({ type: 'event', key: String(e.id), data: e })),
  ], [matchedCities, matchedClubs, matchedEvents]);

  useEffect(() => { setHighlightIndex(-1); }, [query]);

  function handleKeyDown(e) {
    if (!searchOpen || (!hasResults && !showEmpty)) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(i => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      const item = allResults[highlightIndex];
      if (item.type === 'city') selectCity(item.data);
      else if (item.type === 'club') selectClub(item.data);
      else if (item.type === 'event') selectEvent(item.data);
    } else if (e.key === 'Escape') {
      setSearchOpen(false);
      setQuery('');
    }
  }

  function selectCity(city) { onCityFilter?.(city); setQuery(''); setSearchOpen(false); }
  function selectClub(club) { onSelectClub?.(club); setQuery(''); setSearchOpen(false); }
  function selectEvent(event) { onSelectEvent?.(event); setQuery(''); setSearchOpen(false); }

  const initials = currentUser?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  // Running index across sections for keyboard highlight
  let idx = -1;

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
          <div style={{ fontSize: 9, fontWeight: 600, color: '#22d96a', marginTop: 2, letterSpacing: '0.04em' }}>
            FINISTÈRE
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ flex: 1, minWidth: 0 }} ref={searchRef}>
        {cityFilter ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderRadius: 10,
              backgroundColor: 'rgba(34,217,106,0.18)',
              border: '1px solid rgba(34,217,106,0.35)',
              color: '#22d96a', fontSize: 12, fontWeight: 600,
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
              stroke={inputFocused ? 'rgba(34,217,106,0.8)' : 'rgba(222,238,255,0.35)'}
              strokeWidth="2.5" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              type="text" value={query}
              role="combobox"
              aria-expanded={searchOpen && (hasResults || showEmpty)}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-label="Rechercher une ville, un club ou un événement"
              onChange={e => { setQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => { setSearchOpen(true); setInputFocused(true); }}
              onBlur={() => setInputFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Ville, club, événement…"
              style={{
                width: '100%', paddingLeft: 36, paddingRight: 34, paddingTop: 9, paddingBottom: 9,
                borderRadius: 14,
                backgroundColor: inputFocused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
                border: `1.5px solid ${inputFocused ? 'rgba(34,217,106,0.45)' : 'rgba(255,255,255,0.13)'}`,
                color: '#deeeff',
                fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                outline: 'none', boxSizing: 'border-box',
                boxShadow: inputFocused
                  ? '0 0 0 3px rgba(34,217,106,0.12), 0 2px 12px rgba(0,0,0,0.3)'
                  : '0 1px 4px rgba(0,0,0,0.25)',
                transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
              }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setSearchOpen(false); inputRef.current?.focus(); }} aria-label="Effacer la recherche" style={{
                position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                width: 44, height: 44, borderRadius: '50%',
                backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(222,238,255,0.8)" strokeWidth="3" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </div>
              </button>
            )}
          </div>
        )}

        {/* Search dropdown */}
        <AnimatePresence>
          {searchOpen && (hasResults || showEmpty) && !cityFilter && (
            <motion.div
              key="dropdown"
              role="listbox"
              aria-label="Résultats de recherche"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute', top: 'calc(100% + 6px)',
                left: 12, right: 12,
                borderRadius: 18,
                backgroundColor: 'var(--sl-card)',
                boxShadow: 'var(--sl-shadow-xl)',
                border: '1px solid var(--sl-border)',
                zIndex: 200, overflow: 'hidden',
              }}
            >
              {/* Empty state */}
              {showEmpty && (
                <div style={{ padding: '22px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 8 }}>🔍</div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t2)', margin: 0 }}>
                    Aucun résultat pour « {query.trim()} »
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 4 }}>
                    Essayez un sport, une ville ou un club différent
                  </p>
                </div>
              )}

              {/* Cities */}
              {matchedCities.length > 0 && (
                <div>
                  <SectionLabel label="Villes" />
                  <div style={{ padding: '0 6px 6px' }}>
                    {matchedCities.map(city => {
                      idx++;
                      const isHi = highlightIndex === idx;
                      return (
                        <ResultRow
                          key={city}
                          highlighted={isHi}
                          onClick={() => selectCity(city)}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          icon={
                            <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, backgroundColor: 'rgba(34,217,106,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                            </div>
                          }
                        >
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)' }}>{city}</span>
                        </ResultRow>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedCities.length > 0 && (matchedClubs.length > 0 || matchedEvents.length > 0) && (
                <Divider />
              )}

              {/* Clubs */}
              {matchedClubs.length > 0 && (
                <div>
                  <SectionLabel label="Clubs" />
                  <div style={{ padding: '0 6px 6px' }}>
                    {matchedClubs.map(club => {
                      idx++;
                      const isHi = highlightIndex === idx;
                      const sportColor = allSports[club.sport]?.color ?? '#64748b';
                      const init = club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <ResultRow
                          key={club.id}
                          highlighted={isHi}
                          onClick={() => selectClub(club)}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          icon={
                            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, backgroundColor: sportColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff' }}>
                              {init}
                            </div>
                          }
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{club.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                            <span style={{ fontSize: 11, color: 'var(--sl-t2)' }}>{club.city}</span>
                            <span style={{ color: 'var(--sl-t3)', fontSize: 10 }}>·</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: sportColor }}>{club.sport}</span>
                          </div>
                        </ResultRow>
                      );
                    })}
                  </div>
                </div>
              )}

              {matchedClubs.length > 0 && matchedEvents.length > 0 && (
                <Divider />
              )}

              {/* Events */}
              {matchedEvents.length > 0 && (
                <div>
                  <SectionLabel label="Événements" />
                  <div style={{ padding: '0 6px 6px' }}>
                    {matchedEvents.map(event => {
                      idx++;
                      const isHi = highlightIndex === idx;
                      const sportColor = allSports[event.sport]?.color ?? '#64748b';
                      const d = new Date(event.date);
                      const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                      const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                      return (
                        <ResultRow
                          key={event.id}
                          highlighted={isHi}
                          onClick={() => selectEvent(event)}
                          onMouseEnter={() => setHighlightIndex(idx)}
                          icon={
                            <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, backgroundColor: `${sportColor}18`, border: `1.5px solid ${sportColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: sportColor }} />
                            </div>
                          }
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 1 }}>
                            <span style={{ fontSize: 11, color: 'var(--sl-t2)' }}>{dateStr} · {timeStr}</span>
                            {event.city && <><span style={{ color: 'var(--sl-t3)', fontSize: 10 }}>·</span><span style={{ fontSize: 11, color: 'var(--sl-t3)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.city}</span></>}
                          </div>
                        </ResultRow>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer shortcut hint */}
              {hasResults && (
                <div style={{ padding: '6px 14px 10px', borderTop: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Kbd>↑↓</Kbd>
                  <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>naviguer</span>
                  <Kbd>↵</Kbd>
                  <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>sélectionner</span>
                  <Kbd>Esc</Kbd>
                  <span style={{ fontSize: 10, color: 'var(--sl-t3)' }}>fermer</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Dev role switcher (DEV only) ── */}
      {setDevRole && currentUser && (
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0,
          padding: '3px 6px', borderRadius: 12,
          backgroundColor: 'rgba(234,179,8,0.12)',
          border: '1px solid rgba(234,179,8,0.35)',
        }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[
              { role: null,         label: '👤 Réel' },
              { role: 'user',       label: 'User'    },
              { role: 'club_admin', label: 'Club'    },
              { role: 'admin',      label: 'Admin'   },
              { role: 'superadmin', label: 'Super'   },
            ].map(({ role, label }) => {
              const active = devRole === role;
              return (
                <button
                  key={String(role)}
                  onClick={() => { setDevRole(role); if (role !== 'club_admin') setDevClubId(null); }}
                  style={{
                    padding: '2px 7px', borderRadius: 10, fontSize: 10, fontWeight: 700,
                    cursor: 'pointer', border: 'none', transition: 'all 0.1s',
                    backgroundColor: active ? '#eab308' : 'transparent',
                    color: active ? '#000' : 'rgba(234,179,8,0.8)',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {devRole === 'club_admin' && clubs.length > 0 && (
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 260 }}>
              {clubs.slice(0, 6).map(club => {
                const active = devClubId === String(club.id);
                return (
                  <button
                    key={club.id}
                    onClick={() => setDevClubId(active ? null : String(club.id))}
                    title={club.name}
                    style={{
                      padding: '1px 6px', borderRadius: 8, fontSize: 9, fontWeight: 600,
                      cursor: 'pointer', border: 'none', transition: 'all 0.1s',
                      backgroundColor: active ? '#eab308' : 'rgba(234,179,8,0.2)',
                      color: active ? '#000' : 'rgba(234,179,8,0.9)',
                      maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {club.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Bell / announcements */}
      {onShowAnnouncements && (
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onShowAnnouncements}
          aria-label="Annonces clubs"
          aria-haspopup="dialog"
          style={{
            flexShrink: 0, position: 'relative',
            width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
            backgroundColor: announcementsUnreadCount > 0 ? 'rgba(34,217,106,0.15)' : 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: announcementsUnreadCount > 0 ? '#22d96a' : 'rgba(222,238,255,0.55)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {announcementsUnreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              minWidth: 15, height: 15, borderRadius: 8, padding: '0 3px',
              backgroundColor: '#22d96a', color: '#0a1628',
              fontSize: 8, fontWeight: 800, lineHeight: '15px', textAlign: 'center',
              border: '1.5px solid var(--sl-bg)',
              pointerEvents: 'none',
            }}>
              {announcementsUnreadCount > 9 ? '9+' : announcementsUnreadCount}
            </span>
          )}
        </motion.button>
      )}

      {/* Profile button */}
      <div ref={profileRef} style={{ position: 'relative', flexShrink: 0 }}>
        {currentUser ? (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => setProfileOpen(o => !o)}
            aria-label={`Menu profil — ${currentUser.name}`}
            aria-expanded={profileOpen}
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--sl-green)', color: '#fff',
              fontWeight: 800, fontSize: 13, fontFamily: 'Inter, sans-serif',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: profileOpen ? '0 0 0 2px var(--sl-green), 0 0 0 4px rgba(34,217,106,0.2)' : 'none',
              transition: 'box-shadow 0.15s',
              position: 'relative',
            }}
          >
            {initials}
            {totalBadge > 0 && (
              <span style={{
                position: 'absolute', top: -3, right: -3,
                minWidth: 16, height: 16, borderRadius: 8, padding: '0 4px',
                backgroundColor: rideNotifCount > 0 && pendingCount === 0 ? 'var(--sl-green)' : '#ef4444',
                color: '#fff',
                fontSize: 9, fontWeight: 800, lineHeight: '16px', textAlign: 'center',
                border: '2px solid var(--sl-bg)',
                pointerEvents: 'none',
              }}>
                {totalBadge > 9 ? '9+' : totalBadge}
              </span>
            )}
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
                border: '1px solid var(--sl-border)',
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
                {onMyRides && (
                  <DropdownItem
                    icon={<span style={{ fontSize: 14 }}>🚗</span>}
                    label="Mes covoiturages"
                    badge={rideNotifCount}
                    onClick={() => { setProfileOpen(false); onMyRides(); }}
                  />
                )}
                {isAdmin && (
                  <DropdownItem
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>}
                    label={pendingCount > 0 ? `Dashboard admin · ${pendingCount} demande${pendingCount > 1 ? 's' : ''}` : 'Dashboard admin'}
                    labelColor={pendingCount > 0 ? '#f59e0b' : undefined}
                    onClick={() => { setProfileOpen(false); onTabChange?.('admin'); }}
                  />
                )}
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

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionLabel({ label }) {
  return (
    <div style={{ padding: '10px 14px 5px', display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)' }}>
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '2px 12px' }} />;
}

function Kbd({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '1px 5px', borderRadius: 5,
      backgroundColor: 'var(--sl-surface)',
      border: '1px solid var(--sl-border)',
      fontSize: 9, fontWeight: 700, color: 'var(--sl-t3)',
      fontFamily: 'Inter, monospace',
    }}>
      {children}
    </span>
  );
}

function ResultRow({ children, icon, highlighted, onClick, onMouseEnter }) {
  return (
    <button
      role="option"
      aria-selected={highlighted}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 8px', borderRadius: 11, border: 'none', cursor: 'pointer', textAlign: 'left',
        backgroundColor: highlighted ? 'var(--sl-hover)' : 'transparent',
        transition: 'background-color 0.08s',
        outline: highlighted ? '2px solid var(--sl-border)' : 'none',
        outlineOffset: -1,
      }}
    >
      {icon}
      <div style={{ minWidth: 0, flex: 1 }}>
        {children}
      </div>
      <svg style={{ flexShrink: 0, opacity: highlighted ? 1 : 0.35, transition: 'opacity 0.1s' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>
  );
}

function DropdownItem({ icon, label, onClick, labelColor, badge = 0 }) {
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
      <span style={{ flex: 1 }}>{label}</span>
      {badge > 0 && (
        <span style={{
          minWidth: 18, height: 18, borderRadius: 999, padding: '0 5px',
          backgroundColor: 'var(--sl-green)', color: '#fff',
          fontSize: 10, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}

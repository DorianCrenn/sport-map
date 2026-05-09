import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import SportLinkLogo from './SportLinkLogo.jsx';

export default function Header({ cities = [], clubs = [], cityFilter, onCityFilter, onSelectClub, onClearCity }) {
  const { allSports } = useSports();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const q = query.trim().toLowerCase();
  const matchedCities = q.length >= 1
    ? cities.filter(c => c.toLowerCase().includes(q)).slice(0, 5)
    : [];
  const matchedClubs = q.length >= 2
    ? clubs.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.sport.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];
  const hasResults = matchedCities.length > 0 || matchedClubs.length > 0;

  function selectCity(city) {
    onCityFilter?.(city);
    setQuery('');
    setOpen(false);
  }

  function selectClub(club) {
    onSelectClub?.(club);
    setQuery('');
    setOpen(false);
  }

  return (
    <header
      className="flex-shrink-0 flex items-center gap-3 px-4 text-white"
      style={{
        background: 'linear-gradient(90deg, #0F1E3A 0%, #1a3460 100%)',
        boxShadow: '0 2px 12px rgba(15,30,58,0.3)',
        minHeight: 58,
        position: 'relative',
        zIndex: 1000,
      }}
    >
      {/* Logo */}
      <SportLinkLogo size={26} onDark />
      <div className="flex-shrink-0 mr-1">
        <div className="text-sm font-bold tracking-tight leading-none font-poppins">SportLink</div>
        <div className="text-[9px] font-medium mt-0.5" style={{ color: '#22C55E' }}>Le sport près de toi</div>
      </div>

      {/* Search bar */}
      <div className="flex-1 min-w-0 relative" ref={wrapRef}>
        {cityFilter ? (
          /* Active city filter chip */
          <div className="flex items-center gap-2">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ backgroundColor: 'rgba(34,197,94,0.22)', color: '#4ade80', border: '1.5px solid rgba(34,197,94,0.4)' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {cityFilter}
              <button onClick={onClearCity} className="ml-0.5 opacity-70 hover:opacity-100 transition-opacity">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <button
              onClick={() => { inputRef.current?.focus(); }}
              className="text-[11px] opacity-50 hover:opacity-80 transition-opacity"
              style={{ color: 'white' }}
            >
              Modifier
            </button>
          </div>
        ) : (
          <div className="relative">
            {/* Search icon */}
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Rechercher une ville ou un club…"
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-300/40 transition-shadow"
              style={{
                backgroundColor: 'white',
                border: '1.5px solid rgba(255,255,255,0.15)',
                color: '#0F1E3A',
              }}
            />

            {query ? (
              <button
                onClick={() => { setQuery(''); setOpen(false); inputRef.current?.focus(); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: '#e2e8f0' }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            ) : (
              /* Shortcut hint */
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium pointer-events-none"
                style={{ color: '#94a3b8' }}>
                ↵
              </span>
            )}
          </div>
        )}

        {/* ── Dropdown ── */}
        <AnimatePresence>
          {open && hasResults && !cityFilter && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: 'white',
                boxShadow: '0 16px 48px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                zIndex: 200,
              }}
            >
              {/* Villes */}
              {matchedCities.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#eff6ff' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                      Villes
                    </span>
                    <span className="text-[10px] font-semibold ml-auto px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                      {matchedCities.length}
                    </span>
                  </div>
                  <div className="px-2 pb-2">
                    {matchedCities.map(city => (
                      <button
                        key={city}
                        onClick={() => selectCity(city)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                        style={{ color: '#0F1E3A' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: '#dbeafe' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                          </svg>
                        </div>
                        <span className="text-sm font-medium">{city}</span>
                        <svg className="ml-auto flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Divider between groups */}
              {matchedCities.length > 0 && matchedClubs.length > 0 && (
                <div style={{ height: 1, backgroundColor: '#f1f5f9', margin: '0 16px' }} />
              )}

              {/* Clubs */}
              {matchedClubs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: '#fdf4ff' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#94a3b8' }}>
                      Clubs
                    </span>
                    <span className="text-[10px] font-semibold ml-auto px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                      {matchedClubs.length}
                    </span>
                  </div>
                  <div className="px-2 pb-2">
                    {matchedClubs.map(club => {
                      const sportColor = allSports[club.sport]?.color ?? '#64748b';
                      const initials = club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2);
                      return (
                        <button
                          key={club.id}
                          onClick={() => selectClub(club)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors"
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: sportColor }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold truncate" style={{ color: '#0F1E3A' }}>{club.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px]" style={{ color: '#64748b' }}>{club.city}</span>
                              <span style={{ color: '#cbd5e1', fontSize: 10 }}>·</span>
                              <span className="text-[11px] font-medium" style={{ color: sportColor }}>{club.sport}</span>
                            </div>
                          </div>
                          <svg className="flex-shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round">
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
    </header>
  );
}

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import SportLinkLogo from './SportLinkLogo.jsx';

export default function Header({ cities = [], clubs = [], cityFilter, onCityFilter, onSelectClub, onClearCity }) {
  const { allSports } = useSports();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

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
      ).slice(0, 4)
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
      className="flex-shrink-0 flex items-center gap-3 px-4 py-3 text-white"
      style={{ background: 'linear-gradient(90deg, #0F1E3A 0%, #1a3460 100%)', boxShadow: '0 2px 12px rgba(15,30,58,0.3)' }}
    >
      {/* Logo */}
      <SportLinkLogo size={28} onDark />
      <div className="flex-shrink-0">
        <div className="text-base font-bold tracking-tight leading-none font-poppins">SportLink</div>
        <div className="text-[10px] font-medium mt-0.5" style={{ color: '#22C55E' }}>Le sport près de toi</div>
      </div>

      {/* Search */}
      <div className="flex-1 min-w-0 relative" ref={wrapRef}>
        {cityFilter ? (
          /* Active city chip */
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ backgroundColor: 'rgba(34,197,94,0.2)', color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)' }}>
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
        ) : (
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" width="13" height="13"
              viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setOpen(true); }}
              onFocus={() => setOpen(true)}
              placeholder="Ville, club…"
              className="w-full pl-8 pr-7 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{
                backgroundColor: 'rgba(255,255,255,0.10)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'white',
              }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setOpen(false); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-80 transition-opacity"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Dropdown */}
        <AnimatePresence>
          {open && hasResults && !cityFilter && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden"
              style={{
                backgroundColor: '#162c55',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                zIndex: 200,
              }}
            >
              {matchedCities.length > 0 && (
                <div className="px-2 pt-2.5 pb-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider px-2 mb-1.5"
                    style={{ color: 'rgba(255,255,255,0.38)' }}>Villes</div>
                  {matchedCities.map(city => (
                    <button
                      key={city}
                      onClick={() => selectCity(city)}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-white hover:bg-white/10 transition-colors text-left"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                      {city}
                    </button>
                  ))}
                </div>
              )}
              {matchedClubs.length > 0 && (
                <div className="px-2 pt-1 pb-2.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider px-2 mb-1.5"
                    style={{ color: 'rgba(255,255,255,0.38)' }}>Clubs</div>
                  {matchedClubs.map(club => {
                    const sportColor = allSports[club.sport]?.color ?? '#64748b';
                    return (
                      <button
                        key={club.id}
                        onClick={() => selectClub(club)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: sportColor }}
                        >
                          {club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-white truncate">{club.name}</div>
                          <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.42)' }}>
                            {club.city} · {club.sport}
                          </div>
                        </div>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

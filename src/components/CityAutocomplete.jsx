import { useState, useRef } from 'react';
import { Z } from '../constants/zIndex.js';
import { AnimatePresence, motion } from 'framer-motion';

// Shared city autocomplete using geo.api.gouv.fr
// onSelect is called with { nom, lat, lng } when a valid commune is picked.
// onValidChange(bool) is called whenever validity changes.
export default function CityAutocomplete({
  value,
  onChange,
  onSelect,
  onValidChange,
  placeholder = 'ex. Brest',
  inputClassName,
  inputStyle,
  error,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid' | 'partial'
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const baseCls = inputClassName ??
    'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-colors';

  function handleInput(val) {
    onChange(val);
    setStatus(null);
    onValidChange?.(false);
    clearTimeout(timer.current);
    if (val.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    setStatus('checking');
    timer.current = setTimeout(async () => {
      try {
        const res  = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(val.trim())}&limit=7&boost=population&fields=nom,centre,codeDepartement`
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
        const exact = data.find(c => c.nom.toLowerCase() === val.trim().toLowerCase());
        if (exact) {
          setStatus('valid');
          onValidChange?.(true);
          onSelect?.({ nom: exact.nom, lat: exact.centre?.coordinates[1], lng: exact.centre?.coordinates[0] });
        } else {
          setStatus(data.length === 0 ? 'invalid' : 'partial');
          onValidChange?.(false);
        }
      } catch { setStatus(null); }
    }, 350);
  }

  function pick(commune) {
    onChange(commune.nom);
    setSuggestions([]);
    setOpen(false);
    setStatus('valid');
    onValidChange?.(true);
    onSelect?.({
      nom: commune.nom,
      lat: commune.centre?.coordinates[1],
      lng: commune.centre?.coordinates[0],
    });
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder={placeholder}
          className={`${baseCls} pr-8`}
          style={inputStyle}
        />

        {/* Status icon */}
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {status === 'checking' && (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          )}
          {status === 'valid' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
          {status === 'invalid' && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </span>
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {open && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden"
            style={{ zIndex: Z.dropdown, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border-s)', boxShadow: 'var(--sl-shadow-xl)' }}
          >
            {suggestions.map(c => (
              <button
                key={c.code}
                type="button"
                onMouseDown={() => pick(c)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors"
                style={{ borderBottom: '1px solid var(--sl-border)', color: 'var(--sl-t1)' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sl-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <span className="text-sm font-medium">{c.nom}</span>
                <span className="text-xs ml-2 flex-shrink-0" style={{ color: 'var(--sl-t3)' }}>dép. {c.codeDepartement}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint messages */}
      {status === 'invalid' && (
        <p className="text-xs text-orange-500 mt-1">Commune introuvable — vérifiez l'orthographe</p>
      )}
      {status === 'partial' && suggestions.length > 0 && (
        <p className="text-xs text-gray-400 mt-1">Sélectionnez une commune dans la liste</p>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

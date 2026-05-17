import { useState, useRef, useEffect, useCallback } from 'react';

// Venue autocomplete using Photon (Komoot) — free, no API key, OSM-based.
// Proximity-biased toward Finistère (lon=-4.2, lat=48.2).
// onSelect is called with { name, city, lat, lng } when the user picks a suggestion.
export default function VenueAutocomplete({ value, onChange, onSelect, placeholder, style }) {
  const [query, setQuery]           = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const timerRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  const search = useCallback(async (q) => {
    if (q.trim().length < 2) { setSuggestions([]); setOpen(false); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lon=-4.2&lat=48.2&limit=7&lang=fr`;
      const res = await fetch(url, { signal: abortRef.current.signal });
      const data = await res.json();
      const features = (data.features ?? []).filter(f => f.properties?.name).slice(0, 6);
      setSuggestions(features);
      setOpen(features.length > 0);
    } catch (e) {
      if (e.name !== 'AbortError') setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e) {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 280);
  }

  function handleSelect(feature) {
    const p = feature.properties;
    const city = p.city || p.town || p.village || p.municipality || '';
    setQuery(p.name);
    onChange(p.name);
    setSuggestions([]);
    setOpen(false);
    onSelect?.({
      name: p.name,
      city,
      lat: feature.geometry.coordinates[1],
      lng: feature.geometry.coordinates[0],
    });
  }

  function typeLabel(p) {
    const t = p.type || p.osm_value || '';
    if (t === 'stadium')        return 'Stade';
    if (t === 'sports_centre')  return 'Centre sportif';
    if (t === 'pitch')          return 'Terrain';
    if (t === 'gym')            return 'Gymnase';
    if (t === 'swimming_pool')  return 'Piscine';
    if (t === 'sports_hall')    return 'Salle';
    if (t === 'community_centre') return 'Salle communale';
    if (t === 'school' || t === 'college') return 'Établissement';
    return '';
  }

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 180)}
          placeholder={placeholder}
          style={style}
          autoComplete="off"
          spellCheck={false}
        />
        {loading && (
          <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 0.8s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          </div>
        )}
        {query && !loading && (
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); setQuery(''); onChange(''); setSuggestions([]); setOpen(false); }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--sl-t3)', display: 'flex' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 2100,
          backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)',
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 8px 28px rgba(0,0,0,0.18)',
        }}>
          {suggestions.map((f, i) => {
            const p = f.properties;
            const city = p.city || p.town || p.village || p.municipality;
            const tag = typeLabel(p);
            return (
              <button
                key={`${p.osm_id}-${i}`}
                type="button"
                onMouseDown={() => handleSelect(f)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  backgroundColor: 'transparent', color: 'var(--sl-t1)',
                  borderBottom: i < suggestions.length - 1 ? '1px solid var(--sl-border)' : 'none',
                  transition: 'background-color 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--sl-surface)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  {city && <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>{city}</div>}
                </div>
                {tag && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {tag}
                  </span>
                )}
              </button>
            );
          })}
          <div style={{ padding: '6px 12px', borderTop: '1px solid var(--sl-border)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span style={{ fontSize: 9, color: 'var(--sl-t3)' }}>OpenStreetMap via Photon · lieu non trouvé ? Saisissez-le manuellement</span>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  );
}

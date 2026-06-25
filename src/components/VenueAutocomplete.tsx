import { useState, useRef, useEffect, useCallback } from 'react';

interface VenueSelection { name: string; city: string; lat: number; lng: number; }
interface VenueAutocompleteProps {
  value:        string;
  onChange:     (v: string) => void;
  onSelect?:    (v: VenueSelection) => void;
  placeholder?: string;
  style?:       React.CSSProperties;
  cityLat?:     number;
  cityLng?:     number;
  cityName?:    string;
}

const SPORT_QUERIES = ['stade', 'gymnase', 'salle de sport', 'terrain de sport'];

function typeLabel(p: any): string {
  const t = p.type || p.osm_value || '';
  if (t === 'stadium')          return 'Stade';
  if (t === 'sports_centre')    return 'Centre sportif';
  if (t === 'pitch')            return 'Terrain';
  if (t === 'gym')              return 'Gymnase';
  if (t === 'swimming_pool')    return 'Piscine';
  if (t === 'sports_hall')      return 'Salle';
  if (t === 'community_centre') return 'Salle communale';
  if (t === 'school' || t === 'college') return 'Établissement';
  if (t === 'parking')          return 'Parking';
  if (t === 'train_station' || t === 'railway') return 'Gare';
  if (t === 'bus_stop' || t === 'bus_station')  return 'Arrêt bus';
  if (t === 'supermarket' || t === 'convenience' || t === 'mall') return 'Commerce';
  if (t === 'fuel')             return 'Station-service';
  if (t === 'restaurant' || t === 'cafe' || t === 'fast_food') return 'Restauration';
  if (t === 'house' || t === 'street' || t === 'road') return 'Adresse';
  return '';
}

function isSportType(p: any): boolean {
  const t = p.type || p.osm_value || '';
  return ['stadium','sports_centre','pitch','gym','swimming_pool','sports_hall'].includes(t);
}

export default function VenueAutocomplete({ value, onChange, onSelect, placeholder, style, cityLat, cityLng, cityName }: VenueAutocompleteProps) {
  const [query,          setQuery]          = useState(value || '');
  const [suggestions,    setSuggestions]    = useState<any[]>([]);
  const [citySuggestions,setCitySuggestions]= useState<any[]>([]);
  const [open,           setOpen]           = useState(false);
  const [loading,        setLoading]        = useState(false);
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef  = useRef<AbortController | null>(null);
  const cityAbort = useRef<AbortController | null>(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  // ── Chargement automatique des lieux sportifs proches de la ville ─────────
  useEffect(() => {
    if (!cityLat || !cityLng) return;
    cityAbort.current?.abort();
    cityAbort.current = new AbortController();
    const signal = cityAbort.current.signal;

    // Bounding box ~15km autour du centre-ville
    const D = 0.14;
    const bbox = `${cityLng - D},${cityLat - D},${cityLng + D},${cityLat + D}`;

    async function fetchCitySuggestions() {
      try {
        const results = await Promise.all(
          SPORT_QUERIES.map(q =>
            fetch(
              `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&bbox=${bbox}&limit=4&lang=fr`,
              { signal },
            ).then(r => r.json()).catch(() => ({ features: [] })),
          ),
        );
        const seen = new Set<string>();
        const merged: any[] = [];
        for (const res of results) {
          for (const f of res.features ?? []) {
            const name = f.properties?.name;
            if (!name || seen.has(name)) continue;
            seen.add(name);
            merged.push(f);
          }
        }
        // Trier : lieux sportifs en premier
        merged.sort((a, b) => {
          const sa = isSportType(a.properties) ? 0 : 1;
          const sb = isSportType(b.properties) ? 0 : 1;
          return sa - sb;
        });
        setCitySuggestions(merged.slice(0, 8));
      } catch {
        /* AbortError ou réseau — silent */
      }
    }

    fetchCitySuggestions();
    return () => { cityAbort.current?.abort(); };
  }, [cityLat, cityLng]);

  // ── Recherche libre (l'utilisateur tape) ─────────────────────────────────
  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const lat = cityLat ?? 48.2;
      const lon = cityLng ?? -4.2;
      const res  = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lon=${lon}&lat=${lat}&limit=7&lang=fr`,
        { signal: abortRef.current.signal },
      );
      const data = await res.json();
      setSuggestions((data.features ?? []).filter((f: any) => f.properties?.name).slice(0, 6));
    } catch (e: any) {
      if (e.name !== 'AbortError') setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [cityLat, cityLng]);

  useEffect(() => {
    if (query.trim().length >= 2) search(query);
  }, [cityLat, cityLng]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    onChange(q);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => search(q), 280);
  }

  function handleFocus() {
    // Si l'input est vide, montrer les suggestions pré-chargées de la ville
    if (!query.trim() && citySuggestions.length > 0) {
      setOpen(true);
    } else if (suggestions.length > 0) {
      setOpen(true);
    }
  }

  function handleSelect(feature: any) {
    const p    = feature.properties;
    const city = p.city || p.town || p.village || p.municipality || '';
    setQuery(p.name);
    onChange(p.name);
    setSuggestions([]);
    setOpen(false);
    onSelect?.({ name: p.name, city, lat: feature.geometry.coordinates[1], lng: feature.geometry.coordinates[0] });
  }

  // Suggestions à afficher : recherche libre si l'utilisateur tape, sinon suggestions de la ville
  const displaySuggestions = query.trim().length >= 2 ? suggestions : citySuggestions;
  const isCityMode = query.trim().length < 2;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
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
            onMouseDown={e => { e.preventDefault(); setQuery(''); onChange(''); setSuggestions([]); setOpen(citySuggestions.length > 0); }}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--sl-t3)', display: 'flex' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        )}
      </div>

      {open && displaySuggestions.length > 0 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 2100, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}>
          {isCityMode && cityName && (
            <div style={{ padding: '7px 14px 5px', display: 'flex', alignItems: 'center', gap: 5, borderBottom: '1px solid var(--sl-border)' }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--sl-green)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 1 8 8c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 8-8z"/></svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-green)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Lieux sportifs · {cityName}
              </span>
            </div>
          )}
          {displaySuggestions.map((f: any, i: number) => {
            const p    = f.properties;
            const city = p.city || p.town || p.village || p.municipality;
            const tag  = typeLabel(p);
            const sport = isSportType(p);
            return (
              <button
                key={`${p.osm_id}-${i}`}
                type="button"
                onMouseDown={() => handleSelect(f)}
                style={{ width: '100%', textAlign: 'left', padding: '10px 14px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'transparent', color: 'var(--sl-t1)', borderBottom: i < displaySuggestions.length - 1 ? '1px solid var(--sl-border)' : 'none', transition: 'background-color 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--sl-surface)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={sport ? 'var(--sl-green)' : 'var(--sl-t3)'} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                  {city && <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>{city}</div>}
                </div>
                {tag && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, backgroundColor: sport ? 'var(--sl-green-dim)' : 'var(--sl-surface)', color: sport ? 'var(--sl-green)' : 'var(--sl-t3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
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

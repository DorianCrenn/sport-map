import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseICS, fetchICSFromURL, type ICSEvent } from '../utils/parseICS.js';

interface ICSImportModalProps {
  clubId: string;
  onImport: (events: ICSEvent[]) => Promise<void>;
  onClose: () => void;
}

type Tab = 'file' | 'url';
type Phase = 'idle' | 'loading' | 'preview' | 'importing' | 'done';

export default function ICSImportModal({ clubId: _clubId, onImport, onClose }: ICSImportModalProps) {
  const [tab,           setTab]           = useState<Tab>('file');
  const [phase,         setPhase]         = useState<Phase>('idle');
  const [events,        setEvents]        = useState<ICSEvent[]>([]);
  const [selected,      setSelected]      = useState<Set<string>>(new Set());
  const [error,         setError]         = useState<string | null>(null);
  const [urlInput,      setUrlInput]      = useState('');
  const [isDragging,    setIsDragging]    = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  function loadEvents(parsed: ICSEvent[]) {
    setEvents(parsed);
    setSelected(new Set(parsed.map((e, i) => e.uid ?? String(i))));
    setPhase('preview');
    setError(null);
  }

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.ics') && file.type !== 'text/calendar') {
      setError('Fichier non reconnu. Choisissez un fichier .ics');
      return;
    }
    setPhase('loading');
    try {
      const text = await file.text();
      if (!text.includes('BEGIN:VCALENDAR')) { setError('Fichier ICS invalide ou vide'); setPhase('idle'); return; }
      const parsed = parseICS(text);
      if (!parsed.length) { setError('Aucun événement trouvé dans ce fichier'); setPhase('idle'); return; }
      loadEvents(parsed);
    } catch { setError('Erreur de lecture du fichier'); setPhase('idle'); }
  }

  async function handleURLFetch() {
    if (!urlInput.trim()) return;
    setPhase('loading'); setError(null);
    try {
      const parsed = await fetchICSFromURL(urlInput.trim());
      if (!parsed.length) { setError('Aucun événement trouvé à cette URL'); setPhase('idle'); return; }
      loadEvents(parsed);
    } catch (e: any) {
      const msg = e.message?.includes('Failed to fetch') || e.message?.includes('CORS')
        ? 'CORS bloqué — téléchargez le fichier .ics et importez-le via l\'onglet Fichier'
        : `Erreur : ${e.message}`;
      setError(msg); setPhase('idle');
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleImport() {
    const toImport = events.filter((e, i) => selected.has(e.uid ?? String(i)));
    if (!toImport.length) return;
    setPhase('importing');
    try {
      await onImport(toImport);
      setImportedCount(toImport.length);
      setPhase('done');
    } catch (e: any) { setError(e.message ?? 'Erreur à l\'import'); setPhase('preview'); }
  }

  function toggleEvent(key: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const inputStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '10px 12px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t1)', fontSize: 13, outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        style={{ width: '100%', maxWidth: 500, backgroundColor: 'var(--sl-card)', borderRadius: '20px 20px 0 0', padding: '20px 20px calc(28px + env(safe-area-inset-bottom, 0px))', maxHeight: '92vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)' }}>Importer un calendrier</div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>Fichier .ics ou lien de calendrier</div>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 'var(--sl-radius-md)', border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t3)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>

        <AnimatePresence mode="wait">
          {phase === 'done' ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📅</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 6 }}>
                {importedCount} événement{importedCount > 1 ? 's' : ''} importé{importedCount > 1 ? 's' : ''}
              </div>
              <button onClick={onClose} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 'var(--sl-radius-lg)', border: 'none', backgroundColor: 'var(--sl-accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Terminé
              </button>
            </motion.div>
          ) : phase === 'preview' ? (
            <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t2)' }}>
                  {events.length} événement{events.length > 1 ? 's' : ''} trouvé{events.length > 1 ? 's' : ''}
                </div>
                <button onClick={() => {
                  const allKeys = events.map((e, i) => e.uid ?? String(i));
                  if (selected.size === events.length) setSelected(new Set()); else setSelected(new Set(allKeys));
                }} style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-accent)', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', padding: '4px 8px' }}>
                  {selected.size === events.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
              </div>

              <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {events.map((ev, i) => {
                  const key = ev.uid ?? String(i);
                  const isSelected = selected.has(key);
                  const d = new Date(ev.date);
                  const dateStr = isNaN(d.getTime()) ? ev.date : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: ev.allDay ? undefined : '2-digit', minute: ev.allDay ? undefined : '2-digit' });
                  return (
                    <button key={key} onClick={() => toggleEvent(key)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 'var(--sl-radius-lg)', border: `1.5px solid ${isSelected ? 'var(--sl-accent)' : 'var(--sl-border)'}`, backgroundColor: isSelected ? 'rgba(99,102,241,0.06)' : 'var(--sl-surface)', cursor: 'pointer', textAlign: 'left', transition: 'all 0.1s' }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: 'var(--sl-radius-xs)', border: `2px solid ${isSelected ? 'var(--sl-accent)' : 'var(--sl-border)'}`, backgroundColor: isSelected ? 'var(--sl-accent)' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                        <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1, display: 'flex', gap: 6 }}>
                          <span>📅 {dateStr}</span>
                          {ev.venue && <span>📍 {ev.venue}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && <div style={{ padding: '8px 12px', borderRadius: 'var(--sl-radius-md)', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: 12 }}>{error}</div>}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setPhase('idle'); setEvents([]); setError(null); }}
                  style={{ flex: 1, padding: '11px', borderRadius: 'var(--sl-radius-lg)', border: '1px solid var(--sl-border)', backgroundColor: 'transparent', color: 'var(--sl-t2)', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button onClick={handleImport} disabled={selected.size === 0}
                  style={{ flex: 2, padding: '11px', borderRadius: 'var(--sl-radius-lg)', border: 'none', backgroundColor: selected.size > 0 ? 'var(--sl-accent)' : 'var(--sl-border)', color: selected.size > 0 ? '#fff' : 'var(--sl-t3)', fontSize: 13, fontWeight: 800, cursor: selected.size > 0 ? 'pointer' : 'not-allowed' }}>
                  {`Importer ${selected.size} événement${selected.size > 1 ? 's' : ''}`}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Tabs */}
              <div style={{ display: 'flex', backgroundColor: 'var(--sl-surface)', borderRadius: 'var(--sl-radius-lg)', padding: 3, gap: 2 }}>
                {(['file', 'url'] as Tab[]).map(t => (
                  <button key={t} onClick={() => { setTab(t); setError(null); }}
                    style={{ flex: 1, padding: '8px', borderRadius: 'var(--sl-radius-md)', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', backgroundColor: tab === t ? 'var(--sl-card)' : 'transparent', color: tab === t ? 'var(--sl-t1)' : 'var(--sl-t3)' }}>
                    {t === 'file' ? '📂 Fichier .ics' : '🔗 URL de calendrier'}
                  </button>
                ))}
              </div>

              {tab === 'file' ? (
                <>
                  <div
                    onDragEnter={() => setIsDragging(true)}
                    onDragLeave={() => setIsDragging(false)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={onDrop}
                    onClick={() => fileRef.current?.click()}
                    style={{ border: `2px dashed ${isDragging ? 'var(--sl-accent)' : 'var(--sl-border)'}`, borderRadius: 'var(--sl-radius-2xl)', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', backgroundColor: isDragging ? 'rgba(99,102,241,0.05)' : 'var(--sl-surface)', transition: 'all 0.15s' }}
                  >
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 4 }}>
                      {phase === 'loading' ? 'Lecture en cours…' : 'Glissez un fichier .ics ici'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>ou cliquez pour choisir un fichier</div>
                    <input ref={fileRef} type="file" accept=".ics,text/calendar" style={{ display: 'none' }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
                    Compatible Google Calendar, Apple Calendar, Outlook, etc. — exportez votre agenda au format .ics puis importez-le ici.
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--sl-t2)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>
                      URL du calendrier (.ics)
                    </label>
                    <input
                      value={urlInput} onChange={e => setUrlInput(e.target.value)}
                      placeholder="https://calendar.google.com/calendar/ical/…/basic.ics"
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
                    Collez l'adresse du flux iCal. Note : certains calendriers privés bloquent les imports directs (CORS). Si ça échoue, téléchargez le fichier .ics et utilisez l'onglet Fichier.
                  </div>
                  <button onClick={handleURLFetch} disabled={!urlInput.trim() || phase === 'loading'}
                    style={{ padding: '12px', borderRadius: 'var(--sl-radius-lg)', border: 'none', backgroundColor: urlInput.trim() ? 'var(--sl-accent)' : 'var(--sl-border)', color: urlInput.trim() ? '#fff' : 'var(--sl-t3)', fontSize: 13, fontWeight: 800, cursor: urlInput.trim() ? 'pointer' : 'not-allowed' }}>
                    {phase === 'loading' ? '⏳ Chargement…' : '🔗 Charger le calendrier'}
                  </button>
                </>
              )}

              {error && (
                <div style={{ padding: '10px 12px', borderRadius: 'var(--sl-radius-lg)', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: 12, lineHeight: 1.5 }}>
                  {error}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

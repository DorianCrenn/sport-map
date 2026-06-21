import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Z } from '../constants/zIndex.js';
import { useClubs } from '../hooks/useClubs.js';
import { useSports } from '../hooks/useSports.js';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += ch; }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): Record<string, any>[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  return lines.slice(1).map((line, i) => {
    const values = parseCSVLine(line);
    const row: Record<string, any> = {};
    headers.forEach((h, j) => { row[h] = (values[j] ?? '').trim().replace(/^["']|["']$/g, ''); });
    row._line = i + 2;
    return row;
  });
}

function parseDate(dateStr: string, timeStr: string): string | null {
  if (!dateStr) return null;
  let iso: string;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/');
    iso = `${y}-${m}-${d}`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    iso = dateStr;
  } else {
    return null;
  }
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  if (timeStr && /^\d{1,2}:\d{2}$/.test(timeStr.trim())) {
    const [h, m] = timeStr.trim().split(':').map(Number);
    d.setHours(h, m, 0, 0);
  } else {
    d.setHours(15, 0, 0, 0);
  }
  return d.toISOString().slice(0, 16);
}

const TYPE_MAP: Record<string, string> = {
  championship: 'championship', championnat: 'championship', champ: 'championship',
  cup: 'cup', coupe: 'cup',
  friendly: 'friendly', amical: 'friendly',
};

function rowToEvent(row: Record<string, any>, club: Record<string, any> | null): Record<string, any> {
  const date = parseDate(row.date, row.heure ?? row.time ?? '');
  if (!date) return { error: 'Date invalide (attendu DD/MM/YYYY ou YYYY-MM-DD)' };

  const adversaire = row.adversaire ?? row.opponent ?? '';
  const equipe     = row.equipe    ?? row.team     ?? '';
  const rawTitle   = row.titre     ?? row.title    ?? '';
  const title      = rawTitle || (equipe && adversaire ? `${equipe} vs ${adversaire}` : adversaire ? `vs ${adversaire}` : '');
  if (!title) return { error: 'adversaire ou titre manquant' };

  const typeRaw  = (row.type ?? row.eventtype ?? 'championship').toLowerCase();
  const eventType = TYPE_MAP[typeRaw] ?? 'championship';

  const isHomeRaw = (row.domicile ?? row.home ?? 'oui').toLowerCase();
  const isHome    = ['oui', 'yes', 'true', '1', 'o'].includes(isHomeRaw);

  return {
    title,
    date,
    sport:     club?.sport ?? row.sport ?? '',
    city:      isHome ? (club?.city ?? row.ville ?? row.city ?? '') : (row.ville ?? row.city ?? ''),
    venue:     row.lieu ?? row.venue ?? '',
    teamName:  equipe,
    category:  row.categorie ?? row.category ?? '',
    eventType,
    clubId:    club?.id ?? null,
    lat:       club?.lat ?? null,
    lng:       club?.lng ?? null,
  };
}

interface CSVImportModalProps {
  onBulkSave: (events: Record<string, any>[]) => Promise<void>;
  onClose: () => void;
}

export default function CSVImportModal({ onBulkSave, onClose }: CSVImportModalProps) {
  const { userClubs } = useClubs() as any;
  const { allSports: SPORTS } = useSports() as any;
  const myClub = userClubs[0] ?? null;
  const sportColor = myClub ? (SPORTS[myClub.sport]?.color ?? '#22d96a') : '#22d96a';

  const [rows, setRows]           = useState<Record<string, any>[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults]     = useState<Record<string, any>[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target?.result as string);
      setRows(parsed.map(row => {
        const ev = rowToEvent(row, myClub);
        return { ...row, _event: ev.error ? null : ev, _error: ev.error ?? null };
      }));
      setResults(null);
    };
    reader.readAsText(file, 'UTF-8');
  }

  const validRows   = rows.filter(r => r._event);
  const invalidRows = rows.filter(r => r._error);

  async function handleImport() {
    setImporting(true);
    try {
      await onBulkSave(validRows.map(r => r._event));
      setResults(validRows.map(r => ({ title: r._event.title, ok: true })));
    } catch (err: any) {
      setResults(validRows.map(r => ({ title: r._event.title, ok: false, error: err.message })));
    }
    setImporting(false);
  }

  const okCount  = results?.filter(r => r.ok).length  ?? 0;
  const errCount = results?.filter(r => !r.ok).length ?? 0;

  return (
    <motion.div
      key="csv-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: (Z as any).formModal, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
    >
      <motion.div
        key="csv-sheet"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        style={{ width: '100%', maxWidth: 520, borderRadius: '22px 22px 0 0', backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', maxHeight: '90dvh', display: 'flex', flexDirection: 'column', paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}
      >
        <div style={{ padding: '14px 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: 'var(--sl-border-s)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px 10px', flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--sl-t1)' }}>Import CSV</div>
            <div style={{ fontSize: 12, color: 'var(--sl-t3)', marginTop: 2 }}>Importer plusieurs matchs en une fois</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '0 20px 24px' }}>
          {results ? (
            <>
              <div style={{ textAlign: 'center', padding: '20px 0 24px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--sl-t1)' }}>Import terminé</div>
                <div style={{ fontSize: 13, color: 'var(--sl-t3)', marginTop: 4 }}>
                  {okCount} importé{okCount !== 1 ? 's' : ''}
                  {errCount > 0 && ` · ${errCount} échec${errCount !== 1 ? 's' : ''}`}
                </div>
              </div>

              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--sl-border)', marginBottom: 20 }}>
                {results.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < results.length - 1 ? '1px solid var(--sl-border)' : 'none' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: r.ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)' }}>
                      {r.ok
                        ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                      {!r.ok && <div style={{ fontSize: 10, color: '#ef4444', marginTop: 1 }}>{r.error}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={onClose} style={{ width: '100%', padding: '13px 0', borderRadius: 14, border: 'none', cursor: 'pointer', backgroundColor: sportColor, color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: `0 4px 16px ${sportColor}40` }}>
                Fermer
              </button>
            </>
          ) : (
            <>
              <div style={{ borderRadius: 12, padding: '12px 14px', marginBottom: 16, backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 8 }}>Format CSV attendu</div>
                <code style={{ fontSize: 10, color: 'var(--sl-t2)', display: 'block', lineHeight: 1.7, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {`date,heure,adversaire,equipe,lieu,type,domicile\n20/05/2026,18:00,Quimper FC,Seniors A,Stade Mun.,championship,oui`}
                </code>
                <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 8, lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--sl-t2)' }}>type</strong> : championship · cup · friendly (ou championnat · coupe · amical)<br />
                  <strong style={{ color: 'var(--sl-t2)' }}>date</strong> : DD/MM/YYYY ou YYYY-MM-DD · Sport et ville auto-remplis depuis ton club
                </div>
              </div>

              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: 'none' }} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{ width: '100%', padding: '16px 0', borderRadius: 14, border: `2px dashed ${sportColor}55`, cursor: 'pointer', backgroundColor: `${sportColor}08`, color: sportColor, fontWeight: 700, fontSize: 14, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {rows.length > 0 ? 'Changer de fichier' : 'Choisir un fichier CSV'}
              </button>

              {rows.length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                    <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 20, color: '#22c55e', lineHeight: 1 }}>{validRows.length}</div>
                      <div style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600, marginTop: 2 }}>Valide{validRows.length !== 1 ? 's' : ''}</div>
                    </div>
                    {invalidRows.length > 0 && (
                      <div style={{ flex: 1, padding: '10px 12px', borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: 20, color: '#ef4444', lineHeight: 1 }}>{invalidRows.length}</div>
                        <div style={{ fontSize: 10, color: 'var(--sl-t3)', fontWeight: 600, marginTop: 2 }}>Erreur{invalidRows.length !== 1 ? 's' : ''}</div>
                      </div>
                    )}
                  </div>

                  <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--sl-border)', marginBottom: 20 }}>
                    {rows.map((row, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderBottom: i < rows.length - 1 ? '1px solid var(--sl-border)' : 'none', backgroundColor: row._error ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: row._error ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)' }}>
                          {row._error
                            ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {row._event?.title ?? row.adversaire ?? row.titre ?? `Ligne ${row._line}`}
                          </div>
                          {row._error
                            ? <div style={{ fontSize: 10, color: '#ef4444', marginTop: 1 }}>{row._error}</div>
                            : <div style={{ fontSize: 10, color: 'var(--sl-t3)', marginTop: 1 }}>
                                {row._event?.date?.slice(0, 10)} · {row._event?.eventType}
                                {row._event?.teamName && ` · ${row._event.teamName}`}
                              </div>
                          }
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleImport}
                    disabled={validRows.length === 0 || importing}
                    style={{
                      width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                      cursor: validRows.length === 0 || importing ? 'not-allowed' : 'pointer',
                      backgroundColor: validRows.length > 0 ? sportColor : 'var(--sl-surface)',
                      color: validRows.length > 0 ? '#fff' : 'var(--sl-t3)',
                      fontWeight: 700, fontSize: 14, opacity: importing ? 0.7 : 1,
                      boxShadow: validRows.length > 0 ? `0 4px 16px ${sportColor}40` : 'none',
                      transition: 'opacity 0.15s',
                    }}
                  >
                    {importing ? 'Import en cours…' : `Importer ${validRows.length} match${validRows.length !== 1 ? 's' : ''}`}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

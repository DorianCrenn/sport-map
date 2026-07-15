import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MatchesBlock from './blocks/MatchesBlock.jsx';

const DAY_IDX: Record<string, number> = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0 };
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const BLANK_TR = { id: '', day: 'Lundi', time: '18:00', location: '' };

interface Session { id: string; day: string; time: string; location: string }
interface Team { id: string; name: string; category?: string }

function TrainingCalendarGenerator({ sessions, club, team, onGenerate }: { sessions: Session[]; club: Record<string, any>; team: Team; onGenerate?: ((events: Record<string, any>[]) => void) | null }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo]     = useState('');

  if (!sessions.length || !onGenerate) return null;

  function countOccurrences() {
    if (!from || !to) return 0;
    let n = 0;
    const toDate = new Date(to + 'T23:59:59');
    for (const s of sessions) {
      let cur = new Date(from);
      while (cur.getDay() !== DAY_IDX[s.day] && cur <= toDate) cur.setDate(cur.getDate() + 1);
      while (cur <= toDate && n < 200) { n++; cur = new Date(cur.getTime() + 7 * 86400000); }
    }
    return n;
  }

  function generate() {
    if (!from || !to) return;
    const toDate = new Date(to + 'T23:59:59');
    const events: Record<string, any>[] = [];
    const base = `training_${team.id}_${Date.now()}`;
    const _p = (n: number) => String(n).padStart(2, '0');
    const _tzOff    = -new Date().getTimezoneOffset();
    const _tzSuffix = `${_tzOff >= 0 ? '+' : '-'}${_p(Math.floor(Math.abs(_tzOff) / 60))}:${_p(Math.abs(_tzOff) % 60)}`;
    for (const s of sessions) {
      let cur = new Date(from);
      while (cur.getDay() !== DAY_IDX[s.day] && cur <= toDate) cur.setDate(cur.getDate() + 1);
      while (cur <= toDate && events.length < 200) {
        const localDate = `${cur.getFullYear()}-${_p(cur.getMonth() + 1)}-${_p(cur.getDate())}`;
        events.push({
          title: `Entraînement ${team.name}`,
          sport: club.sport, sportGroup: club.sport,
          date: `${localDate}T${s.time}:00${_tzSuffix}`,
          city: club.city ?? '', lat: club.lat ?? 48.3904, lng: club.lng ?? -4.4861,
          venue: s.location, description: `Entraînement — ${team.name}`,
          eventType: 'friendly',
          teamName: team.name, category: team.category ?? '',
          clubId: club.id, seriesId: `${base}_${s.id}`,
        });
        cur = new Date(cur.getTime() + 7 * 86400000);
      }
    }
    onGenerate(events);
    setOpen(false); setFrom(''); setTo('');
  }

  const count = countOccurrences();
  const inputSt: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', borderRadius: 'var(--sl-radius-lg)', padding: '8px 10px', fontSize: 12,
    backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)',
    color: 'var(--sl-t1)', colorScheme: 'dark', outline: 'none',
  };

  return (
    <div style={{ marginTop: 8, borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: open ? 'rgba(59,130,246,0.08)' : 'var(--sl-surface)', border: 'none', cursor: 'pointer', color: open ? '#3b82f6' : 'var(--sl-t2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <span style={{ fontSize: 12, fontWeight: 600 }}>Générer dans le calendrier</span>
        </div>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--sl-t3)', margin: 0 }}>Crée automatiquement un événement d'entraînement par créneau, chaque semaine, dans la plage choisie.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 4 }}>Du</label>
                  <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={inputSt} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 4 }}>Au</label>
                  <input type="date" value={to} onChange={e => setTo(e.target.value)} min={from || undefined} style={inputSt} />
                </div>
              </div>
              {from && to && (
                <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: count > 0 ? '#3b82f6' : 'var(--sl-t3)' }}>
                  {count > 0 ? `${count} entraînement${count > 1 ? 's' : ''} seront créés` : 'Aucun créneau dans cette plage'}
                </p>
              )}
              <button disabled={count === 0} onClick={generate} style={{ padding: '9px 0', borderRadius: 'var(--sl-radius-lg)', border: 'none', fontSize: 12, fontWeight: 700, transition: 'all 0.15s', cursor: count > 0 ? 'pointer' : 'not-allowed', backgroundColor: count > 0 ? '#3b82f6' : 'var(--sl-border)', color: count > 0 ? '#fff' : 'var(--sl-t3)' }}>
                {count > 0 ? `Créer ${count} entraînement${count > 1 ? 's' : ''}` : 'Sélectionnez une plage'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamTrainingSection({ sessions, isEditing, onChange }: { sessions: Session[]; isEditing?: boolean; onChange: (s: Session[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK_TR });
  function setF(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  function add() {
    if (!form.location.trim()) return;
    onChange([...sessions, { ...form, id: `tr_${Date.now()}` }]);
    setForm({ ...BLANK_TR });
    setShowForm(false);
  }

  function remove(id: string) { onChange(sessions.filter(s => s.id !== id)); }

  const inputCls = 'w-full text-sm rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400/40';
  const inputStyle = { backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t1)' };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sl-t3)' }}>Entraînements</span>
        {sessions.length > 0 && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>{sessions.length}</span>
        )}
      </div>

      {sessions.length === 0 && !showForm && (
        <p className="text-xs italic text-center py-4 rounded-xl mb-3" style={{ color: 'var(--sl-t3)', border: '2px dashed var(--sl-border)' }}>
          {isEditing ? "Ajoutez les créneaux d'entraînement" : 'Aucun entraînement planifié'}
        </p>
      )}

      {sessions.length > 0 && (
        <div className="space-y-2 mb-3">
          {sessions.map(s => (
            <div key={s.id} className="rounded-xl px-3 py-2.5 flex items-center gap-3" style={{ backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)', boxShadow: 'var(--sl-shadow)' }}>
              <div className="w-10 text-center flex-shrink-0">
                <div className="text-[9px] font-bold uppercase leading-none" style={{ color: 'var(--sl-t3)' }}>{s.day.slice(0, 3)}</div>
                <div className="text-xs font-bold mt-0.5" style={{ color: 'var(--sl-t1)' }}>{s.time}</div>
              </div>
              <div className="w-px h-8 flex-shrink-0" style={{ backgroundColor: 'var(--sl-border)' }} />
              <div className="flex-1 text-sm truncate" style={{ color: 'var(--sl-t2)' }}>{s.location}</div>
              {isEditing && (
                <button onClick={() => remove(s.id)} aria-label="Supprimer ce créneau" className="p-1.5 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--sl-t3)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--sl-t3)'; e.currentTarget.style.backgroundColor = 'transparent'; }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isEditing && showForm && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }} className="rounded-2xl p-3 space-y-2 mb-3" style={{ border: '1px solid rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.06)' }}>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--sl-t3)' }}>Jour</label>
                <select value={form.day} onChange={e => setF('day', e.target.value)} className={inputCls} style={inputStyle}>
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--sl-t3)' }}>Heure</label>
                <input type="time" value={form.time} onChange={e => setF('time', e.target.value)} className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' } as React.CSSProperties} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--sl-t3)' }}>Lieu *</label>
              <input type="text" value={form.location} onChange={e => setF('location', e.target.value)} placeholder="ex. Gymnase Jean Macé" className={inputCls} style={inputStyle} />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setShowForm(false); setForm({ ...BLANK_TR }); }} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer" style={{ border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)' }}>Annuler</button>
              <button onClick={add} className="flex-1 py-2 rounded-xl text-xs font-bold text-white transition-colors cursor-pointer" style={{ backgroundColor: '#3b82f6' }}>Ajouter</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isEditing && !showForm && (
        <button onClick={() => setShowForm(true)} className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer" style={{ border: '2px dashed var(--sl-border)', color: 'var(--sl-t3)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.color = 'var(--sl-t3)'; }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un créneau
        </button>
      )}
    </div>
  );
}

interface TeamViewProps {
  team: Team;
  blocks: Record<string, any>[];
  isEditing?: boolean;
  updateBlock: (id: string, patch: Record<string, any>) => void;
  addBlock: (type: string, afterId: string | null) => void;
  club: Record<string, any>;
  allEvents?: Record<string, any>[];
  trainings: Record<string, Session[]>;
  onUpdateTrainings: (t: Record<string, Session[]>) => void;
  onAddEventForTeam?: (team: Team) => void;
  canAddEvent?: boolean;
  onBulkAddTrainingEvents?: ((events: Record<string, any>[]) => void) | null;
}

export default function TeamView({ team, blocks, isEditing, updateBlock, addBlock, club, allEvents, trainings, onUpdateTrainings, onAddEventForTeam, canAddEvent, onBulkAddTrainingEvents }: TeamViewProps) {
  const matchesBlock = blocks.find(b => b.type === 'matches');
  const teamSessions: Session[] = trainings[team.id] ?? [];

  function updateSessions(sessions: Session[]) {
    onUpdateTrainings({ ...trainings, [team.id]: sessions });
  }

  return (
    <div className="px-4 py-5 space-y-6 overflow-x-hidden">
      {canAddEvent && onAddEventForTeam && (
        <button onClick={() => onAddEventForTeam(team)} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all cursor-pointer" style={{ backgroundColor: '#1e293b', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter un événement pour {team.name}
        </button>
      )}

      <TeamTrainingSection sessions={teamSessions} isEditing={isEditing} onChange={updateSessions} />
      {!isEditing && (
        <TrainingCalendarGenerator sessions={teamSessions} club={club} team={team} onGenerate={onBulkAddTrainingEvents ?? null} />
      )}

      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--sl-t3)' }}>Matchs</span>
        </div>
        {matchesBlock ? (
          <MatchesBlock data={matchesBlock.data} isEditing={isEditing} onUpdate={patch => updateBlock(matchesBlock.id, patch)} club={club} filterTeamId={team.id} allEvents={allEvents} />
        ) : isEditing ? (
          <button onClick={() => addBlock('matches', null)} className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-xs transition-colors cursor-pointer" style={{ border: '2px dashed var(--sl-border)', color: 'var(--sl-t3)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#22C55E'; e.currentTarget.style.color = '#22C55E'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--sl-border)'; e.currentTarget.style.color = 'var(--sl-t3)'; }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Activer les matchs pour ce club
          </button>
        ) : (
          <p className="text-xs italic text-center py-6 rounded-2xl" style={{ color: 'var(--sl-t3)', border: '2px dashed var(--sl-border)' }}>Aucun match enregistré</p>
        )}
      </div>
    </div>
  );
}

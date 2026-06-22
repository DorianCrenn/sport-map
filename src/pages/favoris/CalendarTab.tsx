import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../../hooks/useSports.js';
import { downloadICS } from '../../utils/exportICS.js';

interface CalSvgProps {
  size?: number;
}

const CalSvg = ({ size = 11 }: CalSvgProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const WEEK_DAYS  = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MONTHS_FR  = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function buildGrid(date: Date): (number | null)[] {
  const year = date.getFullYear();
  const m    = date.getMonth();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  let firstDow = new Date(year, m, 1).getDay();
  firstDow = firstDow === 0 ? 6 : firstDow - 1;
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface CalendarTabProps {
  allEvents: Record<string, any>[];
  favorites: Set<string>;
}

export default function CalendarTab({ allEvents, favorites }: CalendarTabProps) {
  const { allSports: SPORTS } = useSports() as any;
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const calEvents = useMemo(() =>
    allEvents
      .filter(e => favorites.has(String(e.id)))
      .filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === viewMonth.getFullYear() && d.getMonth() === viewMonth.getMonth();
      }),
    [allEvents, favorites, viewMonth]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<number, any[]>();
    for (const ev of calEvents) {
      const day = new Date(ev.date).getDate();
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(ev);
    }
    return map;
  }, [calEvents]);

  const cells = useMemo(() => buildGrid(viewMonth), [viewMonth]);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === viewMonth.getFullYear() && today.getMonth() === viewMonth.getMonth();
  const dayEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];

  function prevMonth() { setViewMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)); setSelectedDay(null); }
  function nextMonth() { setViewMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)); setSelectedDay(null); }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px calc(90px + env(safe-area-inset-bottom, 0px))', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={prevMonth} style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--sl-t1)' }}>{MONTHS_FR[viewMonth.getMonth()]}</div>
          <div style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{viewMonth.getFullYear()} · {calEvents.length} favori{calEvents.length !== 1 ? 's' : ''}</div>
        </div>
        <button onClick={nextMonth} style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid var(--sl-border-s)', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      {/* Calendar grid */}
      <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid var(--sl-border)', backgroundColor: 'var(--sl-card)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--sl-border)' }}>
          {WEEK_DAYS.map(d => (
            <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 10, fontWeight: 700, color: 'var(--sl-t3)', letterSpacing: '0.05em' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} style={{ minHeight: 48, borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--sl-border)', borderBottom: idx < cells.length - 7 ? '1px solid var(--sl-border)' : 'none' }} />;
            const isToday  = isCurrentMonth && day === today.getDate();
            const evs      = eventsByDay.get(day) ?? [];
            const isSelected = selectedDay === day;
            const colors   = evs.slice(0, 3).map((e: any) => SPORTS[e.sport]?.color ?? '#22d96a');
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : day)}
                style={{
                  minHeight: 48, padding: '6px 4px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  cursor: evs.length > 0 || isToday ? 'pointer' : 'default',
                  backgroundColor: isSelected ? 'rgba(59,130,246,0.1)' : 'transparent',
                  border: 'none',
                  borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid var(--sl-border)',
                  borderBottom: Math.floor(idx / 7) < Math.floor(cells.length / 7) - 1 ? '1px solid var(--sl-border)' : 'none',
                  transition: 'background-color 0.12s',
                }}
              >
                <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: isToday || evs.length > 0 ? 700 : 400, backgroundColor: isToday ? '#3b82f6' : 'transparent', color: isToday ? '#fff' : evs.length > 0 ? 'var(--sl-t1)' : 'var(--sl-t3)' }}>
                  {day}
                </div>
                {colors.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                    {colors.map((c: string, i: number) => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: c }} />)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sl-t3)', marginBottom: 10 }}>
              {selectedDay} {MONTHS_FR[viewMonth.getMonth()]}
            </div>
            {dayEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t2)', fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 4 }}>Rien ce jour-là</p>
                <p style={{ fontSize: 12, color: 'var(--sl-t3)' }}>Aucun favori pour cette date</p>
              </div>
            ) : (
              dayEvents.map((ev: any) => {
                const sportColor = SPORTS[ev.sport]?.color ?? '#22d96a';
                const d = new Date(ev.date);
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', marginBottom: 8, borderRadius: 12, backgroundColor: 'var(--sl-card)', border: '1px solid var(--sl-border)' }}>
                    <div style={{ width: 3, height: 36, borderRadius: 2, backgroundColor: sportColor, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 5, color: sportColor, backgroundColor: `${sportColor}18` }}>{ev.sport}</span>
                      </div>
                    </div>
                    <button onClick={() => downloadICS(ev)} title="Ajouter au calendrier"
                      style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--sl-border-s)', backgroundColor: 'transparent', cursor: 'pointer', color: 'var(--sl-t3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CalSvg size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {calEvents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', padding: '32px 24px' }}
        >
          <div style={{ fontSize: 28, marginBottom: 12 }}>📅</div>
          <p style={{ fontSize: 16, fontWeight: 900, color: 'var(--sl-t1)', fontFamily: "'Barlow Condensed', sans-serif", marginBottom: 6 }}>
            Mois vierge
          </p>
          <p style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
            Aucun favori ce mois-ci — explore la carte pour en ajouter.
          </p>
        </motion.div>
      )}
    </div>
  );
}

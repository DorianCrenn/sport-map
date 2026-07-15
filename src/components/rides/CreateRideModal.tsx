import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { useAndroidBack } from '../../hooks/useAndroidBack.js';
import { useScrollInputIntoView } from '../../hooks/useScrollInputIntoView.js';
import { useFormDraft } from '../../hooks/useFormDraft.js';
import DraftBanner from '../ui/DraftBanner.jsx';
import { motion } from 'framer-motion';
import { Z } from '../../constants/zIndex.js';
import VenueAutocomplete from '../VenueAutocomplete.jsx';

const EQUIPMENT_OPTIONS = [
  { key: 'bike',    label: '🚲 Vélo' },
  { key: 'bags',    label: '🎒 Gros sacs' },
  { key: 'bulky',   label: '🏄 Encombrant' },
  { key: 'pets',    label: '🐶 Animaux' },
  { key: 'no_gear', label: '❌ Pas de matériel' },
];

const DETOUR_OPTIONS = [
  { key: 'none',     label: 'Aucun détour' },
  { key: 'small',    label: 'Petit détour OK' },
  { key: 'flexible', label: 'Je récupère autour' },
];

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  borderRadius: 'var(--sl-radius-xl)', padding: '10px 12px', fontSize: 13,
  backgroundColor: 'var(--sl-surface)', border: '1px solid var(--sl-border)',
  color: 'var(--sl-t1)', outline: 'none', fontFamily: 'var(--sl-font-ui)',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

interface RideForm {
  departureLocation: string;
  departureLat:      number | null;
  departureLng:      number | null;
  availableSeats:    number;
  acceptedEquipment: string[];
  detourFlexibility: string;
  notes:             string;
}

interface CreateRideModalProps {
  event: Record<string, any>;
  onSave: (data: RideForm & { departureTime: string }) => Promise<void>;
  onClose: () => void;
}

export default function CreateRideModal({ event, onSave, onClose }: CreateRideModalProps) {
  const dateObj   = new Date(event.date);
  const dateLabel = dateObj.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const timeLabel = dateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const [form, setForm] = useState<RideForm>({
    departureLocation: '',
    departureLat:      null,
    departureLng:      null,
    availableSeats:    3,
    acceptedEquipment: [],
    detourFlexibility: 'none',
    notes:             '',
  });
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef as any);
  useAndroidBack(true, onClose);
  useScrollInputIntoView(panelRef as any);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const { hasDraft, saveDraft, saveImmediate, loadDraft, clearDraft } = useFormDraft('sl-ride-draft') as any;
  const formRef = useRef(form);
  useEffect(() => { formRef.current = form; }, [form]);

  useEffect(() => {
    if (form.departureLocation || form.notes) saveDraft({ departureLocation: form.departureLocation, notes: form.notes });
  }, [form.departureLocation, form.notes]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function saveNow() {
      const f = formRef.current;
      if (f.departureLocation || f.notes) saveImmediate({ departureLocation: f.departureLocation, notes: f.notes });
    }
    function onVisibility() { if (document.visibilityState === 'hidden') saveNow(); }
    window.addEventListener('beforeunload', saveNow);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', saveNow);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function set<K extends keyof RideForm>(field: K, value: RideForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function toggleEquipment(key: string) {
    setForm(prev => ({
      ...prev,
      acceptedEquipment: prev.acceptedEquipment.includes(key)
        ? prev.acceptedEquipment.filter(e => e !== key)
        : [...prev.acceptedEquipment, key],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.departureLocation.trim()) { setError('Lieu de départ requis'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({ ...form, departureTime: event.date });
      clearDraft();
    } catch (err: any) {
      setError(err?.message ?? 'Erreur lors de la création');
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: (Z as any).formModal, backgroundColor: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        ref={panelRef}
        role="dialog" aria-modal="true" aria-label="Proposer un trajet"
        initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 34 }}
        style={{ width: '100%', maxWidth: 540, backgroundColor: 'var(--sl-card)', borderRadius: '22px 22px 0 0', border: '1px solid var(--sl-border)', borderBottom: 'none', maxHeight: '92dvh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 3, borderRadius: 'var(--sl-radius-full)', backgroundColor: 'var(--sl-border-s)' }} />
        </div>

        <AnimatePresence>
          {hasDraft && (
            <DraftBanner
              onRestore={() => { const d = loadDraft(); if (d) { set('departureLocation', d.departureLocation ?? ''); set('notes', d.notes ?? ''); } clearDraft(); }}
              onDiscard={clearDraft}
            />
          )}
        </AnimatePresence>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 18px 14px', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', margin: 0, letterSpacing: '-0.02em' }}>🚗 Proposer un trajet</h2>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 3 }}>{event.title} · {dateLabel} à {timeLabel}</div>
          </div>
          <button onClick={onClose} aria-label="Fermer" style={{ width: 44, height: 44, borderRadius: 'var(--sl-radius-xl)', border: 'none', cursor: 'pointer', backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form id="create-ride-form" onSubmit={handleSubmit} style={{ flex: 1, overflowY: 'auto', padding: '18px 18px 8px', display: 'flex', flexDirection: 'column', gap: 16, overscrollBehavior: 'contain' }}>
          <div style={{ borderRadius: 'var(--sl-radius-xl)', padding: '10px 12px', backgroundColor: 'rgba(34,217,106,0.06)', border: '1px solid rgba(34,217,106,0.2)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--sl-green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>Destination</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t1)' }}>{event.venue || event.city || event.title}</div>
            {event.city && event.venue && <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>{event.city}</div>}
          </div>

          <Field label="Lieu de départ *">
            <VenueAutocomplete
              value={form.departureLocation}
              onChange={(v: string) => set('departureLocation', v)}
              onSelect={({ name, city, lat, lng }: { name: string; city?: string; lat: number; lng: number }) => {
                set('departureLocation', city ? `${name}, ${city}` : name);
                set('departureLat', lat);
                set('departureLng', lng);
              }}
              placeholder="ex. Parking Leclerc, Gare de Quimper…"
              style={inputStyle}
            />
          </Field>

          <Field label="Places disponibles">
            <div style={{ display: 'flex', gap: 6 }}>
              {[1, 2, 3, 4, 5, 6].map(n => {
                const sel = form.availableSeats === n;
                return (
                  <button key={n} type="button" onClick={() => set('availableSeats', n)} style={{ flex: 1, padding: '10px 0', borderRadius: 'var(--sl-radius-xl)', cursor: 'pointer', border: `2px solid ${sel ? 'var(--sl-green)' : 'var(--sl-border)'}`, backgroundColor: sel ? 'rgba(34,217,106,0.12)' : 'var(--sl-surface)', color: sel ? 'var(--sl-green)' : 'var(--sl-t2)', fontSize: 14, fontWeight: 800, transition: 'all 0.12s' }}>
                    {n === 6 ? '6+' : n}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Matériel accepté">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EQUIPMENT_OPTIONS.map(opt => {
                const sel = form.acceptedEquipment.includes(opt.key);
                return (
                  <button key={opt.key} type="button" onClick={() => toggleEquipment(opt.key)} style={{ padding: '7px 12px', borderRadius: 'var(--sl-radius-lg)', cursor: 'pointer', border: `1.5px solid ${sel ? 'var(--sl-green)' : 'var(--sl-border)'}`, backgroundColor: sel ? 'rgba(34,217,106,0.1)' : 'var(--sl-surface)', color: sel ? 'var(--sl-green)' : 'var(--sl-t2)', fontSize: 12, fontWeight: sel ? 700 : 500, transition: 'all 0.12s' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Flexibilité de trajet">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {DETOUR_OPTIONS.map(opt => {
                const sel = form.detourFlexibility === opt.key;
                return (
                  <button key={opt.key} type="button" onClick={() => set('detourFlexibility', opt.key)} style={{ padding: '9px 6px', borderRadius: 'var(--sl-radius-lg)', cursor: 'pointer', textAlign: 'center', border: `1.5px solid ${sel ? '#3b82f6' : 'var(--sl-border)'}`, backgroundColor: sel ? 'rgba(59,130,246,0.1)' : 'var(--sl-surface)', color: sel ? '#3b82f6' : 'var(--sl-t2)', fontSize: 11, fontWeight: sel ? 700 : 500, transition: 'all 0.12s' }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Notes (optionnel)">
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Départ depuis le parking Leclerc, retour prévu après le match…" rows={2} style={{ ...inputStyle, resize: 'none' }} />
          </Field>

          {error && <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>{error}</p>}
        </form>

        <div style={{ flexShrink: 0, padding: '14px 18px 20px', borderTop: '1px solid var(--sl-border)', display: 'flex', gap: 10 }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '13px 0', borderRadius: 'var(--sl-radius-2xl)', border: '1px solid var(--sl-border-s)', color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
          <button type="submit" form="create-ride-form" disabled={saving} style={{ flex: 2, padding: '13px 0', borderRadius: 'var(--sl-radius-2xl)', border: 'none', backgroundColor: saving ? 'var(--sl-surface)' : 'var(--sl-green)', color: saving ? 'var(--sl-t3)' : '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer', boxShadow: saving ? 'none' : '0 4px 14px rgba(34,217,106,0.35)', transition: 'all 0.15s' }}>
            {saving ? 'Enregistrement…' : '🚗 Proposer le trajet'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

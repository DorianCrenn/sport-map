import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../../hooks/useSports.js';

export default function ClubRequestModal({ onSubmit, onClose }) {
  const { allSports: SPORTS } = useSports();
  const [form, setForm] = useState({ clubName: '', sport: '', city: '', description: '' });
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function set(k) { return e => { setForm(p => ({ ...p, [k]: e.target.value })); setError(''); }; }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.clubName.trim()) { setError('Nom du club requis'); return; }
    if (!form.sport) { setError('Sport requis'); return; }
    if (!form.city.trim()) { setError('Ville requise'); return; }
    onSubmit(form);
    setSubmitted(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        className="bg-white rounded-t-3xl w-full overflow-hidden flex flex-col"
        style={{ maxHeight: '88vh' }}
      >
        {/* Handle */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3">
          <div>
            <h2 className="text-base font-bold font-poppins" style={{ color: '#0F1E3A' }}>Demander un compte club</h2>
            <p className="text-xs text-gray-400 mt-0.5">Votre demande sera examinée par un admin</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {submitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center px-5 py-10 text-center"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ backgroundColor: '#F0FDF4' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 className="font-bold text-base font-poppins mb-1.5" style={{ color: '#0F1E3A' }}>Demande envoyée !</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                Un administrateur examinera votre demande et vous contactera sous 48h.
              </p>
              <button onClick={onClose}
                className="mt-6 px-8 py-3 rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: '#22C55E' }}>
                Fermer
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-5 pb-8 space-y-4 min-h-0"
            >
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Nom du club *</label>
                <input
                  value={form.clubName}
                  onChange={set('clubName')}
                  placeholder="Ex: AS Brest Football"
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Sport principal *</label>
                <select
                  value={form.sport}
                  onChange={set('sport')}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white appearance-none"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                >
                  <option value="">Sélectionner un sport</option>
                  {Object.values(SPORTS).map(s => (
                    <option key={s.id} value={s.id}>{s.emoji} {s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Ville *</label>
                <input
                  value={form.city}
                  onChange={set('city')}
                  placeholder="Ex: Brest"
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Description (optionnel)</label>
                <textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Quelques mots sur votre club, votre niveau, vos effectifs…"
                  rows={3}
                  className="w-full px-3.5 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-xs text-red-500 flex items-center gap-1.5"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={onClose}
                  className="flex-1 py-3.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button type="submit"
                  className="flex-1 py-3.5 rounded-2xl text-white text-sm font-bold transition-all"
                  style={{ backgroundColor: '#22C55E', boxShadow: '0 4px 16px rgba(34,197,94,0.3)' }}>
                  Envoyer
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

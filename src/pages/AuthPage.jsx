import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

export default function AuthPage({ onClose, onNeedOnboarding }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(k) {
    return e => { setForm(p => ({ ...p, [k]: e.target.value })); setError(''); };
  }

  function switchMode(m) {
    setMode(m);
    setError('');
    setForm({ name: '', email: '', password: '', confirm: '' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        login(form.email.trim(), form.password);
        onClose();
      } else {
        if (!form.name.trim()) throw new Error('Prénom ou surnom requis');
        if (form.password.length < 6) throw new Error('Mot de passe : 6 caractères minimum');
        if (form.password !== form.confirm) throw new Error('Les mots de passe ne correspondent pas');
        const user = register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
        if (!user.onboardingDone) onNeedOnboarding?.();
        else onClose();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow';
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center p-0 md:p-6"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="relative flex flex-col overflow-hidden
          w-full rounded-t-3xl
          md:w-full md:max-w-md md:rounded-3xl"
        style={{
          background: 'linear-gradient(175deg, #0F1E3A 0%, #1a3460 60%, #0e2a1a 100%)',
          maxHeight: '94dvh',
        }}
      >
        {/* Decorative blob */}
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.09) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />

        {/* Handle (mobile only) */}
        <div className="flex-shrink-0 flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 pt-3 pb-4 md:pt-5">
          <SportLinkLogo size={100} onDark />
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white transition-colors"
            style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex-shrink-0 px-5 mb-5">
          <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
            {[['login', 'Connexion'], ['register', "S'inscrire"]].map(([id, label]) => (
              <button
                key={id}
                onClick={() => switchMode(id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold font-poppins transition-all duration-200"
                style={mode === id
                  ? { backgroundColor: '#22C55E', color: 'white', boxShadow: '0 2px 12px rgba(34,197,94,0.3)' }
                  : { color: '#64748b' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 min-h-0">
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -14 : 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onSubmit={handleSubmit}
              className="space-y-3.5"
            >
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Prénom / Surnom</label>
                  <input type="text" value={form.name} onChange={set('name')}
                    placeholder="Ex: Jean-Michel" required
                    className={inputClass} style={inputStyle} />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Adresse email</label>
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="votre@email.fr" required
                  className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Mot de passe</label>
                <input type="password" value={form.password} onChange={set('password')}
                  placeholder="••••••••" required
                  className={inputClass} style={inputStyle} />
              </div>
              {mode === 'register' && (
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Confirmer le mot de passe</label>
                  <input type="password" value={form.confirm} onChange={set('confirm')}
                    placeholder="••••••••" required
                    className={inputClass} style={inputStyle} />
                </div>
              )}

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
                    style={{ backgroundColor: 'rgba(239,68,68,0.15)', color: '#fca5a5' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-2xl font-bold font-poppins text-sm text-white transition-all"
                style={{
                  backgroundColor: '#22C55E',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
                }}
              >
                {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
              </button>

              {mode === 'login' && (
                <p className="text-center text-[11px] text-slate-600 pt-0.5">
                  Compte démo :{' '}
                  <span className="text-slate-500 font-medium">admin@sportlink.fr</span>
                  {' / '}
                  <span className="text-slate-500 font-medium">admin123</span>
                </p>
              )}
            </motion.form>
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

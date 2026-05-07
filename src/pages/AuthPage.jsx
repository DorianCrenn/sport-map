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
        if (!user.onboardingDone) {
          onNeedOnboarding?.();
        } else {
          onClose();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow';
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #0F1E3A 0%, #1a3460 65%, #0e2a1a 100%)' }}
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)', transform: 'translate(30%,-30%)' }} />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.06) 0%, transparent 70%)', transform: 'translate(-30%,30%)' }} />

      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white transition-colors z-10"
        style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <div className="flex flex-col items-center justify-center min-h-full px-5 py-14">
        {/* Logo */}
        <div className="mb-10">
          <SportLinkLogo size={130} variant="full" />
        </div>

        <div className="w-full max-w-sm">
          {/* Tab switcher */}
          <div className="flex rounded-2xl p-1 mb-7" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
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

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, x: mode === 'login' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === 'login' ? 16 : -16 }}
              transition={{ duration: 0.18 }}
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
                className="w-full py-3.5 rounded-2xl font-bold font-poppins text-sm text-white mt-1 transition-all"
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
      </div>
    </motion.div>
  );
}

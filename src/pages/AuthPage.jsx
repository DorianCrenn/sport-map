import { useState, useEffect } from 'react';
import { Z } from '../constants/zIndex.js';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext.jsx';
import SportLinkLogo from '../components/SportLinkLogo.jsx';

// ── OAuth provider buttons ──────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f09433"/>
          <stop offset="25%" stopColor="#e6683c"/>
          <stop offset="50%" stopColor="#dc2743"/>
          <stop offset="75%" stopColor="#cc2366"/>
          <stop offset="100%" stopColor="#bc1888"/>
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="url(#ig-grad)" strokeWidth="2"/>
      <circle cx="12" cy="12" r="4" stroke="url(#ig-grad)" strokeWidth="2"/>
      <circle cx="17.5" cy="6.5" r="1" fill="url(#ig-grad)"/>
    </svg>
  );
}

function OAuthMockModal({ provider, onDone, onClose }) {
  const { loginWithProvider } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const label = provider === 'google' ? 'Google' : 'Instagram';

  async function handleConnect() {
    const trimmed = email.trim();
    if (!trimmed) { setError('Entrez votre email'); return; }
    setLoading(true);
    try {
      const user = await loginWithProvider(trimmed, provider);
      onDone(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', zIndex: Z.auth }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ backgroundColor: '#0F1E3A', border: '1px solid rgba(255,255,255,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="text-2xl mb-2">{provider === 'google' ? '🔗' : '📸'}</div>
          <h3 className="font-bold text-white font-oswald tracking-wide">Connexion {label}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Simulation OAuth — en production, un popup {label} s'ouvrirait. Pour la démo, entrez votre email.
          </p>
        </div>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="votre@email.fr"
          className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 mb-3"
          style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
          onKeyDown={e => e.key === 'Enter' && handleConnect()}
        />
        {error && (
          <p className="text-xs text-red-400 mb-3 px-1">{error}</p>
        )}
        <button
          onClick={handleConnect}
          disabled={loading}
          className="w-full py-3 rounded-xl font-bold text-sm text-white"
          style={{ backgroundColor: '#22C55E', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '...' : `Continuer avec ${label}`}
        </button>
        <button
          onClick={onClose}
          className="w-full py-2 mt-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Annuler
        </button>
      </motion.div>
    </motion.div>
  );
}

function ForgotPasswordView({ onBack }) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const inputCls = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow';
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' };

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed) { setError('Entrez votre email'); return; }
    setLoading(true);
    try {
      const result = await requestPasswordReset(trimmed);
      setSent(result);
    } catch (err) {
      setError(err.message ?? 'Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="text-center py-2">
          <div className="text-4xl mb-3">📬</div>
          <h3 className="font-bold text-white font-oswald tracking-wide text-lg">Email envoyé !</h3>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
            Un lien de réinitialisation a été envoyé à <span className="text-white font-medium">{sent.email}</span>.
            Vérifiez votre boîte mail (et les spams).
          </p>
        </div>
        <button
          onClick={onBack}
          className="w-full py-3 rounded-xl font-bold text-sm"
          style={{ backgroundColor: '#22C55E', color: 'white' }}
        >
          Retour à la connexion
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
      <div>
        <h3 className="font-bold text-white font-oswald tracking-wide text-lg mb-1">Mot de passe oublié</h3>
        <p className="text-sm text-slate-400">Entrez votre email pour recevoir un lien de réinitialisation.</p>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Adresse email</label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          placeholder="votre@email.fr"
          className={inputCls}
          style={inputStyle}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
      </div>
      <button
        onClick={handleSend}
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-sm text-white"
        style={{ backgroundColor: '#22C55E', boxShadow: '0 4px 20px rgba(34,197,94,0.3)', opacity: loading ? 0.7 : 1 }}
      >
        {loading ? '...' : 'Envoyer le lien'}
      </button>
      <button
        onClick={onBack}
        className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        ← Retour à la connexion
      </button>
    </motion.div>
  );
}

// ── Main AuthPage ──────────────────────────────────────────────────────────

export default function AuthPage({ onClose, onNeedOnboarding }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');   // 'login' | 'register' | 'forgot' | 'confirm-email'
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthProvider, setOauthProvider] = useState(null); // null | 'google' | 'instagram'

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

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
        await login(form.email.trim(), form.password);
        onClose();
      } else {
        if (!form.name.trim()) throw new Error('Prénom ou surnom requis');
        if (form.password.length < 6) throw new Error('Mot de passe : 6 caractères minimum');
        if (form.password !== form.confirm) throw new Error('Les mots de passe ne correspondent pas');
        const { needsConfirmation } = await register({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        });
        if (needsConfirmation) {
          setMode('confirm-email');
        } else {
          onNeedOnboarding?.();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleLogin() {
    setOauthProvider('google');
  }

  function handleOAuthDone({ needsConfirmation }) {
    setOauthProvider(null);
    if (needsConfirmation) { setMode('confirm-email'); return; }
    onNeedOnboarding?.();
  }

  const inputCls = 'w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow';
  const inputStyle = { backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 flex flex-col justify-end md:items-center md:justify-center p-0 md:p-6"
        style={{ backgroundColor: 'rgba(0,0,0,0.65)', zIndex: Z.auth }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          className="relative flex flex-col overflow-hidden w-full rounded-t-3xl md:w-full md:max-w-md md:rounded-3xl"
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
              aria-label="Fermer"
              className="rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          {/* Tab switcher (hidden in forgot/confirm modes) */}
          {mode !== 'forgot' && mode !== 'confirm-email' && (
            <div className="flex-shrink-0 px-5 mb-5">
              <div className="flex rounded-2xl p-1" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                {[['login', 'Connexion'], ['register', "S'inscrire"]].map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => switchMode(id)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold font-poppins transition-all duration-200 cursor-pointer"
                    style={mode === id
                      ? { backgroundColor: '#22C55E', color: 'white', boxShadow: '0 2px 12px rgba(34,197,94,0.3)' }
                      : { color: '#64748b' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-5 pb-8 min-h-0">
            <AnimatePresence mode="wait">

              {/* Email confirmation screen */}
              {mode === 'confirm-email' && (
                <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4 py-4 text-center">
                  <div className="text-5xl">📬</div>
                  <h3 className="font-bold text-white text-lg font-oswald tracking-wide">Vérifiez votre email</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Un lien de confirmation a été envoyé à votre adresse email.<br/>
                    Cliquez dessus pour activer votre compte.
                  </p>
                  <button
                    onClick={() => switchMode('login')}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white mt-2"
                    style={{ backgroundColor: '#22C55E' }}
                  >
                    Retour à la connexion
                  </button>
                </motion.div>
              )}

              {/* Forgot password view */}
              {mode === 'forgot' && (
                <motion.div key="forgot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ForgotPasswordView onBack={() => switchMode('login')} />
                </motion.div>
              )}

              {/* Login / Register */}
              {mode !== 'forgot' && mode !== 'confirm-email' && (
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: mode === 'login' ? -14 : 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className="space-y-3.5"
                >
                  {/* OAuth buttons */}
                  <div className="space-y-2.5">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                      style={{ backgroundColor: 'rgba(255,255,255,0.96)', color: '#1e293b' }}
                    >
                      <GoogleIcon />
                      Continuer avec Google
                    </button>
                    <button
                      type="button"
                      onClick={() => setOauthProvider('instagram')}
                      className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
                      style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)', color: 'white' }}
                    >
                      <InstagramIcon />
                      Continuer avec Instagram
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                    <span className="text-xs text-slate-500 font-medium">ou</span>
                    <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  </div>

                  {/* Email/password form */}
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {mode === 'register' && (
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Prénom / Surnom</label>
                        <input type="text" value={form.name} onChange={set('name')}
                          placeholder="Ex: Jean-Michel" required
                          className={inputCls} style={inputStyle} />
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-slate-400 mb-1.5 block">Adresse email</label>
                      <input type="email" value={form.email} onChange={set('email')}
                        placeholder="votre@email.fr" required
                        className={inputCls} style={inputStyle} />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-slate-400">Mot de passe</label>
                        {mode === 'login' && (
                          <button
                            type="button"
                            onClick={() => switchMode('forgot')}
                            className="text-[11px] text-slate-500 hover:text-green-400 transition-colors cursor-pointer"
                          >
                            Mot de passe oublié ?
                          </button>
                        )}
                      </div>
                      <input type="password" value={form.password} onChange={set('password')}
                        placeholder="••••••••" required
                        className={inputCls} style={inputStyle} />
                    </div>
                    {mode === 'register' && (
                      <div>
                        <label className="text-xs font-medium text-slate-400 mb-1.5 block">Confirmer le mot de passe</label>
                        <input type="password" value={form.confirm} onChange={set('confirm')}
                          placeholder="••••••••" required
                          className={inputCls} style={inputStyle} />
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
                      className="w-full py-3.5 rounded-2xl font-bold font-poppins text-sm text-white transition-all cursor-pointer"
                      style={{
                        backgroundColor: '#22C55E',
                        opacity: loading ? 0.7 : 1,
                        boxShadow: loading ? 'none' : '0 4px 20px rgba(34,197,94,0.35)',
                      }}
                    >
                      {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                    </button>

                    {mode === 'register' && (
                      <p className="text-center text-[11px] text-slate-600 pt-0.5">
                        Un email de confirmation sera envoyé à votre adresse.
                      </p>
                    )}
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>

      {/* OAuth mock modal */}
      <AnimatePresence>
        {oauthProvider && (
          <OAuthMockModal
            key={oauthProvider}
            provider={oauthProvider}
            onDone={handleOAuthDone}
            onClose={() => setOauthProvider(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Z } from '../constants/zIndex.js';
import { useFeedback } from '../hooks/useFeedback.js';
import { useFormDraft } from '../hooks/useFormDraft.js';
import { useToast } from '../contexts/ToastContext.jsx';
import { useAndroidBack } from '../hooks/useAndroidBack.js';
import { useScrollInputIntoView } from '../hooks/useScrollInputIntoView.js';
import { APP_VERSION } from '../lib/appInfo.js';

const TYPES = [
  { value: 'bug',      emoji: '🐛', label: 'Bug',     color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  { value: 'idea',     emoji: '💡', label: 'Idée',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { value: 'question', emoji: '❓', label: 'Question', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
];

const CATEGORIES = {
  bug:      [
    { value: 'ui',    label: 'Affichage' },
    { value: 'crash', label: 'Plantage' },
    { value: 'perf',  label: 'Lenteur' },
    { value: 'data',  label: 'Données incorrectes' },
    { value: 'other', label: 'Autre' },
  ],
  idea:     [
    { value: 'feature',     label: 'Nouvelle fonctionnalité' },
    { value: 'ux',          label: 'Amélioration UX' },
    { value: 'design',      label: 'Design' },
    { value: 'integration', label: 'Intégration' },
    { value: 'other',       label: 'Autre' },
  ],
  question: [
    { value: 'how_to',  label: 'Comment faire ?' },
    { value: 'account', label: 'Mon compte' },
    { value: 'billing', label: 'Abonnement' },
    { value: 'data',    label: 'Mes données' },
    { value: 'other',   label: 'Autre' },
  ],
};

const DRAFT_KEY = 'sl-feedback-draft';

function getBrowserInfo() {
  return {
    ua: navigator.userAgent,
    lang: navigator.language,
    platform: navigator.platform ?? 'unknown',
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  };
}

export default function FeedbackModal({ onClose }) {
  const { submit, fetchIdeas, searchSimilar } = useFeedback();
  const { toast } = useToast();
  const panelRef = useRef(null);
  useAndroidBack(true, onClose);
  useScrollInputIntoView(panelRef);

  const { saveDraft, loadDraft, clearDraft } = useFormDraft(DRAFT_KEY);

  const [type,        setType]        = useState('idea');
  const [category,    setCategory]    = useState('');
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [done,        setDone]        = useState(false);
  const [similar,     setSimilar]     = useState([]);
  const [ideasList,   setIdeasList]   = useState([]);
  const similarTimer = useRef(null);

  // Restore draft on mount
  useEffect(() => {
    const d = loadDraft();
    if (d) {
      if (d.type)        setType(d.type);
      if (d.category)    setCategory(d.category);
      if (d.title)       setTitle(d.title);
      if (d.description) setDescription(d.description);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load ideas for duplicate detection (idea type only)
  useEffect(() => {
    if (type === 'idea') fetchIdeas().then(setIdeasList);
  }, [type, fetchIdeas]);

  // Auto-save draft
  useEffect(() => {
    if (title || description) saveDraft({ type, category, title, description });
  }, [type, category, title, description, saveDraft]);

  // Real-time similar detection
  useEffect(() => {
    clearTimeout(similarTimer.current);
    if (type !== 'idea' || title.length < 4) { setSimilar([]); return; }
    similarTimer.current = setTimeout(() => {
      setSimilar(searchSimilar(title, ideasList));
    }, 400);
    return () => clearTimeout(similarTimer.current);
  }, [title, type, ideasList, searchSimilar]);

  const handleTypeChange = useCallback((v) => {
    setType(v);
    setCategory('');
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await submit({
        type,
        title:       title.trim(),
        description: description.trim() || null,
        category:    category || null,
        pageUrl:     window.location.href,
        browserInfo: getBrowserInfo(),
        appVersion:  APP_VERSION ?? null,
      });
      clearDraft();
      setDone(true);
    } catch {
      toast({ message: 'Erreur lors de l\'envoi — réessayez', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  const currentType  = TYPES.find(t => t.value === type);
  const cats         = CATEGORIES[type] ?? [];
  const charLeft     = 100 - title.length;

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    padding: '10px 12px', borderRadius: 10,
    backgroundColor: 'var(--sl-surface)',
    border: '1px solid var(--sl-border)',
    color: 'var(--sl-t1)', fontSize: 14, outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.feedbackModal,
        backgroundColor: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'flex-end',
        fontFamily: 'Inter, sans-serif',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        ref={panelRef}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        style={{
          width: '100%',
          maxHeight: '92dvh',
          borderRadius: '20px 20px 0 0',
          backgroundColor: 'var(--sl-bg)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--sl-border)',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>
              Votre retour
            </h2>
            <p style={{ margin: 0, marginTop: 2, fontSize: 11, color: 'var(--sl-t3)' }}>
              Signaler un bug, proposer une idée ou poser une question
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
              backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 32px' }}>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '40px 16px' }}
              >
                <div style={{ fontSize: 56, marginBottom: 16 }}>
                  {type === 'bug' ? '🙏' : type === 'idea' ? '🚀' : '✅'}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--sl-t1)', margin: '0 0 8px' }}>
                  {type === 'bug' ? 'Bug reçu !' : type === 'idea' ? 'Super idée !' : 'Question envoyée !'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--sl-t2)', lineHeight: 1.6, margin: '0 0 24px' }}>
                  {type === 'bug'
                    ? 'Merci de nous avoir signalé ce problème. Nous allons l\'analyser rapidement.'
                    : type === 'idea'
                    ? 'Votre idée rejoint notre roadmap. La communauté pourra voter pour elle.'
                    : 'Nous avons bien reçu votre question et vous répondrons par notification.'}
                </p>
                <button
                  onClick={onClose}
                  style={{
                    padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
                    backgroundColor: currentType?.color ?? '#6366f1', color: '#fff',
                    fontSize: 14, fontWeight: 700,
                  }}
                >
                  Fermer
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                {/* Type picker */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 8 }}>
                    Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {TYPES.map(t => {
                      const sel = type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => handleTypeChange(t.value)}
                          style={{
                            padding: '10px 8px', borderRadius: 12, cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                            border: `2px solid ${sel ? t.color : 'var(--sl-border)'}`,
                            backgroundColor: sel ? t.bg : 'var(--sl-surface)',
                            transition: 'all 0.12s',
                          }}
                        >
                          <span style={{ fontSize: 20 }}>{t.emoji}</span>
                          <span style={{ fontSize: 11, fontWeight: sel ? 700 : 500, color: sel ? t.color : 'var(--sl-t2)' }}>
                            {t.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 8 }}>
                    Catégorie <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span>
                  </label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {cats.map(c => {
                      const sel = category === c.value;
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCategory(sel ? '' : c.value)}
                          style={{
                            padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: sel ? 700 : 500, cursor: 'pointer',
                            border: `1.5px solid ${sel ? (currentType?.color ?? '#6366f1') : 'var(--sl-border)'}`,
                            backgroundColor: sel ? (currentType?.bg ?? 'rgba(99,102,241,0.1)') : 'var(--sl-surface)',
                            color: sel ? (currentType?.color ?? '#6366f1') : 'var(--sl-t2)',
                            transition: 'all 0.12s',
                          }}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)' }}>
                      {type === 'bug' ? 'Décrivez le problème *' : type === 'idea' ? 'Votre idée en une ligne *' : 'Votre question *'}
                    </label>
                    {title.length > 70 && (
                      <span style={{ fontSize: 10, color: charLeft < 10 ? '#ef4444' : 'var(--sl-t3)' }}>
                        {charLeft} restants
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={100}
                    required
                    placeholder={
                      type === 'bug'      ? 'ex: La carte ne s\'affiche pas sur mon téléphone' :
                      type === 'idea'     ? 'ex: Pouvoir partager les affiches directement sur Instagram' :
                                            'ex: Comment inviter des gestionnaires dans mon club ?'
                    }
                    style={inputStyle}
                    autoFocus
                  />

                  {/* Similar ideas panel */}
                  <AnimatePresence>
                    {type === 'idea' && similar.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{
                          marginTop: 8, padding: '10px 12px',
                          borderRadius: 10,
                          backgroundColor: 'rgba(245,158,11,0.08)',
                          border: '1px solid rgba(245,158,11,0.25)',
                        }}>
                          <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#d97706' }}>
                            💡 Idées similaires déjà soumises
                          </p>
                          {similar.map(s => (
                            <p key={s.id} style={{ margin: '3px 0', fontSize: 12, color: 'var(--sl-t2)', paddingLeft: 8, borderLeft: '2px solid rgba(245,158,11,0.4)' }}>
                              {s.title}
                            </p>
                          ))}
                          <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--sl-t3)' }}>
                            Si votre idée est déjà là, votez pour elle plutôt que de la dupliquer.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--sl-t3)', marginBottom: 6 }}>
                    Détails <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optionnel)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder={
                      type === 'bug'
                        ? 'Étapes pour reproduire le bug, message d\'erreur, appareil utilisé…'
                        : type === 'idea'
                        ? 'Décrivez le problème que ça résoudrait, les cas d\'utilisation…'
                        : 'Plus de contexte, ce que vous avez déjà essayé…'
                    }
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                  />
                  {description.length > 420 && (
                    <p style={{ margin: '3px 0 0', fontSize: 10, color: description.length > 490 ? '#ef4444' : 'var(--sl-t3)', textAlign: 'right' }}>
                      {500 - description.length} / 500
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!title.trim() || submitting}
                  style={{
                    padding: '13px', borderRadius: 12, border: 'none', cursor: !title.trim() || submitting ? 'not-allowed' : 'pointer',
                    backgroundColor: !title.trim() || submitting ? 'var(--sl-surface)' : (currentType?.color ?? '#6366f1'),
                    color: !title.trim() || submitting ? 'var(--sl-t3)' : '#fff',
                    fontSize: 14, fontWeight: 700, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {submitting ? (
                    <>
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Envoi…
                    </>
                  ) : (
                    <>
                      {currentType?.emoji} Envoyer
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

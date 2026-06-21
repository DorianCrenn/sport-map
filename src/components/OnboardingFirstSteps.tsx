import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Step { id: string; emoji: string; label: string; sublabel: string; tab: string; }

const STEPS_BY_ROLE: Record<string, Step[]> = {
  president:   [{ id: 'create_club',    emoji: '🏟️', label: 'Créer votre club',              sublabel: 'Ajoutez votre identité visuelle et vos équipes',      tab: 'clubs'  }, { id: 'invite_team',    emoji: '👥', label: 'Inviter des gestionnaires',  sublabel: 'Coaches, communicants — déléguez les accès',         tab: 'clubs'  }, { id: 'create_event',   emoji: '📅', label: 'Publier un événement',        sublabel: 'Matchs, tournois, entraînements sur la carte',        tab: 'map'    }, { id: 'send_announce',  emoji: '📢', label: 'Envoyer une annonce',         sublabel: 'Informez vos abonnés en un clic',                     tab: 'clubs'  }],
  coach:       [{ id: 'view_trainings', emoji: '🏃', label: 'Voir mes entraînements',         sublabel: 'Plannings et gestion des présences',                  tab: 'home'   }, { id: 'convocations',   emoji: '📋', label: 'Convoquer des joueurs',       sublabel: 'Sélectionnez votre équipe pour le prochain match',    tab: 'home'   }, { id: 'create_event',   emoji: '📅', label: 'Créer un événement',          sublabel: 'Ajoutez un match ou entraînement sur la carte',       tab: 'map'    }, { id: 'follow_club',    emoji: '❤️', label: 'Suivre votre club',           sublabel: 'Recevez les actualités en temps réel',                tab: 'clubs'  }],
  communicant: [{ id: 'poster',         emoji: '🎨', label: 'Créer une affiche',              sublabel: 'PosterStudio — 37 templates professionnels',          tab: 'map'    }, { id: 'club_page',      emoji: '🏟️', label: 'Personnaliser la page club',  sublabel: 'Mini-site public de votre club',                      tab: 'clubs'  }, { id: 'send_announce',  emoji: '📢', label: 'Envoyer une annonce',         sublabel: 'Urgent, info, résultat, événement',                   tab: 'clubs'  }, { id: 'follow_club',    emoji: '❤️', label: 'Suivre votre club',           sublabel: 'Accès aux actualités dans le fil Accueil',            tab: 'clubs'  }],
  parent:      [{ id: 'follow_club',    emoji: '❤️', label: "Suivre le club de votre enfant", sublabel: 'Annonces et matchs directement dans votre fil',       tab: 'clubs'  }, { id: 'convocations',   emoji: '📋', label: 'Voir les convocations',       sublabel: 'Répondez aux sélections de votre enfant',            tab: 'home'   }, { id: 'notifications',  emoji: '🔔', label: 'Activer les notifications',   sublabel: 'Ne manquez aucun match ni annonce',                   tab: 'profil' }, { id: 'carpool',        emoji: '🚗', label: 'Covoiturage',                 sublabel: 'Proposez ou demandez des trajets pour les matchs',    tab: 'map'    }],
  joueur:      [{ id: 'follow_club',    emoji: '❤️', label: 'Suivre votre club',              sublabel: 'Actualités, résultats, annonces',                     tab: 'clubs'  }, { id: 'convocations',   emoji: '📋', label: 'Voir mes convocations',       sublabel: 'Répondez aux sélections de votre coach',             tab: 'home'   }, { id: 'favorites',      emoji: '💚', label: "Sauvegarder des événements",  sublabel: 'Retrouvez-les dans vos Favoris',                      tab: 'map'    }, { id: 'notifications',  emoji: '🔔', label: 'Activer les notifications',   sublabel: 'Rappels de matchs, nouvelles convocations',           tab: 'profil' }],
  supporter:   [{ id: 'follow_clubs',   emoji: '❤️', label: 'Suivre des clubs',               sublabel: 'Annonces et résultats dans votre fil',                tab: 'clubs'  }, { id: 'map',            emoji: '🗺️', label: 'Explorer la carte',           sublabel: 'Tous les événements sportifs autour de vous',         tab: 'map'    }, { id: 'notifications',  emoji: '🔔', label: 'Activer les notifications',   sublabel: 'Alertes avant les matchs de vos clubs',               tab: 'profil' }, { id: 'favorites',      emoji: '💚', label: 'Sauvegarder des matchs',      sublabel: 'Calendrier personnalisé dans vos Favoris',            tab: 'favoris'}],
};
const DEFAULT_STEPS: Step[] = [
  { id: 'explore',       emoji: '🗺️', label: 'Explorer la carte',          sublabel: 'Trouvez des événements près de chez vous', tab: 'map'    },
  { id: 'follow_clubs',  emoji: '❤️', label: 'Suivre des clubs',            sublabel: 'Rejoignez votre club favori',              tab: 'clubs'  },
  { id: 'notifications', emoji: '🔔', label: 'Activer les notifications',   sublabel: 'Ne manquez aucun événement',               tab: 'profil' },
];

interface OnboardingFirstStepsProps { jobRole?: string | null; onNavigate?: (tab: string) => void; onClose?: () => void; }

export default function OnboardingFirstSteps({ jobRole, onNavigate, onClose }: OnboardingFirstStepsProps) {
  const steps = (jobRole && STEPS_BY_ROLE[jobRole]) ? STEPS_BY_ROLE[jobRole] : DEFAULT_STEPS;
  const [done, setDone] = useState(new Set<string>());
  function handleAction(step: Step) { setDone(prev => new Set([...prev, step.id])); onNavigate?.(step.tab); }
  const allDone = done.size >= steps.length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'linear-gradient(160deg, #0F1E3A 0%, #1a3460 100%)', display: 'flex', flexDirection: 'column', padding: '28px 20px calc(28px + env(safe-area-inset-bottom, 0px))' }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 280, damping: 18 }} style={{ width: 64, height: 64, borderRadius: 18, backgroundColor: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 30 }}>🚀</motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ fontSize: 22, fontWeight: 800, color: 'white', fontFamily: 'Poppins, sans-serif', marginBottom: 6 }}>Vos premiers pas</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={{ fontSize: 13, color: '#64748b' }}>Quelques actions pour démarrer sur SportLink</motion.p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, overflowY: 'auto' }}>
        <AnimatePresence>
          {steps.map((step, i) => {
            const isDone = done.has(step.id);
            return (
              <motion.button key={step.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }} onClick={() => handleAction(step)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, cursor: 'pointer', textAlign: 'left', backgroundColor: isDone ? 'rgba(34,217,106,0.08)' : 'rgba(255,255,255,0.05)', border: `1.5px solid ${isDone ? 'rgba(34,217,106,0.3)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, backgroundColor: isDone ? 'rgba(34,217,106,0.15)' : 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{isDone ? '✅' : step.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: isDone ? '#22d96a' : 'white', margin: 0, marginBottom: 2 }}>{step.label}</p>
                  <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>{step.sublabel}</p>
                </div>
                {!isDone && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>
      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} onClick={onClose} style={{ marginTop: 20, width: '100%', padding: '15px 0', borderRadius: 16, border: 'none', cursor: 'pointer', backgroundColor: '#22C55E', color: 'white', fontSize: 14, fontWeight: 700, fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}>
        {allDone ? 'Parfait, commencer →' : 'Explorer SportLink →'}
      </motion.button>
    </motion.div>
  );
}

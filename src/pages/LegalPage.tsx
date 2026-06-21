import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabDef {
  id: string;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'mentions', label: 'Mentions légales' },
  { id: 'privacy', label: 'Confidentialité' },
  { id: 'cgu', label: 'CGU' },
];

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--sl-t1)', marginBottom: 8, fontFamily: 'Poppins, sans-serif' }}>
        {title}
      </h3>
      <div style={{ fontSize: 13, color: 'var(--sl-t2)', lineHeight: 1.75 }}>
        {children}
      </div>
    </div>
  );
}

function MentionsLegales() {
  return (
    <div>
      <Section title="Éditeur">
        <p>SportLink est édité par Dorian Crenn, en cours de création de structure juridique.</p>
        <p style={{ marginTop: 6 }}>Directeur de la publication : Dorian Crenn</p>
        <p style={{ marginTop: 6 }}>Contact : <a href="mailto:doriancrenn17@gmail.com" style={{ color: 'var(--sl-green)' }}>doriancrenn17@gmail.com</a></p>
      </Section>

      <Section title="Hébergement">
        <p><strong style={{ color: 'var(--sl-t1)' }}>Application web :</strong> Vercel Inc., 340 Pine Street Suite 1200, San Francisco, CA 94104, États-Unis</p>
        <p style={{ marginTop: 6 }}><strong style={{ color: 'var(--sl-t1)' }}>Base de données :</strong> Supabase Inc., 970 Tresser Blvd, Stamford, CT 06901, États-Unis</p>
      </Section>

      <Section title="Propriété intellectuelle">
        <p>L'ensemble du contenu de SportLink (logos, textes, affiches générées, interface) est la propriété de Dorian Crenn, sauf mention contraire.</p>
        <p style={{ marginTop: 6 }}>Les contenus publiés par les utilisateurs (événements, photos de clubs, affiches) restent la propriété de leurs auteurs.</p>
      </Section>

      <Section title="Cookies">
        <p>SportLink utilise uniquement des cookies techniques nécessaires au fonctionnement de l'application (session d'authentification). Aucun cookie de traçage ou publicitaire n'est déposé.</p>
      </Section>

      <Section title="Droit applicable">
        <p>Le présent site est soumis au droit français. Tout litige relatif à son utilisation sera soumis à la compétence exclusive des tribunaux de Brest.</p>
      </Section>
    </div>
  );
}

function PolitiqueConfidentialite() {
  return (
    <div>
      <Section title="Responsable du traitement">
        <p>Dorian Crenn — <a href="mailto:doriancrenn17@gmail.com" style={{ color: 'var(--sl-green)' }}>doriancrenn17@gmail.com</a></p>
      </Section>

      <Section title="Données collectées">
        <p>Lors de la création de votre compte et de l'utilisation de SportLink, nous collectons :</p>
        <ul style={{ marginTop: 8, paddingLeft: 18, listStyleType: 'disc' }}>
          <li>Prénom ou pseudonyme</li>
          <li>Adresse email</li>
          <li>Préférences sportives</li>
          <li>Clubs et événements suivis</li>
          <li>Contenu publié : événements, commentaires, réactions</li>
          <li>Photos de clubs et d'équipes (si téléchargées)</li>
          <li>Abonnement aux notifications push (endpoint de notification, si activé)</li>
          <li>Statistiques d'utilisation anonymisées (fonctionnalités utilisées, pages visitées) — uniquement avec votre consentement explicite</li>
        </ul>
        <p style={{ marginTop: 8 }}>
          <strong style={{ color: 'var(--sl-t1)' }}>Données de localisation :</strong> votre position GPS peut être utilisée pour afficher les événements proches de vous. Elle n'est jamais stockée sur nos serveurs.
        </p>
      </Section>

      <Section title="Finalités et base légale">
        <p>Vos données sont traitées pour :</p>
        <ul style={{ marginTop: 8, paddingLeft: 18, listStyleType: 'disc' }}>
          <li>Créer et gérer votre compte — <em>exécution d'un contrat</em></li>
          <li>Afficher les événements et clubs — <em>exécution d'un contrat</em></li>
          <li>Envoyer des notifications push et emails de rappel — <em>consentement</em></li>
          <li>Collecter des statistiques d'utilisation pour améliorer le service — <em>consentement</em></li>
        </ul>
      </Section>

      <Section title="Sous-traitants et prestataires">
        <p>SportLink fait appel aux sous-traitants suivants pour le traitement des données :</p>
        <ul style={{ marginTop: 8, paddingLeft: 18, listStyleType: 'disc' }}>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Vercel Inc.</strong> (États-Unis) — hébergement de l'application web</li>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Supabase Inc.</strong> (États-Unis) — base de données, authentification, stockage de fichiers</li>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Pollinations.ai</strong> — génération d'images IA pour PosterStudio (plan Elite) ; les images transmises ne contiennent pas de données personnelles identifiantes</li>
          <li><strong style={{ color: 'var(--sl-t1)' }}>fal.ai</strong> — génération d'images IA avancée (plan Elite, optionnel) ; mêmes conditions</li>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Anthropic PBC</strong> (États-Unis) — analyse visuelle IA pour la génération de chartes graphiques (plan Elite, optionnel)</li>
        </ul>
        <p style={{ marginTop: 8 }}>Les transferts hors UE vers ces prestataires américains sont encadrés par les mécanismes adéquats (clauses contractuelles types ou Privacy Shield successeur).</p>
      </Section>

      <Section title="Durée de conservation">
        <p>Vos données sont conservées pendant toute la durée de votre compte. En cas de suppression de compte, les données sont supprimées dans un délai de 30 jours, à l'exception des données nécessaires au respect d'obligations légales (3 ans).</p>
        <p style={{ marginTop: 6 }}>Les statistiques d'utilisation anonymisées sont conservées 13 mois maximum, conformément aux recommandations de la CNIL.</p>
      </Section>

      <Section title="Vos droits">
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul style={{ marginTop: 8, paddingLeft: 18, listStyleType: 'disc' }}>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Accès :</strong> consulter les données vous concernant</li>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Rectification :</strong> modifier vos informations depuis votre profil</li>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Suppression :</strong> supprimer votre compte depuis Profil → Paramètres</li>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Portabilité :</strong> obtenir une copie de vos données en envoyant une demande à <a href="mailto:doriancrenn17@gmail.com" style={{ color: 'var(--sl-green)' }}>doriancrenn17@gmail.com</a></li>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Retrait du consentement :</strong> modifier votre choix concernant les statistiques d'utilisation depuis Profil → Paramètres → Confidentialité</li>
          <li><strong style={{ color: 'var(--sl-t1)' }}>Opposition :</strong> vous opposer au traitement pour des raisons tenant à votre situation particulière</li>
        </ul>
        <p style={{ marginTop: 8 }}>Pour exercer ces droits : <a href="mailto:doriancrenn17@gmail.com" style={{ color: 'var(--sl-green)' }}>doriancrenn17@gmail.com</a></p>
      </Section>

      <Section title="Réclamation">
        <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (Commission Nationale de l'Informatique et des Libertés) sur <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--sl-green)' }}>cnil.fr</a>.</p>
      </Section>

      <Section title="Sécurité">
        <p>Vos données sont protégées par des mesures techniques adaptées : chiffrement TLS des communications, accès aux données contrôlé par des politiques de sécurité au niveau de la base de données (Row Level Security), authentification sécurisée (PKCE).</p>
      </Section>
    </div>
  );
}

function CGU() {
  return (
    <div>
      <Section title="Objet">
        <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application SportLink, plateforme communautaire dédiée au sport amateur en Bretagne.</p>
      </Section>

      <Section title="Accès au service">
        <p>L'accès aux fonctionnalités de base de SportLink est gratuit. Des fonctionnalités avancées pour les clubs (affiches IA, covoiturage étendu, statistiques…) sont proposées sous forme d'abonnements payants.</p>
        <p style={{ marginTop: 6 }}>L'inscription est ouverte à toute personne physique âgée de 15 ans ou plus. Pour les mineurs de moins de 15 ans, le consentement parental est requis, conformément à l'article 8 du RGPD et à l'article 45 de la loi Informatique et Libertés.</p>
      </Section>

      <Section title="Compte utilisateur">
        <p>Vous êtes responsable de la confidentialité de vos identifiants de connexion. Tout accès à votre compte avec vos identifiants est présumé effectué par vous.</p>
        <p style={{ marginTop: 6 }}>Un seul compte par personne est autorisé.</p>
      </Section>

      <Section title="Contenu utilisateur">
        <p>Vous conservez la propriété intellectuelle des contenus que vous publiez (événements, photos, affiches). En publiant sur SportLink, vous accordez à SportLink une licence non exclusive, gratuite et mondiale pour afficher ces contenus dans le cadre du service.</p>
        <p style={{ marginTop: 6 }}>Il est interdit de publier des contenus :</p>
        <ul style={{ marginTop: 8, paddingLeft: 18, listStyleType: 'disc' }}>
          <li>Contraires à la loi française (contenus haineux, illicites, etc.)</li>
          <li>Portant atteinte aux droits de tiers</li>
          <li>Publicitaires sans autorisation préalable</li>
          <li>Comportant des informations fausses ou trompeuses</li>
        </ul>
      </Section>

      <Section title="Modération">
        <p>SportLink se réserve le droit de supprimer sans préavis tout contenu non conforme aux présentes CGU, et de suspendre ou supprimer tout compte contrevenant.</p>
      </Section>

      <Section title="Responsabilité">
        <p>SportLink est une plateforme d'intermédiation. Elle n'organise pas les événements listés et n'est pas responsable de leur déroulement, des informations erronées communiquées par les organisateurs, ni des dommages qui pourraient en résulter.</p>
        <p style={{ marginTop: 6 }}>SportLink s'efforce de maintenir le service disponible en continu, mais ne peut garantir une disponibilité sans interruption.</p>
      </Section>

      <Section title="Abonnements payants">
        <p>Les abonnements clubs (STARTER, PRO, ELITE) sont souscrits pour une durée mensuelle, renouvelable automatiquement. Conformément au droit européen, vous disposez d'un délai de rétractation de 14 jours à compter de la souscription, sauf si le service a été pleinement exécuté avec votre accord préalable.</p>
        <p style={{ marginTop: 6 }}>Pour toute demande de remboursement : <a href="mailto:doriancrenn17@gmail.com" style={{ color: 'var(--sl-green)' }}>doriancrenn17@gmail.com</a></p>
      </Section>

      <Section title="Modification des CGU">
        <p>SportLink peut modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications substantielles par notification dans l'application. La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles conditions.</p>
      </Section>

      <Section title="Droit applicable">
        <p>Les présentes CGU sont soumises au droit français. En cas de litige, les parties rechercheront une solution amiable avant de saisir les tribunaux compétents de Brest.</p>
        <p style={{ marginTop: 6 }}>Dernière mise à jour : juin 2026</p>
      </Section>
    </div>
  );
}

interface LegalPageProps {
  initialTab?: string;
  onClose: () => void;
}

export default function LegalPage({ initialTab = 'mentions', onClose }: LegalPageProps) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        backgroundColor: 'var(--sl-bg)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 16px 0',
        paddingTop: 'max(16px, env(safe-area-inset-top))',
      }}>
        <button
          onClick={onClose}
          aria-label="Fermer"
          style={{
            width: 40, height: 40, borderRadius: 12, border: 'none', cursor: 'pointer',
            backgroundColor: 'var(--sl-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--sl-t2)', flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--sl-t1)', fontFamily: 'Poppins, sans-serif', margin: 0 }}>
          Informations légales
        </h1>
      </div>

      {/* Tab switcher */}
      <div style={{
        flexShrink: 0,
        display: 'flex', gap: 8,
        padding: '16px 16px 0',
        overflowX: 'auto',
      }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flexShrink: 0,
              padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13, fontFamily: 'Inter, sans-serif',
              transition: 'background-color 0.15s, color 0.15s',
              backgroundColor: activeTab === tab.id ? 'var(--sl-green)' : 'var(--sl-hover)',
              color: activeTab === tab.id ? '#fff' : 'var(--sl-t2)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '24px 16px 48px', maxWidth: 680, width: '100%', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'mentions' && <MentionsLegales />}
            {activeTab === 'privacy' && <PolitiqueConfidentialite />}
            {activeTab === 'cgu' && <CGU />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

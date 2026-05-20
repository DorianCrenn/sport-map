// Génération de descriptions partageables depuis un événement SportLink

const EVENT_TYPE_LABELS = {
  championship: '🏆 Championnat',
  cup:          '🥇 Coupe',
  friendly:     '⚽ Match amical',
};

/**
 * Génère un texte de partage lisible depuis les données d'un événement.
 * Utilisé par WhatsApp, Facebook, description auto des affiches, etc.
 */
export function generateEventDescription(event, options = {}) {
  if (!event) return '';

  const { includeUrl = false, url = '' } = options;

  const lines = [];

  // Type + compétition
  const typeLabel = EVENT_TYPE_LABELS[event.eventType] || '📅 Événement';
  const competition = event.level
    ? `${typeLabel} ${event.level}`
    : typeLabel;
  lines.push(competition);

  // Sport si pas implicite dans le titre
  if (event.sport && event.eventType === 'friendly') {
    lines.push(`🏅 ${event.sport}`);
  }

  // Titre / équipes
  if (event.title) {
    lines.push(`${event.title}`);
  }

  // Date + heure
  if (event.date) {
    const d = new Date(event.date);
    const dateStr = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    lines.push(`📅 ${capitalize(dateStr)} à ${timeStr}`);
  }

  // Lieu
  const lieu = event.venue || event.city;
  if (lieu) lines.push(`📍 ${lieu}`);

  // Score si match terminé
  if (event.score) {
    lines.push(`🎯 Score : ${event.score}`);
  }

  lines.push('');
  lines.push('Créé avec SportLink 🟢');

  if (includeUrl && url) lines.push(url);

  return lines.join('\n');
}

/**
 * Ouvre WhatsApp avec un message pré-rempli.
 * Fonctionne sur mobile (app) et desktop (web.whatsapp.com).
 */
export function openWhatsAppShare(text) {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
}

/**
 * Ouvre la boîte de dialogue de partage Facebook pour une URL.
 */
export function openFacebookShare(url) {
  const encoded = encodeURIComponent(url);
  window.open(
    `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
    '_blank',
    'noopener,noreferrer,width=600,height=400'
  );
}

/**
 * Partage vers Instagram via le Web Share API (ouvre le sélecteur système sur mobile,
 * incluant Instagram Stories). Sur desktop, copie le texte dans le presse-papier.
 */
export function openInstagramShare(text, url = '') {
  const full = url ? `${text}\n${url}` : text;
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    navigator.share({ text: full }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(full);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

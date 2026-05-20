import DOMPurify from 'dompurify';

/**
 * Supprime tout HTML — retourne du texte brut sécurisé.
 * Utiliser pour tous les champs utilisateur avant stockage ou affichage.
 */
export function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return DOMPurify.sanitize(str, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/**
 * Autorise un sous-ensemble minimal de HTML (b, i, br, p).
 * Utiliser pour les champs "description" ou "message" avec formatage léger.
 */
export function sanitizeRich(html) {
  if (typeof html !== 'string') return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS:  ['b', 'i', 'em', 'strong', 'br', 'p'],
    ALLOWED_ATTR:  [],
  });
}

/**
 * Produit un nom de fichier sûr — élimine les caractères dangereux
 * (path traversal, caractères spéciaux, accents).
 */
export function sanitizeFilename(str, { maxLen = 60 } = {}) {
  if (typeof str !== 'string' || !str.trim()) return 'export';
  return (
    str
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')    // supprimer les diacritiques
      .replace(/[^a-z0-9\s\-_]/gi, '')   // garder alphanum, tiret, underscore
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, maxLen)
  ) || 'export';
}

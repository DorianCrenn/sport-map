/**
 * Divulgation progressive — masquer les éléments de gamification tant que le
 * volume de données ne les rend pas crédibles (évite l'effet « app vide »
 * quand la base d'utilisateurs est encore faible). Dès que le volume monte,
 * les éléments réapparaissent automatiquement.
 *
 * Décision produit 2026-07 : SportLink est d'abord un outil pour les clubs ;
 * la gamification est un accessoire qui ne doit pas afficher du vide.
 */

// Un classement de 1-2 entrées n'a pas de sens (« podium » à une personne).
export const LEADERBOARD_MIN_ENTRIES = 3;

// Affiche un leaderboard seulement s'il y a assez de participants.
export function shouldShowLeaderboard(entryCount: number): boolean {
  return entryCount >= LEADERBOARD_MIN_ENTRIES;
}

// Affiche la HypeBar seulement s'il y a au moins une activité réelle à montrer
// (pas de segment « filler » générique quand tout est à zéro).
export function shouldShowHypeBar(realSegmentCount: number): boolean {
  return realSegmentCount > 0;
}

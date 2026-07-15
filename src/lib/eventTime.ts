// Helper partagé : un événement est « terminé » (donc plus d'actions temps-réel
// comme donner sa présence ou proposer un covoiturage) dès que :
//   - son statut vaut final / terminé / annulé (ex. score saisi), OU
//   - son jour est passé (la veille au soir).
// Centralise une logique qui était dupliquée et incohérente dans ~6 composants.

type EventLike = {
  date?: string | null;
  status?: string | null;
  matchStatus?: string | null;
  match_status?: string | null;
} & Record<string, unknown>;

const FINISHED_STATUSES = new Set([
  'final', 'finished', 'done', 'post_done', 'cancelled', 'canceled', 'terminé', 'termine',
]);

/** L'événement est-il terminé (statut final/annulé) ou son jour est-il passé ? */
export function isEventPast(event?: EventLike | null): boolean {
  if (!event) return false;

  const status = String(event.status ?? event.matchStatus ?? event.match_status ?? '')
    .trim()
    .toLowerCase();
  if (FINISHED_STATUSES.has(status)) return true;

  const rawDate = event.date;
  if (!rawDate) return false;
  const day = String(rawDate).slice(0, 10); // 'YYYY-MM-DD'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const today = new Date().toISOString().slice(0, 10);
  return day < today;
}

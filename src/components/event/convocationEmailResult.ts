export type ConvocationEmailSeverity = 'success' | 'error' | 'warning' | 'neutral';

// Dérive le retour d'envoi ({sent, total}) en message + sévérité pour l'UI.
// Pur & sans dépendance UI → testable. Ne jamais afficher un succès aveugle :
// un envoi total en échec (domaine Resend non vérifié) doit remonter en erreur.
export function convocationEmailResult(
  { sent, total }: { sent: number; total: number }
): { severity: ConvocationEmailSeverity; icon: string; message: string } {
  if (total > 0 && sent === total)
    return { severity: 'success', icon: '✅', message: `${sent} email${sent > 1 ? 's' : ''} envoyé${sent > 1 ? 's' : ''} avec succès !` };
  if (total > 0 && sent === 0)
    return { severity: 'error', icon: '⚠️', message: `Aucun email envoyé — problème d'envoi côté serveur (domaine d'expédition à vérifier).` };
  if (sent > 0 && sent < total)
    return { severity: 'warning', icon: '⚠️', message: `${sent}/${total} emails envoyés — ${total - sent} en échec.` };
  return { severity: 'neutral', icon: 'ℹ️', message: `Aucun email à envoyer (joueurs sans adresse).` };
}

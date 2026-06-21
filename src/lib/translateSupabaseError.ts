const MAP: Record<string, string> = {
  // Auth
  'Invalid login credentials':        'Email ou mot de passe incorrect',
  'Email not confirmed':              'Confirmez votre email avant de vous connecter',
  'User already registered':          'Cet email est déjà utilisé',
  'Password should be at least':      'Mot de passe trop court (6 caractères minimum)',
  'Signup requires a valid password': 'Mot de passe requis',
  'Email rate limit exceeded':        'Trop de tentatives — réessayez dans quelques minutes',
  'Token has expired':                'Session expirée — reconnectez-vous',
  'JWT expired':                      'Session expirée — reconnectez-vous',
  // DB / RLS
  'permission denied':                "Vous n'avez pas les droits pour cette action",
  'violates row-level security':      'Action non autorisée',
  'unique constraint':                'Cette entrée existe déjà',
  'violates foreign key':             "Référence invalide — l'élément lié n'existe pas",
  'violates not-null':                'Un champ obligatoire est manquant',
  // Storage
  'Object not found':                 'Fichier introuvable',
  'Bucket not found':                 'Espace de stockage introuvable',
  'Payload too large':                'Fichier trop volumineux',
  'Invalid mime type':                'Type de fichier non autorisé',
  // Réseau
  'Failed to fetch':                  'Connexion impossible — vérifiez votre réseau',
  'NetworkError':                     'Erreur réseau — vérifiez votre connexion',
  'AbortError':                       'Opération annulée (délai dépassé)',
  'timeout':                          'La requête a pris trop de temps — réessayez',
};

export function translateSupabaseError(error: unknown): string {
  if (!error) return 'Une erreur inconnue est survenue';
  const msg = (error as { message?: string }).message ?? String(error);
  for (const [key, value] of Object.entries(MAP)) {
    if (msg.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return msg || 'Une erreur est survenue';
}

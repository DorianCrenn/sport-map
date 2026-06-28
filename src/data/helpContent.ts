/**
 * helpContent — FAQ statique de SportLink.
 * Catégories : events | poster | convocations | communication | general
 */
export const HELP_CONTENT = [

  // ── EVENTS ──────────────────────────────────────────────────────────────────

  {
    id: 'ev-01', category: 'events',
    question: 'Comment créer un événement ?',
    answer: 'Allez sur la Carte et appuyez sur le bouton "+" en bas. Renseignez le nom, le sport, la date et le lieu. L\'événement apparaît immédiatement sur la carte pour tous les utilisateurs.',
  },
  {
    id: 'ev-02', category: 'events',
    question: 'Qu\'est-ce que le "terrain" (lieu) ?',
    answer: 'C\'est l\'adresse précise où se déroule l\'événement : stade, gymnase, salle, terrain de foot. Commencez à saisir le nom et SportLink propose des lieux à proximité automatiquement.',
  },
  {
    id: 'ev-03', category: 'events',
    question: 'Comment modifier ou supprimer un événement ?',
    answer: 'Dans la liste de vos événements (carte → votre événement), appuyez sur le crayon pour modifier ou la corbeille pour supprimer. Une confirmation est demandée avant toute suppression.',
  },
  {
    id: 'ev-04', category: 'events',
    question: 'Que signifie "Catégorie d\'équipe" ?',
    answer: 'C\'est le groupe d\'âge ou le niveau de l\'équipe : U13, U15, Seniors, etc. Si votre club a configuré ses équipes, elles apparaissent dans la liste pour faciliter la création.',
  },
  {
    id: 'ev-05', category: 'events',
    question: 'Comment importer des événements en masse ?',
    answer: 'Depuis le dashboard de votre club, utilisez l\'import CSV. Téléchargez le modèle, remplissez-le avec vos données, et importez-le en une seule fois.',
  },
  {
    id: 'ev-06', category: 'events',
    question: 'Puis-je créer des événements récurrents ?',
    answer: 'Oui ! Lors de la création, activez "Récurrence" et choisissez la fréquence (hebdomadaire, toutes les deux semaines) et la date de fin. SportLink génère automatiquement tous les événements.',
  },

  // ── POSTER STUDIO ───────────────────────────────────────────────────────────

  {
    id: 'ps-01', category: 'poster',
    question: 'Comment créer une affiche pour un match ?',
    answer: 'Ouvrez l\'événement puis appuyez sur "Affiche". Choisissez un template parmi 37 modèles. Personnalisez les couleurs, les logos et le texte. Exportez en PNG ou partagez directement sur WhatsApp.',
  },
  {
    id: 'ps-02', category: 'poster',
    question: 'Comment choisir le bon format ?',
    answer: 'Story (9:16) pour Instagram et WhatsApp Statuts. Carré (1:1) pour les publications Facebook et Instagram. Paysage (16:9) pour les écrans d\'affichage ou les bannières.',
  },
  {
    id: 'ps-03', category: 'poster',
    question: 'Comment ajouter la photo d\'un joueur ?',
    answer: 'Dans le panel "Joueurs", importez la photo depuis votre galerie. SportLink effectue automatiquement la découpe du fond. Glissez ensuite le joueur sur l\'affiche.',
  },
  {
    id: 'ps-04', category: 'poster',
    question: 'Que signifie "Générer avec l\'IA" ?',
    answer: 'SportLink peut créer un fond d\'affiche unique grâce à l\'intelligence artificielle. Décrivez l\'ambiance souhaitée (dramatique, festif, épuré…) et l\'IA génère un visuel en quelques secondes.',
  },
  {
    id: 'ps-05', category: 'poster',
    question: 'Mon affiche est floue après export — que faire ?',
    answer: 'L\'export se fait en très haute définition (3×). Si l\'image semble floue, vérifiez votre connexion lors de l\'export. Sur iPhone, l\'export peut prendre quelques secondes supplémentaires.',
  },

  // ── CONVOCATIONS ────────────────────────────────────────────────────────────

  {
    id: 'co-01', category: 'convocations',
    question: 'Comment fonctionne le système de convocations ?',
    answer: 'Le coach sélectionne les joueurs pour un match et leur envoie une convocation. Chaque joueur (ou son parent) reçoit une notification et peut répondre : Accepter, Décliner, ou Indisponible.',
  },
  {
    id: 'co-02', category: 'convocations',
    question: 'Où voir mes convocations en attente ?',
    answer: 'Dans l\'onglet Accueil, vos convocations apparaissent en haut du fil. Vous pouvez aussi y accéder depuis votre Profil → "Mes convocations". Un badge orange indique les réponses en attente.',
  },
  {
    id: 'co-03', category: 'convocations',
    question: 'Comment convoquer des joueurs en tant que coach ?',
    answer: 'Ouvrez la page de votre club → onglet "Matchs" → cliquez sur un match à venir → "Convoquer". Sélectionnez les joueurs de votre effectif et envoyez. Vous verrez les réponses en temps réel.',
  },
  {
    id: 'co-04', category: 'convocations',
    question: 'Les parents peuvent-ils répondre à la place de leur enfant ?',
    answer: 'Oui. Si un parent est lié à un joueur dans le système, il reçoit également la convocation et peut y répondre. Le coach voit clairement "Répondu par le parent".',
  },

  // ── COMMUNICATION ───────────────────────────────────────────────────────────

  {
    id: 'cm-01', category: 'communication',
    question: 'Quelle est la différence entre une annonce et un événement ?',
    answer: 'Un événement est visible sur la carte publique par tous les utilisateurs. Une annonce est un message envoyé uniquement aux abonnés de votre club — elle peut être urgente, informative, ou présenter un résultat.',
  },
  {
    id: 'cm-02', category: 'communication',
    question: 'Comment cibler une annonce à une équipe spécifique ?',
    answer: 'Lors de l\'envoi d\'une annonce, utilisez le filtre "Équipe ciblée". Seuls les abonnés ayant choisi de suivre cette équipe recevront la notification push.',
  },
  {
    id: 'cm-03', category: 'communication',
    question: 'Comment programmer une annonce à l\'avance ?',
    answer: 'Activez "Programmer" dans le formulaire d\'annonce et choisissez la date et l\'heure d\'envoi. SportLink enverra automatiquement la notification à l\'heure prévue.',
  },
  {
    id: 'cm-04', category: 'communication',
    question: 'Qu\'est-ce que le covoiturage ?',
    answer: 'Pour chaque événement, les membres peuvent proposer ou demander des places dans un covoiturage. Le conducteur fixe le lieu de départ, l\'heure et le nombre de places. Les passagers font une demande que le conducteur accepte ou refuse.',
  },

  // ── GÉNÉRAL ─────────────────────────────────────────────────────────────────

  {
    id: 'gn-01', category: 'general',
    question: 'Comment activer les notifications push ?',
    answer: 'Allez dans Profil → Paramètres → "Notifications push". Appuyez sur le bouton pour activer. Acceptez la demande de permission du navigateur. Vous recevrez ensuite les alertes de vos clubs suivis.',
  },
  {
    id: 'gn-02', category: 'general',
    question: 'Comment installer SportLink sur mon téléphone ?',
    answer: 'Sur Android : ouvrez SportLink dans Chrome → menu "⋮" → "Installer l\'application". Sur iPhone : ouvrez dans Safari → bouton Partager → "Sur l\'écran d\'accueil". SportLink fonctionne ensuite comme une app native.',
  },
];

export const HELP_CATEGORIES = [
  { id: 'events',        label: 'Événements',   emoji: '📅' },
  { id: 'poster',        label: 'PosterStudio', emoji: '🎨' },
  { id: 'convocations',  label: 'Convocations', emoji: '📋' },
  { id: 'communication', label: 'Communication', emoji: '📢' },
  { id: 'general',       label: 'Général',      emoji: '⚙️' },
];

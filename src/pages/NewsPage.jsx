import { motion } from 'framer-motion';

const NEWS = [
  {
    id: 1,
    category: 'Football',
    categoryColor: '#22c55e',
    emoji: '⚽',
    title: 'Division Honneur : l\'US Brest en route vers le titre',
    summary: 'Avec 54 points après 28 journées, les Brestois semblent bien partis pour décrocher le titre de champion de Division Honneur Bretagne cette saison.',
    time: 'Il y a 2h',
    image: '🏟️',
  },
  {
    id: 2,
    category: 'Running',
    categoryColor: '#3b82f6',
    emoji: '🏃',
    title: 'Semi-marathon de Quimper : plus de 1 500 dossards déjà vendus',
    summary: 'L\'édition 2026 du semi-marathon de Quimper s\'annonce record. Le départ est prévu le 17 mai depuis la Place de la Résistance.',
    time: 'Il y a 5h',
    image: '🏅',
  },
  {
    id: 3,
    category: 'Basketball',
    categoryColor: '#f97316',
    emoji: '🏀',
    title: 'Landerneau Bretagne BB : les playoffs démarrent fort',
    summary: 'Victoire 78-65 en match aller des playoffs Pro B. Le club finistérien confirme son statut de favori pour la montée.',
    time: 'Hier',
    image: '🏀',
  },
  {
    id: 4,
    category: 'Trail',
    categoryColor: '#3b82f6',
    emoji: '🚵',
    title: 'Trail des Abers : les inscriptions ferment vendredi',
    summary: 'Il reste quelques places disponibles pour le Trail des Abers du 9 mai. Les deux parcours (10 km et 22 km) longent les estuaires des Abers Wrac\'h et Benoît.',
    time: 'Hier',
    image: '🌊',
  },
  {
    id: 5,
    category: 'Rugby',
    categoryColor: '#f97316',
    emoji: '🏉',
    title: 'Fédérale 3 : RC Brest qualifié pour la finale',
    summary: 'Le Rugby Club Brestois a validé son ticket pour la finale départementale après sa victoire en demi-finale. Rendez-vous le 31 mai au Stade du Bouguen.',
    time: 'Il y a 2 jours',
    image: '🏉',
  },
  {
    id: 6,
    category: 'Cyclisme',
    categoryColor: '#3b82f6',
    emoji: '🚴',
    title: 'Cyclosportive du Pays de Brest : un parcours renouvelé',
    summary: 'Pour sa 12e édition, la Cyclosportive du Pays de Brest propose un nouveau tracé pour le 150 km incluant la traversée de la presqu\'île de Crozon.',
    time: 'Il y a 3 jours',
    image: '⛰️',
  },
];

export default function NewsPage() {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-sm text-gray-500">Actualités sportives · Finistère</p>
        <span className="text-xs text-gray-400">Mis à jour aujourd'hui</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {NEWS.map((article, i) => (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.2 }}
            className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                style={{ backgroundColor: `${article.categoryColor}15` }}>
                {article.image}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: article.categoryColor }}>
                    {article.emoji} {article.category}
                  </span>
                  <span className="text-[10px] text-gray-400">{article.time}</span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm leading-snug">{article.title}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{article.summary}</p>
              </div>
            </div>
          </motion.article>
        ))}

        <div className="text-center py-6">
          <p className="text-xs text-gray-400">Les actualités seront mises à jour régulièrement</p>
        </div>
      </div>
    </div>
  );
}

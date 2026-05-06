import { motion } from 'framer-motion';
import SportIcon from '../components/SportIcon.jsx';

const NEWS = [
  {
    id: 1,
    category: 'Football',
    categoryColor: '#16a34a',
    title: 'Division Honneur : l\'US Brest en route vers le titre',
    summary: 'Avec 54 points après 28 journées, les Brestois semblent bien partis pour décrocher le titre de champion de Division Honneur Bretagne cette saison.',
    time: 'Il y a 2h',
    readTime: '2 min',
  },
  {
    id: 2,
    category: 'Running',
    categoryColor: '#2563eb',
    title: 'Semi-marathon de Quimper : plus de 1 500 dossards déjà vendus',
    summary: 'L\'édition 2026 du semi-marathon de Quimper s\'annonce record. Le départ est prévu le 17 mai depuis la Place de la Résistance.',
    time: 'Il y a 5h',
    readTime: '3 min',
  },
  {
    id: 3,
    category: 'Basketball',
    categoryColor: '#eab308',
    title: 'Landerneau Bretagne BB : les playoffs démarrent fort',
    summary: 'Victoire 78-65 en match aller des playoffs Pro B. Le club finistérien confirme son statut de favori pour la montée.',
    time: 'Hier',
    readTime: '2 min',
  },
  {
    id: 4,
    category: 'Trail',
    categoryColor: '#06b6d4',
    title: 'Trail des Abers : les inscriptions ferment vendredi',
    summary: 'Il reste quelques places disponibles pour le Trail des Abers du 9 mai. Les deux parcours (10 km et 22 km) longent les estuaires des Abers Wrac\'h et Benoît.',
    time: 'Hier',
    readTime: '2 min',
  },
  {
    id: 5,
    category: 'Rugby',
    categoryColor: '#dc2626',
    title: 'Fédérale 3 : RC Brest qualifié pour la finale',
    summary: 'Le Rugby Club Brestois a validé son ticket pour la finale départementale après sa victoire en demi-finale. Rendez-vous le 31 mai au Stade du Bouguen.',
    time: 'Il y a 2 jours',
    readTime: '3 min',
  },
  {
    id: 6,
    category: 'Cyclisme',
    categoryColor: '#7c3aed',
    title: 'Cyclosportive du Pays de Brest : un parcours renouvelé',
    summary: 'Pour sa 12e édition, la Cyclosportive du Pays de Brest propose un nouveau tracé pour le 150 km incluant la traversée de la presqu\'île de Crozon.',
    time: 'Il y a 3 jours',
    readTime: '4 min',
  },
];

export default function NewsPage() {
  return (
    <div className="h-full flex flex-col bg-[#F1F5F9]">
      {/* Header */}
      <div className="flex-shrink-0 bg-white px-4 pt-5 pb-4 border-b border-gray-100">
        <h1 className="text-xl font-bold font-poppins" style={{ color: '#0F1E3A' }}>Actualités</h1>
        <p className="text-xs text-gray-400 mt-0.5">Sport en Finistère · Mis à jour aujourd'hui</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Featured article */}
        <motion.article
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform"
        >
          {/* Color band */}
          <div className="h-1.5 w-full" style={{ backgroundColor: NEWS[0].categoryColor }} />
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${NEWS[0].categoryColor}15` }}>
                <SportIcon sport={NEWS[0].category} size={18} color={NEWS[0].categoryColor} />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
                style={{ backgroundColor: NEWS[0].categoryColor }}>
                {NEWS[0].category}
              </span>
              <span className="text-[10px] text-gray-400 ml-auto">{NEWS[0].time}</span>
            </div>
            <h2 className="font-bold text-base leading-snug mb-1.5 font-poppins" style={{ color: '#0F1E3A' }}>
              {NEWS[0].title}
            </h2>
            <p className="text-xs text-gray-500 leading-relaxed">{NEWS[0].summary}</p>
            <div className="flex items-center gap-1 mt-3">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span className="text-[10px] text-gray-400">{NEWS[0].readTime} de lecture</span>
            </div>
          </div>
        </motion.article>

        {/* Other articles */}
        {NEWS.slice(1).map((article, i) => (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (i + 1) * 0.06, duration: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${article.categoryColor}12` }}>
                <SportIcon sport={article.category} size={22} color={article.categoryColor} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: article.categoryColor }}>
                    {article.category}
                  </span>
                  <span className="text-[10px] text-gray-400">{article.time}</span>
                </div>
                <h3 className="font-semibold text-sm leading-snug mb-1 font-poppins" style={{ color: '#0F1E3A' }}>
                  {article.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{article.summary}</p>
              </div>
            </div>
          </motion.article>
        ))}

        <div className="text-center py-4">
          <p className="text-xs text-gray-400">Les actualités sont mises à jour régulièrement</p>
        </div>
      </div>
    </div>
  );
}

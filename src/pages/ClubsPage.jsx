import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPORTS } from '../data/events.js';
import { useClubs } from '../hooks/useClubs.js';
import SportIcon from '../components/SportIcon.jsx';
import ClubPageView from '../components/club/ClubPageView.jsx';
import ClubFormModal from '../components/club/ClubFormModal.jsx';

const STATIC_CLUBS = [
  { id: 1,  name: 'US Brest Football',       sport: 'Football',   city: 'Brest',      members: 320, level: 'Division Honneur',      contact: 'usbrest29@gmail.com' },
  { id: 2,  name: 'Quimper Cornouaille FC',  sport: 'Football',   city: 'Quimper',    members: 280, level: 'Division Honneur',      contact: 'qcfc29@gmail.com' },
  { id: 3,  name: 'Morlaix FC',              sport: 'Football',   city: 'Morlaix',    members: 210, level: 'Division Honneur',      contact: 'morlaixfc@gmail.com' },
  { id: 4,  name: 'ASC Carhaix',             sport: 'Football',   city: 'Carhaix',    members: 180, level: 'Promotion de Ligue',    contact: 'asccarhaix@gmail.com' },
  { id: 5,  name: 'AS Plabennec',            sport: 'Football',   city: 'Plabennec',  members: 195, level: 'Division Honneur',      contact: 'asplabennec@gmail.com' },
  { id: 6,  name: 'HBC Brest',              sport: 'Handball',   city: 'Brest',      members: 150, level: 'N3 Régional',           contact: 'hbcbrest@gmail.com' },
  { id: 7,  name: 'HBC Concarneau',         sport: 'Handball',   city: 'Concarneau', members: 120, level: 'N3 Régional',           contact: 'hbcconcarneau@gmail.com' },
  { id: 8,  name: 'Morlaix Handball',       sport: 'Handball',   city: 'Morlaix',    members: 95,  level: 'N3 Régional',           contact: 'morlaixhb@gmail.com' },
  { id: 9,  name: 'Landerneau Bretagne BB', sport: 'Basketball', city: 'Landerneau', members: 200, level: 'Pro B',                 contact: 'lbb29@gmail.com' },
  { id: 10, name: 'Quimper Basket',         sport: 'Basketball', city: 'Quimper',    members: 175, level: 'Pro B',                 contact: 'quimperbasket@gmail.com' },
  { id: 11, name: 'Concarneau Basket',      sport: 'Basketball', city: 'Concarneau', members: 130, level: 'Régional',              contact: 'concbask@gmail.com' },
  { id: 12, name: 'Rugby Club Brestois',    sport: 'Rugby',      city: 'Brest',      members: 160, level: 'Fédérale 3',            contact: 'rcb29@gmail.com' },
  { id: 13, name: 'RC Quimper',             sport: 'Rugby',      city: 'Quimper',    members: 140, level: 'Fédérale 3',            contact: 'rcquimper@gmail.com' },
  { id: 14, name: 'Brest Atlético Club',    sport: 'Running',    city: 'Brest',      members: 420, level: 'Loisir / Compétition',  contact: 'bac29@gmail.com' },
  { id: 15, name: 'Quimper Athlétisme',     sport: 'Running',    city: 'Quimper',    members: 310, level: 'Loisir / Compétition',  contact: 'qa29@gmail.com' },
  { id: 16, name: 'Trail Côtier Finistère', sport: 'Trail',      city: 'Brest',      members: 180, level: 'Tout public',           contact: 'tcf29@gmail.com' },
  { id: 17, name: 'Vélo Club Brestois',     sport: 'Cyclisme',   city: 'Brest',      members: 260, level: 'Loisir / Compétition',  contact: 'vcb29@gmail.com' },
  { id: 18, name: 'Cyclisme Cornouaille',   sport: 'Cyclisme',   city: 'Quimper',    members: 195, level: 'Loisir / Compétition',  contact: 'cyclcorn@gmail.com' },
];

export default function ClubsPage({ allEvents }) {
  const { userClubs, addClub, updateClub, deleteClub } = useClubs();

  const [search, setSearch]           = useState('');
  const [sportFilter, setSportFilter] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);  // page view
  const [formClub, setFormClub]         = useState(null);  // null=closed, false=create, club=edit
  const [confirmDelete, setConfirmDelete] = useState(null);

  const allClubs = [...userClubs, ...STATIC_CLUBS];

  const filtered = allClubs.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const matchSport = !sportFilter || c.sport === sportFilter;
    return matchSearch && matchSport;
  });

  function handleSave(data) {
    if (formClub && formClub !== true) {
      updateClub(formClub.id, data);
    } else {
      const created = addClub(data);
      // Open the page editor right after creation
      setSelectedClub(created);
    }
    setFormClub(null);
  }

  function handleDelete(club) {
    deleteClub(club.id);
    setConfirmDelete(null);
    if (selectedClub?.id === club.id) setSelectedClub(null);
  }

  return (
    <div className="h-full flex flex-col bg-[#F1F5F9] relative overflow-hidden">

      {/* Club page view overlay */}
      <AnimatePresence>
        {selectedClub && (
          <ClubPageView
            key={selectedClub.id}
            club={selectedClub}
            allEvents={allEvents ?? []}
            onBack={() => setSelectedClub(null)}
          />
        )}
      </AnimatePresence>

      {/* Create / edit form */}
      <AnimatePresence>
        {formClub !== null && (
          <ClubFormModal
            club={formClub === true ? null : formClub}
            onSave={handleSave}
            onClose={() => setFormClub(null)}
          />
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-end"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}
          >
            <motion.div
              initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              className="bg-white rounded-t-3xl p-6 w-full"
            >
              <h3 className="font-bold font-poppins text-base mb-2" style={{ color: '#0F1E3A' }}>Supprimer le club ?</h3>
              <p className="text-sm text-gray-500 mb-5">Cette action supprimera <strong>{confirmDelete.name}</strong> et sa page définitivement.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
                  Annuler
                </button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors">
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white px-4 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold font-poppins" style={{ color: '#0F1E3A' }}>Clubs</h1>
          <button
            onClick={() => setFormClub(true)}
            className="flex items-center gap-1.5 text-xs font-bold font-poppins text-white px-3 py-2 rounded-xl transition-colors"
            style={{ backgroundColor: '#22C55E' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Créer mon club
          </button>
        </div>

        <div className="relative mb-3">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un club ou une ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setSportFilter(null)}
            className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors"
            style={sportFilter === null ? { backgroundColor: '#0F1E3A', color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
            Tous
          </button>
          {Object.values(SPORTS).map(sport => (
            <button key={sport.id} onClick={() => setSportFilter(sportFilter === sport.id ? null : sport.id)}
              className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 transition-colors"
              style={sportFilter === sport.id ? { backgroundColor: sport.color, color: 'white' } : { backgroundColor: '#f1f5f9', color: '#64748b' }}>
              <SportIcon sport={sport.id} size={13} color={sportFilter === sport.id ? 'white' : sport.color} />
              {sport.label}
            </button>
          ))}
        </div>
      </div>

      {/* Club list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs text-gray-400 mb-3 font-medium">
          {filtered.length} club{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* User clubs banner */}
        {userClubs.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 rounded-2xl p-4 flex items-center gap-3 border"
            style={{ background: 'linear-gradient(135deg, #F0FDF4, #ECFDF5)', borderColor: '#BBF7D0' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#22C55E' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-sm font-poppins" style={{ color: '#15803d' }}>Vous représentez un club ?</div>
              <div className="text-xs text-green-600">Créez votre page club et gérez vos entraînements.</div>
            </div>
            <button onClick={() => setFormClub(true)}
              className="text-xs font-bold text-white px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ backgroundColor: '#22C55E' }}>
              Créer
            </button>
          </motion.div>
        )}

        {filtered.map((club, i) => {
          const sport    = SPORTS[club.sport];
          const isOwn    = !!club.isUserCreated;

          return (
            <motion.div key={club.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.15 }}
              className="bg-white rounded-2xl mb-2.5 shadow-sm border overflow-hidden"
              style={{ borderColor: isOwn ? '#BBF7D0' : '#f1f5f9' }}
            >
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 font-bold text-white text-sm font-oswald tracking-wide select-none"
                  style={{ backgroundColor: club.logo ? 'transparent' : (sport?.color ?? '#64748b') }}>
                  {club.logo
                    ? <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
                    : club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-800 text-sm truncate">{club.name}</div>
                    {isOwn && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#F0FDF4', color: '#16a34a' }}>
                        Mon club
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{club.city}</span>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-gray-500">{club.members} membres</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium text-white flex-shrink-0"
                      style={{ backgroundColor: sport?.color }}>
                      {club.sport}
                    </span>
                    {club.categories?.length > 0 ? (
                      <>
                        {club.categories.slice(0, 5).map(cat => (
                          <span key={cat.id}
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-gray-100 text-gray-500 flex-shrink-0">
                            {cat.name}
                          </span>
                        ))}
                        {club.categories.length > 5 && (
                          <span className="text-[10px] text-gray-400 flex-shrink-0">
                            +{club.categories.length - 5}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-[10px] text-gray-400">{club.level}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-gray-100">
                {isOwn ? (
                  <>
                    <button onClick={() => setFormClub(club)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                      </svg>
                      Éditer les infos
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => setSelectedClub(club)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-semibold transition-colors font-poppins"
                      style={{ color: '#22C55E' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ma page
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => setConfirmDelete(club)}
                      className="flex items-center justify-center py-2.5 px-3 text-red-400 hover:bg-red-50 transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    <a href={`mailto:${club.contact}`}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Contacter
                    </a>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => setSelectedClub(club)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-semibold transition-colors font-poppins"
                      style={{ color: sport?.color ?? '#0F1E3A' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Voir la page
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

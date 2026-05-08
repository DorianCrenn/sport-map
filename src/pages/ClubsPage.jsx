import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSports } from '../hooks/useSports.js';
import { useClubs } from '../hooks/useClubs.js';
import { useClubRequests } from '../hooks/useClubRequests.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import SportIcon from '../components/SportIcon.jsx';
import ClubPageView from '../components/club/ClubPageView.jsx';
import ClubFormModal from '../components/club/ClubFormModal.jsx';
import ClubRequestModal from '../components/club/ClubRequestModal.jsx';
import { STATIC_CLUBS } from '../data/clubs.js';

export default function ClubsPage({ allEvents, onShowAuth }) {
  const { allSports: SPORTS } = useSports();
  const { userClubs, addClub, updateClub, deleteClub } = useClubs();
  const { requests, submitRequest } = useClubRequests();
  const { currentUser, isAdmin, isClubAdmin } = useAuth();

  const [search, setSearch]               = useState('');
  const [sportFilter, setSportFilter]     = useState(null);
  const [showAllSports, setShowAllSports] = useState(false);
  const [selectedClub, setSelectedClub]   = useState(null);
  const [formClub, setFormClub]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // All clubs visible in the list
  const allClubs = [...userClubs, ...STATIC_CLUBS];

  const favoriteSports = currentUser?.favoriteSports || [];
  const inFavoritesMode = favoriteSports.length > 0 && !showAllSports;

  const filtered = allClubs.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const matchSport = sportFilter ? c.sport === sportFilter
      : inFavoritesMode ? favoriteSports.includes(c.sport)
      : true;
    return matchSearch && matchSport;
  });

  // Club admin's own club
  const myClub = isClubAdmin && currentUser?.clubId
    ? userClubs.find(c => c.id === currentUser.clubId)
    : null;

  // Has the current user already sent a request?
  const myRequest = currentUser
    ? requests.find(r => r.userId === currentUser.id)
    : null;

  function handleSave(data) {
    if (formClub && formClub !== true) {
      updateClub(formClub.id, data);
    } else {
      const created = addClub(data);
      setSelectedClub(created);
    }
    setFormClub(null);
  }

  function handleDelete(club) {
    deleteClub(club.id);
    setConfirmDelete(null);
    if (selectedClub?.id === club.id) setSelectedClub(null);
  }

  function handleRequest(form) {
    if (!currentUser) return;
    submitRequest({
      userId: currentUser.id,
      userName: currentUser.name,
      clubName: form.clubName,
      sport: form.sport,
      city: form.city,
      description: form.description,
    });
  }

  function isOwnClub(club) {
    if (isAdmin) return club.isUserCreated;
    if (currentUser && club.ownerId) return club.ownerId === currentUser.id;
    return false;
  }

  return (
    <div className="h-full flex flex-col bg-[#F1F5F9] relative overflow-hidden">

      {/* Club page overlay */}
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

      {/* Edit form (admin only) */}
      <AnimatePresence>
        {formClub !== null && (
          <ClubFormModal
            club={formClub === true ? null : formClub}
            onSave={handleSave}
            onClose={() => setFormClub(null)}
          />
        )}
      </AnimatePresence>

      {/* Club request modal */}
      <AnimatePresence>
        {showRequestModal && (
          <ClubRequestModal
            onSubmit={handleRequest}
            onClose={() => setShowRequestModal(false)}
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
                  className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-500 hover:bg-gray-50">
                  Annuler
                </button>
                <button onClick={() => handleDelete(confirmDelete)}
                  className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-bold hover:bg-red-600">
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
          {isAdmin && (
            <button
              onClick={() => setFormClub(true)}
              className="flex items-center gap-1.5 text-xs font-bold font-poppins text-white px-3 py-2 rounded-xl transition-colors"
              style={{ backgroundColor: '#22C55E' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter
            </button>
          )}
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
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
          />
        </div>

        {(() => {
          const favoriteSports = currentUser?.favoriteSports || [];
          const hasFavorites = favoriteSports.length > 0;
          const inFavoritesMode = hasFavorites && !showAllSports;
          const inExpandedMode = hasFavorites && showAllSports;
          const allVisible = Object.values(SPORTS).filter(s => !s.isArchived);
          const visibleSports = inFavoritesMode
            ? allVisible.filter(s => favoriteSports.includes(s.id))
            : allVisible;
          const hiddenCount = inFavoritesMode
            ? allVisible.filter(s => !favoriteSports.includes(s.id)).length
            : 0;
          return (
            <div className="relative">
              <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
                style={{ background: 'linear-gradient(to left, white 20%, transparent)' }} />
            <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {/* Collapse button when expanded */}
              {inExpandedMode && (
                <button
                  onClick={() => { setShowAllSports(false); setSportFilter(null); }}
                  className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                  style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1.5px solid #86efac' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                  Mes sports
                </button>
              )}
              {/* "Mes sports" or "Tous" */}
              <button
                onClick={() => setSportFilter(null)}
                className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors cursor-pointer"
                style={sportFilter === null
                  ? { backgroundColor: '#0F1E3A', color: 'white' }
                  : { backgroundColor: '#f1f5f9', color: '#64748b' }}
              >
                {inFavoritesMode ? 'Mes sports' : 'Tous'}
              </button>
              {/* Sport pills */}
              {visibleSports.map(sport => (
                <button key={sport.id}
                  onClick={() => setSportFilter(sportFilter === sport.id ? null : sport.id)}
                  className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer"
                  style={sportFilter === sport.id
                    ? { backgroundColor: sport.color, color: 'white' }
                    : { backgroundColor: '#f1f5f9', color: '#64748b' }}
                >
                  <SportIcon sport={sport.id} size={13} color={sportFilter === sport.id ? 'white' : sport.color} />
                  {sport.label}
                </button>
              ))}
              {/* "+ N sports" expand button */}
              {inFavoritesMode && hiddenCount > 0 && (
                <button
                  onClick={() => { setShowAllSports(true); setSportFilter(null); }}
                  className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 flex items-center gap-1 transition-colors cursor-pointer"
                  style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1.5px dashed #86efac' }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  {hiddenCount} sport{hiddenCount > 1 ? 's' : ''}
                </button>
              )}
            </div>
            </div>
          );
        })()}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-xs text-gray-400 mb-3 font-medium">
          {filtered.length} club{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Club admin: My Club banner */}
        {myClub && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            className="mb-3 rounded-2xl p-4 flex items-center gap-3 border"
            style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', borderColor: '#fde68a' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#f59e0b' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm font-poppins truncate" style={{ color: '#92400e' }}>{myClub.name}</div>
              <div className="text-xs" style={{ color: '#b45309' }}>Votre club · {myClub.city}</div>
            </div>
            <button
              onClick={() => setSelectedClub(myClub)}
              className="text-xs font-bold text-white px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ backgroundColor: '#f59e0b' }}>
              Gérer
            </button>
          </motion.div>
        )}

        {/* Regular user: request banner (not logged in, or logged in but no club and no request) */}
        {!isClubAdmin && !isAdmin && (
          <>
            {!myRequest ? (
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
                  <div className="text-xs text-green-600">Faites une demande pour gérer votre page.</div>
                </div>
                <button
                  onClick={() => currentUser ? setShowRequestModal(true) : onShowAuth?.()}
                  className="text-xs font-bold text-white px-3 py-1.5 rounded-xl flex-shrink-0 transition-opacity"
                  style={{ backgroundColor: '#22C55E' }}
                >
                  {currentUser ? 'Demander' : 'Se connecter'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="mb-3 rounded-2xl p-4 flex items-center gap-3 border"
                style={{
                  background: myRequest.status === 'pending' ? 'linear-gradient(135deg, #fffbeb, #fef3c7)' : 'linear-gradient(135deg, #fef2f2, #fee2e2)',
                  borderColor: myRequest.status === 'pending' ? '#fde68a' : '#fecaca',
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: myRequest.status === 'pending' ? '#f59e0b' : '#ef4444' }}>
                  {myRequest.status === 'pending' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm font-poppins"
                    style={{ color: myRequest.status === 'pending' ? '#92400e' : '#991b1b' }}>
                    {myRequest.status === 'pending' ? 'Demande en cours d\'examen' : 'Demande refusée'}
                  </div>
                  <div className="text-xs truncate"
                    style={{ color: myRequest.status === 'pending' ? '#b45309' : '#b91c1c' }}>
                    {myRequest.clubName}
                    {myRequest.reviewNote && ` · ${myRequest.reviewNote}`}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* Clubs list */}
        {filtered.map((club, i) => {
          const sport = SPORTS[club.sport];
          const own   = isOwnClub(club);

          return (
            <motion.div key={club.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025, duration: 0.15 }}
              className="bg-white rounded-2xl mb-2.5 shadow-sm border overflow-hidden"
              style={{ borderColor: own ? '#BBF7D0' : '#f1f5f9' }}
            >
              <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                {/* Avatar */}
                <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0 font-bold text-white text-sm font-oswald tracking-wide select-none"
                  style={{ backgroundColor: club.logo ? 'transparent' : (sport?.color ?? '#64748b'), boxShadow: '0 0 0 2px white, 0 0 0 3.5px rgba(0,0,0,0.08)' }}>
                  {club.logo
                    ? <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
                    : club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold text-gray-800 text-sm truncate">{club.name}</div>
                    {own && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: '#F0FDF4', color: '#16a34a' }}>
                        {isAdmin ? 'Géré' : 'Mon club'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500">{club.city}</span>
                    {club.members > 0 && <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{club.members} membres</span>
                    </>}
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
                          <span className="text-[10px] text-gray-400 flex-shrink-0">+{club.categories.length - 5}</span>
                        )}
                      </>
                    ) : club.level ? (
                      <span className="text-[10px] text-gray-400">{club.level}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex border-t border-gray-100">
                {own ? (
                  <>
                    <button onClick={() => setFormClub(club)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors cursor-pointer">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                      </svg>
                      Éditer
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => setSelectedClub(club)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-semibold transition-colors font-poppins hover:bg-gray-50 cursor-pointer"
                      style={{ color: '#22C55E' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ma page
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => setConfirmDelete(club)}
                      className="flex items-center justify-center py-2.5 px-3 text-red-400 hover:bg-red-50 transition-colors cursor-pointer">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    {club.contact && (
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
                      </>
                    )}
                    <button onClick={() => setSelectedClub(club)}
                      className="flex items-center justify-center gap-1.5 flex-1 py-2.5 text-xs font-semibold transition-colors font-poppins hover:bg-gray-50 cursor-pointer"
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

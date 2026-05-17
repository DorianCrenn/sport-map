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

export default function ClubsPage({ allEvents, onShowAuth, onAddEvent, canAddEvent }) {
  const { allSports: SPORTS } = useSports();
  const { userClubs, addClub, updateClub, deleteClub } = useClubs();
  const { requests, submitRequest } = useClubRequests();
  const { currentUser, isAdmin, isClubAdmin, followClub, unfollowClub, isFollowingClub } = useAuth();

  const [search, setSearch]               = useState('');
  const [sportFilter, setSportFilter]     = useState(null);
  const [showAllSports, setShowAllSports] = useState(false);
  const [selectedClub, setSelectedClub]   = useState(null);
  const [formClub, setFormClub]           = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

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
  }).sort((a, b) => {
    const aF = isFollowingClub(a.id) ? 0 : 1;
    const bF = isFollowingClub(b.id) ? 0 : 1;
    return aF - bF;
  });

  const myClub = isClubAdmin && currentUser?.clubId
    ? userClubs.find(c => c.id === currentUser.clubId)
    : null;

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

  const allVisible = Object.values(SPORTS).filter(s => !s.isArchived);
  const visibleSports = inFavoritesMode
    ? allVisible.filter(s => favoriteSports.includes(s.id))
    : allVisible;
  const hiddenCount = inFavoritesMode
    ? allVisible.filter(s => !favoriteSports.includes(s.id)).length
    : 0;

  const inExpandedMode = favoriteSports.length > 0 && showAllSports;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', backgroundColor: 'var(--sl-bg)' }}>

      <AnimatePresence>
        {selectedClub && (
          <ClubPageView
            key={selectedClub.id}
            club={selectedClub}
            allEvents={allEvents ?? []}
            onBack={() => setSelectedClub(null)}
            onAddEvent={onAddEvent}
            canAddEvent={canAddEvent}
            onUpdateClub={async (data) => {
              await updateClub(selectedClub.id, data);
              setSelectedClub(prev => ({ ...prev, ...data }));
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {formClub !== null && (
          <ClubFormModal
            club={formClub === true ? null : formClub}
            onSave={handleSave}
            onClose={() => setFormClub(null)}
          />
        )}
      </AnimatePresence>

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
            style={{
              position: 'absolute', inset: 0, zIndex: 20, display: 'flex',
              alignItems: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)',
            }}
            onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}
          >
            <motion.div
              initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
              transition={{ type: 'spring', stiffness: 340, damping: 34 }}
              style={{
                borderRadius: '20px 20px 0 0', padding: 24, width: '100%',
                backgroundColor: 'var(--sl-card)', borderTop: '1px solid var(--sl-border)',
              }}
            >
              <h3 style={{ fontWeight: 700, fontSize: 16, color: 'var(--sl-t1)', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                Supprimer le club ?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--sl-t2)', marginBottom: 20 }}>
                Cette action supprimera <strong style={{ color: 'var(--sl-t1)' }}>{confirmDelete.name}</strong> et sa page définitivement.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setConfirmDelete(null)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                    fontSize: 14, fontWeight: 600,
                    border: '1px solid var(--sl-border-s)',
                    color: 'var(--sl-t2)', backgroundColor: 'var(--sl-surface)',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer',
                    fontSize: 14, fontWeight: 700,
                    backgroundColor: '#ef4444', color: '#fff', border: 'none',
                  }}
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{
        padding: '14px 14px 10px', flexShrink: 0,
        backgroundColor: 'var(--sl-card)',
        borderBottom: '1px solid var(--sl-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
            Clubs
          </span>
          {isAdmin && (
            <button
              onClick={() => setFormClub(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 10,
                backgroundColor: 'var(--sl-green)', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Ajouter
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Rechercher un club ou une ville…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              borderRadius: 12, fontSize: 13, fontFamily: 'Inter, sans-serif',
              backgroundColor: 'var(--sl-input-bg)',
              border: '1px solid var(--sl-input-border)',
              color: 'var(--sl-t1)', outline: 'none',
            }}
          />
        </div>

        {/* Sport filter chips */}
        <div style={{ position: 'relative' }}>
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 24,
            background: 'linear-gradient(to left, var(--sl-card) 20%, transparent)',
            zIndex: 10, pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {inExpandedMode && (
              <button
                onClick={() => { setShowAllSports(false); setSportFilter(null); }}
                style={{
                  padding: '4px 10px', borderRadius: 999, border: '1px solid var(--sl-green)',
                  fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0,
                  backgroundColor: 'var(--sl-green-dim)', color: 'var(--sl-green)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
                Mes sports
              </button>
            )}
            <button
              onClick={() => setSportFilter(null)}
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                backgroundColor: sportFilter === null ? 'var(--sl-green)' : 'transparent',
                color: sportFilter === null ? '#fff' : 'var(--sl-t2)',
                border: sportFilter === null ? '1px solid transparent' : '1px solid var(--sl-border-s)',
              }}
            >
              {inFavoritesMode ? 'Mes sports' : 'Tous'}
            </button>
            {visibleSports.map(sport => (
              <button
                key={sport.id}
                onClick={() => setSportFilter(sportFilter === sport.id ? null : sport.id)}
                style={{
                  padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  backgroundColor: sportFilter === sport.id ? sport.color : 'transparent',
                  color: sportFilter === sport.id ? '#fff' : 'var(--sl-t2)',
                  border: sportFilter === sport.id ? '1px solid transparent' : '1px solid var(--sl-border-s)',
                }}
              >
                <SportIcon sport={sport.id} size={12} color={sportFilter === sport.id ? '#fff' : sport.color} />
                {sport.label}
              </button>
            ))}
            {inFavoritesMode && hiddenCount > 0 && (
              <button
                onClick={() => { setShowAllSports(true); setSportFilter(null); }}
                style={{
                  padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                  whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 4,
                  backgroundColor: 'var(--sl-green-dim)', color: 'var(--sl-green)',
                  border: '1px dashed var(--sl-green)',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                {hiddenCount} sport{hiddenCount > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px 24px' }}>
        <div style={{ fontSize: 11, color: 'var(--sl-t3)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {filtered.length} club{filtered.length !== 1 ? 's' : ''}
        </div>

        {/* My club banner (club admin) */}
        {myClub && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 10, borderRadius: 14, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
              backgroundColor: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            }}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{myClub.name}</div>
              <div style={{ fontSize: 11, color: '#f59e0b' }}>Votre club · {myClub.city}</div>
            </div>
            <button
              onClick={() => setSelectedClub(myClub)}
              style={{
                fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                backgroundColor: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
              }}
            >
              Gérer
            </button>
          </motion.div>
        )}

        {/* Request banner */}
        {!isClubAdmin && !isAdmin && (
          <>
            {!myRequest ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  marginBottom: 10, borderRadius: 14, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  backgroundColor: 'var(--sl-green-dim)', border: '1px solid rgba(34,217,106,0.3)',
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'var(--sl-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--sl-green)' }}>Vous représentez un club ?</div>
                  <div style={{ fontSize: 11, color: 'var(--sl-t2)' }}>Faites une demande pour gérer votre page.</div>
                </div>
                <button
                  onClick={() => currentUser ? setShowRequestModal(true) : onShowAuth?.()}
                  style={{
                    fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 8,
                    backgroundColor: 'var(--sl-green)', color: '#fff', border: 'none', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {currentUser ? 'Demander' : 'Se connecter'}
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                style={{
                  marginBottom: 10, borderRadius: 14, padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  backgroundColor: myRequest.status === 'pending'
                    ? 'rgba(245,158,11,0.1)'
                    : myRequest.status === 'rejected'
                      ? 'rgba(239,68,68,0.08)'
                      : 'rgba(34,197,94,0.08)',
                  border: `1px solid ${
                    myRequest.status === 'pending'
                      ? 'rgba(245,158,11,0.3)'
                      : myRequest.status === 'rejected'
                        ? 'rgba(239,68,68,0.25)'
                        : 'rgba(34,197,94,0.25)'
                  }`,
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: myRequest.status === 'pending'
                    ? '#f59e0b'
                    : myRequest.status === 'rejected'
                      ? '#ef4444'
                      : '#22c55e',
                }}>
                  {myRequest.status === 'pending' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  ) : myRequest.status === 'rejected' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><polyline points="16 8 11 14 8 11"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700, fontSize: 13,
                    color: myRequest.status === 'pending'
                      ? '#f59e0b'
                      : myRequest.status === 'rejected'
                        ? '#ef4444'
                        : '#22c55e',
                  }}>
                    {myRequest.status === 'pending'
                      ? "Demande en cours d'examen"
                      : myRequest.status === 'rejected'
                        ? 'Demande refusée'
                        : 'Demande approuvée — synchronisation en cours'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--sl-t2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          const sportColor = sport?.color ?? '#64748b';
          const own = isOwnClub(club);
          const initials = club.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase().slice(0, 3);

          return (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.025, duration: 0.15 }}
              style={{
                borderRadius: 14, marginBottom: 8, overflow: 'hidden',
                backgroundColor: 'var(--sl-card)',
                border: `1px solid ${own ? 'rgba(34,217,106,0.35)' : 'var(--sl-border)'}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px 10px' }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: club.logo ? 'transparent' : sportColor,
                  fontWeight: 700, fontSize: 13, color: '#fff', fontFamily: 'Inter, sans-serif',
                  boxShadow: `0 0 0 2px var(--sl-card), 0 0 0 3px var(--sl-border-s)`,
                }}>
                  {club.logo
                    ? <img src={club.logo} alt={club.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--sl-t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {club.name}
                    </div>
                    {own && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, flexShrink: 0,
                        backgroundColor: 'var(--sl-green-dim)', color: 'var(--sl-green)',
                      }}>
                        {isAdmin ? 'Géré' : 'Mon club'}
                      </span>
                    )}
                    {!own && isFollowingClub(club.id) && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 999, flexShrink: 0,
                        backgroundColor: 'rgba(59,130,246,0.12)', color: '#3b82f6',
                      }}>
                        Suivi
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--sl-t2)' }}>{club.city}</span>
                    {club.members > 0 && (
                      <>
                        <span style={{ color: 'var(--sl-t3)', fontSize: 10 }}>·</span>
                        <span style={{ fontSize: 11, color: 'var(--sl-t3)' }}>{club.members} membres</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                      backgroundColor: sportColor, color: '#fff', flexShrink: 0,
                    }}>
                      {club.sport}
                    </span>
                    {club.categories?.slice(0, 4).map(cat => (
                      <span key={cat.id} style={{
                        fontSize: 10, fontWeight: 500, padding: '2px 6px', borderRadius: 6,
                        backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)', flexShrink: 0,
                      }}>
                        {cat.name}
                      </span>
                    ))}
                    {club.categories?.length > 4 && (
                      <span style={{ fontSize: 10, color: 'var(--sl-t3)', flexShrink: 0 }}>
                        +{club.categories.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', borderTop: '1px solid var(--sl-border)' }}>
                {own ? (
                  <>
                    <button
                      onClick={() => setFormClub(club)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 5, padding: '9px 0', fontSize: 12, fontWeight: 600,
                        color: 'var(--sl-t2)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/>
                      </svg>
                      Éditer
                    </button>
                    <div style={{ width: 1, backgroundColor: 'var(--sl-border)' }} />
                    <button
                      onClick={() => setSelectedClub(club)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 5, padding: '9px 0', fontSize: 12, fontWeight: 700,
                        color: 'var(--sl-green)', backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ma page
                    </button>
                    <div style={{ width: 1, backgroundColor: 'var(--sl-border)' }} />
                    <button
                      onClick={() => setConfirmDelete(club)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '9px 12px', color: '#ef4444',
                        backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                      </svg>
                    </button>
                  </>
                ) : (
                  <>
                    {currentUser && (() => {
                      const following = isFollowingClub(club.id);
                      return (
                        <>
                          <button
                            onClick={() => following ? unfollowClub(club.id) : followClub(club.id)}
                            aria-label={following ? 'Ne plus suivre ce club' : 'Suivre ce club'}
                            style={{
                              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              gap: 5, padding: '9px 0', fontSize: 12, fontWeight: 700,
                              color: following ? 'var(--sl-green)' : 'var(--sl-t2)',
                              backgroundColor: following ? 'var(--sl-green-dim)' : 'transparent',
                              border: 'none', cursor: 'pointer',
                            }}
                          >
                            {following ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                            )}
                            {following ? 'Suivi ✓' : 'Suivre'}
                          </button>
                          <div style={{ width: 1, backgroundColor: 'var(--sl-border)' }} />
                        </>
                      );
                    })()}
                    {club.contact && (
                      <>
                        <a
                          href={`mailto:${club.contact}`}
                          style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: 5, padding: '9px 0', fontSize: 12, fontWeight: 600,
                            color: 'var(--sl-t2)', textDecoration: 'none',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          Contacter
                        </a>
                        <div style={{ width: 1, backgroundColor: 'var(--sl-border)' }} />
                      </>
                    )}
                    <button
                      onClick={() => setSelectedClub(club)}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 5, padding: '9px 0', fontSize: 12, fontWeight: 700,
                        color: sportColor, backgroundColor: 'transparent', border: 'none', cursor: 'pointer',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
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

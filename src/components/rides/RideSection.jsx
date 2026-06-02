import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useRides } from '../../hooks/useRides.js';
import { useClubFeatures } from '../../hooks/useClubFeatures.js';
import PlanGate from '../ui/PlanGate.jsx';
import UpgradePrompt from '../ui/UpgradePrompt.jsx';
import PlansMiniModal from '../ui/PlansMiniModal.jsx';
import RideCard from './RideCard.jsx';
import CreateRideModal from './CreateRideModal.jsx';
import JoinRideModal from './JoinRideModal.jsx';

export default function RideSection({ event, snapPoint }) {
  const { currentUser } = useAuth();
  const features = useClubFeatures(event?.clubId);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showPlans,   setShowPlans]   = useState(false);
  const {
    rides, loading,
    createRide, cancelRide,
    requestRide, cancelRequest,
    acceptRequest, refuseRequest,
  } = useRides(event.id);

  const [showCreate,  setShowCreate]  = useState(false);
  const [joiningRide, setJoiningRide] = useState(null);

  const activeRides  = rides.filter(r => r.status !== 'cancelled');
  const totalSeats   = activeRides.reduce((s, r) => s + r.availableSeatsLeft, 0);
  const myRide       = activeRides.find(r => r.driverId === currentUser?.id);

  // ── Compact teaser (peek / detail mode) ────────────────────────────────────
  if (snapPoint !== 'full') {
    if (loading || activeRides.length === 0) return null;
    return (
      <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 12, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 16 }}>🚗</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sl-t2)' }}>
            {activeRides.length} covoiturage{activeRides.length > 1 ? 's' : ''}
          </span>
          {totalSeats > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
              backgroundColor: 'rgba(34,217,106,0.12)', color: 'var(--sl-green)',
            }}>
              {totalSeats} place{totalSeats > 1 ? 's' : ''} libre{totalSeats > 1 ? 's' : ''}
            </span>
          )}
          {totalSeats === 0 && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 600 }}>
              Complet
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Gate plan — covoiturage verrouillé en plan Gratuit ────────────────────
  if (!features.loading && !features.can('CARPOOLING')) {
    return (
      <>
        <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 16, marginTop: 8 }}>
          <PlanGate
            allowed={false}
            feature="CARPOOLING"
            mode="overlay"
            onUpgrade={() => setShowUpgrade(true)}
          >
            <div style={{ padding: '4px 0 8px' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)', marginBottom: 4 }}>
                🚗 Covoiturages
              </div>
              <div style={{ fontSize: 12, color: 'var(--sl-t3)', lineHeight: 1.5 }}>
                Organisez des trajets partagés entre équipiers et supporters
              </div>
            </div>
          </PlanGate>
        </div>
        <UpgradePrompt
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          currentPlanId={features.planId}
          featureLabel="le covoiturage"
          requiredPlanId="starter"
          onViewPlans={() => setShowPlans(true)}
        />
        <PlansMiniModal
          open={showPlans}
          onClose={() => setShowPlans(false)}
          currentPlanId={features.planId}
        />
      </>
    );
  }

  // ── Full section (full mode) ────────────────────────────────────────────────
  return (
    <>
      <div style={{ borderTop: '1px solid var(--sl-border)', paddingTop: 16, marginTop: 8 }}>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--sl-t1)', display: 'flex', alignItems: 'center', gap: 6 }}>
              🚗 Covoiturages
              {activeRides.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, backgroundColor: 'var(--sl-surface)', color: 'var(--sl-t3)', border: '1px solid var(--sl-border)' }}>
                  {activeRides.length}
                </span>
              )}
            </div>
            {activeRides.length > 0 && (
              <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 3 }}>
                {totalSeats > 0 ? `${totalSeats} place${totalSeats > 1 ? 's' : ''} libre${totalSeats > 1 ? 's' : ''}` : 'Complet'}
                {' · Paiement direct entre participants'}
              </div>
            )}
          </div>
          {currentUser && !myRide && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '8px 14px', borderRadius: 12, cursor: 'pointer',
                fontSize: 12, fontWeight: 700, border: 'none', flexShrink: 0,
                backgroundColor: 'var(--sl-green)', color: '#fff',
                boxShadow: '0 2px 8px rgba(34,217,106,0.3)',
              }}
            >
              + Proposer
            </motion.button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--sl-t3)', fontSize: 13 }}>
            Chargement…
          </div>
        )}

        {/* Empty state */}
        {!loading && activeRides.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              borderRadius: 14, padding: '24px 16px', textAlign: 'center',
              backgroundColor: 'var(--sl-surface)', border: '1px dashed var(--sl-border)',
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 10 }}>🚗</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--sl-t2)', marginBottom: 4 }}>
              Aucun covoiturage proposé
            </div>
            <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginBottom: currentUser ? 16 : 0 }}>
              Vous allez à cet événement ? Proposez un trajet à la communauté !
            </div>
            {currentUser && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreate(true)}
                style={{
                  padding: '10px 22px', borderRadius: 12, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  backgroundColor: 'var(--sl-green)', color: '#fff', border: 'none',
                  boxShadow: '0 2px 10px rgba(34,217,106,0.3)',
                }}
              >
                Proposer un trajet
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Rides list */}
        {!loading && activeRides.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <AnimatePresence initial={false}>
              {activeRides.map(ride => (
                <motion.div
                  key={ride.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                >
                  <RideCard
                    ride={ride}
                    currentUser={currentUser}
                    onJoin={() => setJoiningRide(ride)}
                    onAccept={(reqId, passId, passName) => acceptRequest(reqId, ride.id, passId, passName)}
                    onRefuse={(reqId, passId) => refuseRequest(reqId, ride.id, passId)}
                    onCancel={() => cancelRide(ride.id)}
                    onCancelRequest={(reqId) => cancelRequest(reqId, ride.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {!currentUser && !loading && (
          <p style={{ fontSize: 11, color: 'var(--sl-t3)', textAlign: 'center', marginTop: 12 }}>
            Connectez-vous pour proposer ou rejoindre un covoiturage.
          </p>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreateRideModal
            key="create"
            event={event}
            onSave={async (data) => { await createRide(data); setShowCreate(false); }}
            onClose={() => setShowCreate(false)}
          />
        )}
        {joiningRide && (
          <JoinRideModal
            key="join"
            ride={joiningRide}
            onSave={async (msg) => { await requestRide(joiningRide.id, msg); setJoiningRide(null); }}
            onClose={() => setJoiningRide(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

import { usePushNotifications } from '../hooks/usePushNotifications.js';

export default function PushNotificationToggle() {
  const { subscribed, loading, error, permission, toggle } = usePushNotifications();

  const denied = permission === 'denied';

  return (
    <div className="flex items-center justify-between gap-3 p-4 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>

      {/* Left — icon + label */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: subscribed ? 'rgba(34,217,106,0.18)' : 'rgba(255,255,255,0.08)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke={subscribed ? '#22D96A' : 'rgba(255,255,255,0.5)'}
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            {subscribed && <line x1="1" y1="1" x2="23" y2="23" stroke="#22D96A"/>}
          </svg>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold font-poppins text-white">
            Notifications push
          </div>
          <div className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {denied
              ? 'Bloquées par le navigateur'
              : subscribed
              ? 'Activées — rappels et alertes'
              : 'Désactivées'}
          </div>
        </div>
      </div>

      {/* Right — toggle */}
      {denied ? (
        <span className="text-xs font-poppins" style={{ color: 'rgba(255,100,100,0.8)' }}>
          Bloqué
        </span>
      ) : (
        <button
          onClick={toggle}
          disabled={loading}
          aria-label={subscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
          aria-pressed={subscribed}
          className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer"
          style={{
            backgroundColor: subscribed ? '#22D96A' : 'rgba(255,255,255,0.15)',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <span
            className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-200"
            style={{ transform: subscribed ? 'translateX(20px)' : 'translateX(0)' }}
          />
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="sr-only" role="alert">{error}</p>
      )}
    </div>
  );
}

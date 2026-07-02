import { motion } from 'framer-motion';

interface StatusConfig {
  key: string;
  label: string;
  icon: string;
  activeColor: string;
  textColor: string;
  activeBg: string;
}

const STATUSES: StatusConfig[] = [
  { key: 'present', label: 'Présent',   icon: '✓', activeColor: '#22d96a', textColor: '#22d96a', activeBg: '#22d96a' },
  { key: 'absent',  label: 'Absent',    icon: '✕', activeColor: '#ef4444', textColor: '#ef4444', activeBg: '#ef4444' },
  { key: 'unsure',  label: 'Incertain', icon: '?', activeColor: '#94a3b8', textColor: '#94a3b8', activeBg: '#64748b' },
];

interface PresenceButtonsProps {
  myStatus?: string | null;
  onRespond: (status: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function PresenceButtons({ myStatus, onRespond, disabled = false, size = 'md' }: PresenceButtonsProps) {
  const py        = size === 'sm' ? 'py-2'      : 'py-2.5';
  const iconSize  = size === 'sm' ? 'text-sm'   : 'text-base';
  const labelSize = size === 'sm' ? 'text-[9px]' : 'text-[10px]';

  return (
    <div className="flex gap-2">
      {STATUSES.map(s => {
        const isActive = myStatus === s.key;
        return (
          <motion.button
            key={s.key}
            whileTap={{ scale: 0.93 }}
            onClick={() => !disabled && myStatus !== s.key && onRespond(s.key)}
            disabled={disabled}
            aria-pressed={isActive}
            aria-label={s.label}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 rounded-xl ${py} font-bold transition-all select-none`}
            style={{
              background: isActive
                ? s.activeBg
                : `color-mix(in srgb, ${s.activeColor} 12%, transparent)`,
              color:  isActive ? '#fff' : s.textColor,
              border: `1.5px solid ${isActive ? s.activeBg : s.activeColor}`,
              opacity: disabled ? 0.45 : 1,
              cursor:  disabled ? 'default' : myStatus === s.key ? 'default' : 'pointer',
            }}
          >
            <span className={`font-black ${iconSize}`}>{s.icon}</span>
            <span className={`${labelSize} leading-none`}>{s.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

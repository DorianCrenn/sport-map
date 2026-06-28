import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { useAndroidBack } from '../../hooks/useAndroidBack.js';
import {
  IconBarChart, IconEdit, IconCalendar, IconMegaphone, IconBell,
  IconClipboard, IconShirt, IconShield, IconUsers, IconBriefcase,
  type IconProps,
} from '../icons.js';

type IconComponent = (props: IconProps) => React.ReactElement;
const ITEMS: { id: string; Icon?: IconComponent; color?: string; label?: string; desc?: string }[] = [
  { id: 'dashboard',  Icon: IconBarChart,   color: 'var(--sl-green)', label: 'Tableau de bord',     desc: 'Stats, vues, conversions' },
  { id: 'edit-page',  Icon: IconEdit,       color: '#3da5ff',         label: 'Modifier la page',    desc: 'Blocs, design, typographie' },
  { id: 'event',      Icon: IconCalendar,   color: '#a855f7',         label: 'Créer un événement',  desc: 'Match, tournoi, entraînement' },
  { id: 'announce',   Icon: IconMegaphone,  color: '#f97316',         label: 'Envoyer une annonce',  desc: 'Tous les abonnés ou une équipe' },
  { id: 'push',       Icon: IconBell,       color: '#6366f1',         label: 'Notification push',    desc: 'Envoyer aux joueurs ou convoqués' },
  { id: 'divider' },
  { id: 'edit-info',  Icon: IconClipboard,  color: 'var(--sl-t2)',    label: 'Infos du club',       desc: 'Nom, sport, ville, équipes' },
  { id: 'add-team',   Icon: IconShirt,      color: 'var(--sl-t2)',    label: 'Créer une équipe',    desc: 'Ajouter une catégorie ou une équipe' },
  { id: 'managers',   Icon: IconShield,     color: 'var(--sl-t2)',    label: 'Administrateurs',     desc: 'Gérer les accès au club' },
  { id: 'roster',     Icon: IconUsers,      color: 'var(--sl-t2)',    label: 'Membres',             desc: 'Effectif et rôles' },
  { id: 'sponsors',   Icon: IconBriefcase,  color: 'var(--sl-t2)',    label: 'Partenaires',         desc: 'Logos et liens sponsors' },
];

interface ClubAdminDrawerProps {
  open: boolean;
  onClose: () => void;
  onAction: (id: string) => void;
  isEditing?: boolean;
}

export default function ClubAdminDrawer({ open, onClose, onAction, isEditing }: ClubAdminDrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(drawerRef, open);
  useAndroidBack(open, onClose);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  function handleHandleDown(e: React.MouseEvent | React.TouchEvent) {
    const el = drawerRef.current;
    if (!el) return;
    const startY = (e as any).touches?.[0]?.clientY ?? (e as React.MouseEvent).clientY;
    function onMove(e: MouseEvent | TouchEvent) {
      const dy = Math.max(0, ((e as any).touches?.[0]?.clientY ?? (e as MouseEvent).clientY) - startY);
      el.style.transform = `translateY(${dy}px)`;
      el.style.transition = 'none';
    }
    function onEnd(e: MouseEvent | TouchEvent) {
      const dy = ((e as any).changedTouches?.[0] ?? e as MouseEvent).clientY - startY;
      el.style.transform = '';
      el.style.transition = '';
      if (dy > 100) onClose?.();
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
    }
    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 60, backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }} />
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Administration du club"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 61, backgroundColor: 'var(--sl-card)', borderRadius: '20px 20px 0 0', overflow: 'hidden', paddingBottom: 'env(safe-area-inset-bottom, 0px)', maxHeight: '82dvh', display: 'flex', flexDirection: 'column' }}
          >
            <div onMouseDown={handleHandleDown} onTouchStart={handleHandleDown} style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px', flexShrink: 0, cursor: 'grab', touchAction: 'none' }}>
              <div style={{ width: 36, height: 3.5, borderRadius: 999, backgroundColor: 'var(--sl-border-s)' }} />
            </div>
            <div style={{ padding: '8px 18px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sl-border)', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--sl-t1)', letterSpacing: '-0.02em' }}>Administration</div>
                <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 2 }}>Outils de gestion du club</div>
              </div>
              <button onClick={onClose} aria-label="Fermer" style={{ width: 44, height: 44, borderRadius: 10, border: 'none', backgroundColor: 'var(--sl-surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--sl-t2)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {ITEMS.map((item, i) => {
                if (item.id === 'divider') return <div key={i} style={{ height: 1, backgroundColor: 'var(--sl-border)', margin: '4px 0' }} />;
                const isActive = item.id === 'edit-page' && isEditing;
                return (
                  <button
                    key={item.id}
                    onClick={() => { onAction(item.id); onClose(); }}
                    data-demo={`admin-${item.id}`}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', border: 'none', cursor: 'pointer', backgroundColor: isActive ? 'rgba(34,217,106,0.07)' : 'transparent', textAlign: 'left', transition: 'background 0.1s' }}
                    onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--sl-hover)')}
                    onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(34,217,106,0.07)' : 'transparent'; }}
                  >
                    <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: isActive ? 'rgba(34,217,106,0.12)' : `${(item.color ?? '#fff')}14`, border: `1px solid ${isActive ? 'rgba(34,217,106,0.3)' : `${(item.color ?? '#fff')}28`}` }}>
                      {item.Icon && <item.Icon size={18} color={isActive ? 'var(--sl-green)' : item.color} strokeWidth={1.75} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isActive ? 'var(--sl-green)' : 'var(--sl-t1)' }}>
                        {item.label}
                        {isActive && <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 700, color: 'var(--sl-green)' }}>✓ ACTIF</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--sl-t3)', marginTop: 1 }}>{item.desc}</div>
                    </div>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--sl-t3)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

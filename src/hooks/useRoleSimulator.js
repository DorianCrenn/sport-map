import { useState, useCallback } from 'react';

const STORAGE_KEY = 'sl-role-simulator';

export const SIM_ROLES = [
  { id: null,          label: 'Moi-même (admin)',   color: '#ef4444', icon: '🔑' },
  { id: 'visitor',     label: 'Visiteur',            color: '#64748b', icon: '👤' },
  { id: 'supporter',   label: 'Supporter',           color: '#3b82f6', icon: '⭐' },
  { id: 'player',      label: 'Joueur',              color: '#22c55e', icon: '⚽' },
  { id: 'parent',      label: 'Parent',              color: '#06b6d4', icon: '👨‍👧' },
  { id: 'coach',       label: 'Coach',               color: '#f97316', icon: '🎽' },
  { id: 'club_manager',label: 'Responsable',         color: '#8b5cf6', icon: '🏟️' },
  { id: 'club_admin',  label: 'Admin Club',          color: '#f59e0b', icon: '👑' },
];

export const SIM_PLANS = [
  { id: null,      label: 'Mon plan réel',   color: '#64748b', icon: '🔑' },
  { id: 'free',    label: 'Club Gratuit',    color: '#64748b', icon: '⚪' },
  { id: 'starter', label: 'Club Starter',   color: '#3b82f6', icon: '🔵' },
  { id: 'pro',     label: 'Club Pro',        color: '#8b5cf6', icon: '🟣' },
  { id: 'elite',   label: 'Club Elite',      color: '#f59e0b', icon: '👑' },
];

function loadFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { role: null, plan: null };
    return JSON.parse(raw);
  } catch { return { role: null, plan: null }; }
}

function saveToStorage(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useRoleSimulator() {
  const [simRole, setSimRole] = useState(() => loadFromStorage().role);
  const [simPlan, setSimPlan] = useState(() => loadFromStorage().plan);

  const isActive = simRole !== null || simPlan !== null;

  const setRole = useCallback((role) => {
    setSimRole(role);
    saveToStorage({ role, plan: simPlan });
  }, [simPlan]);

  const setPlan = useCallback((plan) => {
    setSimPlan(plan);
    saveToStorage({ role: simRole, plan });
  }, [simRole]);

  const reset = useCallback(() => {
    setSimRole(null);
    setSimPlan(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const currentSim = {
    role: SIM_ROLES.find(r => r.id === simRole) ?? SIM_ROLES[0],
    plan: SIM_PLANS.find(p => p.id === simPlan) ?? SIM_PLANS[0],
  };

  return { simRole, simPlan, isActive, setRole, setPlan, reset, currentSim, SIM_ROLES, SIM_PLANS };
}

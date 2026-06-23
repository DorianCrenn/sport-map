import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoleSimulator, SIM_ROLES, SIM_PLANS } from '../../hooks/useRoleSimulator.js';

const sessionStore: Record<string, string> = {};
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem:    (k: string) => sessionStore[k] ?? null,
    setItem:    (k: string, v: string) => { sessionStore[k] = v; },
    removeItem: (k: string) => { delete sessionStore[k]; },
    clear:      () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]); },
  },
  writable: true,
});

describe('useRoleSimulator', () => {
  beforeEach(() => sessionStorage.clear());

  it('isActive=false par défaut', () => {
    const { result } = renderHook(() => useRoleSimulator());
    expect(result.current.isActive).toBe(false);
    expect(result.current.simRole).toBeNull();
    expect(result.current.simPlan).toBeNull();
  });

  it('setRole met à jour simRole et isActive', () => {
    const { result } = renderHook(() => useRoleSimulator());
    act(() => { result.current.setRole('visitor'); });
    expect(result.current.simRole).toBe('visitor');
    expect(result.current.isActive).toBe(true);
  });

  it('setPlan met à jour simPlan et isActive', () => {
    const { result } = renderHook(() => useRoleSimulator());
    act(() => { result.current.setPlan('pro'); });
    expect(result.current.simPlan).toBe('pro');
    expect(result.current.isActive).toBe(true);
  });

  it('reset remet simRole et simPlan à null', () => {
    const { result } = renderHook(() => useRoleSimulator());
    act(() => { result.current.setRole('coach'); result.current.setPlan('starter'); });
    act(() => { result.current.reset(); });
    expect(result.current.simRole).toBeNull();
    expect(result.current.simPlan).toBeNull();
    expect(result.current.isActive).toBe(false);
  });

  it('reset supprime la clé sessionStorage', () => {
    const { result } = renderHook(() => useRoleSimulator());
    act(() => { result.current.setRole('player'); });
    act(() => { result.current.reset(); });
    expect(sessionStorage.getItem('sl-role-simulator')).toBeNull();
  });

  it('setRole persiste en sessionStorage', () => {
    const { result } = renderHook(() => useRoleSimulator());
    act(() => { result.current.setRole('club_admin'); });
    const stored = JSON.parse(sessionStorage.getItem('sl-role-simulator') ?? '{}');
    expect(stored.role).toBe('club_admin');
  });

  it('charge depuis sessionStorage au montage', () => {
    sessionStorage.setItem('sl-role-simulator', JSON.stringify({ role: 'parent', plan: 'free' }));
    const { result } = renderHook(() => useRoleSimulator());
    expect(result.current.simRole).toBe('parent');
    expect(result.current.simPlan).toBe('free');
    expect(result.current.isActive).toBe(true);
  });

  it('currentSim.role correspond au rôle simulé', () => {
    const { result } = renderHook(() => useRoleSimulator());
    act(() => { result.current.setRole('coach'); });
    expect(result.current.currentSim.role.id).toBe('coach');
    expect(result.current.currentSim.role.label).toMatch(/coach/i);
  });

  it('currentSim.plan correspond au plan simulé', () => {
    const { result } = renderHook(() => useRoleSimulator());
    act(() => { result.current.setPlan('elite'); });
    expect(result.current.currentSim.plan.id).toBe('elite');
    expect(result.current.currentSim.plan.label).toMatch(/elite/i);
  });
});

describe('SIM_ROLES et SIM_PLANS', () => {
  it('SIM_ROLES contient les rôles attendus', () => {
    const ids = SIM_ROLES.map(r => r.id);
    expect(ids).toContain(null);
    expect(ids).toContain('visitor');
    expect(ids).toContain('coach');
    expect(ids).toContain('club_admin');
  });

  it('SIM_PLANS contient les plans attendus', () => {
    const ids = SIM_PLANS.map(p => p.id);
    expect(ids).toContain(null);
    expect(ids).toContain('free');
    expect(ids).toContain('pro');
    expect(ids).toContain('elite');
  });

  it('chaque rôle a id, label, color, icon', () => {
    SIM_ROLES.forEach(r => {
      expect(r).toHaveProperty('label');
      expect(r).toHaveProperty('color');
      expect(r).toHaveProperty('icon');
    });
  });
});

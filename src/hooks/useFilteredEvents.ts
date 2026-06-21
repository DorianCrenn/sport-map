import { useMemo } from 'react';
import type { SportLinkEvent, GeoCoords } from '../types/sportlink.js';

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

function isThisWeekend(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  const todayDay = today.getDay();
  const daysUntilSat = (6 - todayDay + 7) % 7 || 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSat);
  sat.setHours(0, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return d >= sat && d <= sun;
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);
  return d >= today && d <= endOfWeek;
}

interface FilterOptions {
  sport?: string | null;
  dateRange?: string | null;
  departmentId?: string | null;
  nearbyCoords?: GeoCoords | null;
  sportScope?: string[] | null;
  cityFilter?: string | null;
}

export function useFilteredEvents(
  events: SportLinkEvent[],
  { sport, dateRange, departmentId, nearbyCoords, sportScope, cityFilter }: FilterOptions,
): SportLinkEvent[] {
  return useMemo(() => {
    let result = events;

    if (departmentId) {
      result = result.filter(e => !(e as { departmentId?: string }).departmentId || (e as { departmentId?: string }).departmentId === departmentId);
    }

    if (cityFilter) {
      const q = cityFilter.toLowerCase();
      result = result.filter(e => (e.city ?? '').toLowerCase().includes(q));
    }

    if (sport) {
      result = result.filter(e => e.sport === sport);
    } else if (sportScope && sportScope.length > 0) {
      result = result.filter(e => sportScope.includes(e.sport));
    }

    if (nearbyCoords) {
      result = result.filter(e =>
        e.lat != null && e.lng != null &&
        haversineKm(nearbyCoords.lat, nearbyCoords.lng, e.lat!, e.lng!) <= 20,
      );
    }

    if (dateRange === 'today') {
      result = result.filter(e => isToday(e.date));
    } else if (dateRange === 'weekend') {
      result = result.filter(e => isThisWeekend(e.date));
    } else if (dateRange === 'week') {
      result = result.filter(e => isThisWeek(e.date));
    } else if (dateRange) {
      result = result.filter(e => e.date.slice(0, 10) === dateRange);
    }

    return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events, sport, dateRange, departmentId, nearbyCoords, sportScope, cityFilter]);
}

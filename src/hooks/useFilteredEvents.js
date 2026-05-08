import { useMemo } from 'react';

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function getDatePart(dateStr) {
  return new Date(dateStr).toDateString();
}

function isToday(dateStr) {
  return getDatePart(dateStr) === new Date().toDateString();
}

function isThisWeekend(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const today = new Date();
  const todayDay = today.getDay();
  // Find next Saturday
  const daysUntilSat = (6 - todayDay + 7) % 7;
  const sat = new Date(today);
  sat.setDate(today.getDate() + daysUntilSat);
  sat.setHours(0, 0, 0, 0);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  sun.setHours(23, 59, 59, 999);
  return d >= sat && d <= sun;
}

function isThisWeek(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + 7);
  endOfWeek.setHours(23, 59, 59, 999);
  return d >= today && d <= endOfWeek;
}

export function useFilteredEvents(events, { sport, dateRange, departmentId, nearbyCoords, sportScope }) {
  return useMemo(() => {
    let result = events;

    if (departmentId) {
      result = result.filter(e => e.departmentId === departmentId);
    }

    if (sport) {
      result = result.filter(e => e.sport === sport);
    } else if (sportScope && sportScope.length > 0) {
      result = result.filter(e => sportScope.includes(e.sport));
    }

    if (nearbyCoords) {
      result = result.filter(e => haversineKm(nearbyCoords.lat, nearbyCoords.lng, e.lat, e.lng) <= 20);
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

    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, sport, dateRange, departmentId, nearbyCoords, sportScope]);
}

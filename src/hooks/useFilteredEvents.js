import { useMemo } from 'react';

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

export function useFilteredEvents(events, { sport, dateRange, departmentId }) {
  return useMemo(() => {
    let result = events;

    if (departmentId) {
      result = result.filter(e => e.departmentId === departmentId);
    }

    if (sport) {
      result = result.filter(e => e.sport === sport);
    }

    if (dateRange === 'today') {
      result = result.filter(e => isToday(e.date));
    } else if (dateRange === 'weekend') {
      result = result.filter(e => isThisWeekend(e.date));
    } else if (dateRange === 'week') {
      result = result.filter(e => isThisWeek(e.date));
    }

    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [events, sport, dateRange, departmentId]);
}

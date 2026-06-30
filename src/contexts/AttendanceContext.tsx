/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useAttendees } from '../hooks/useAttendees.js';

interface AttendanceContextValue {
  attending: Set<string>;
  toggle: (eventId: string) => void;
  isAttending: (eventId: string) => boolean;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { attending, toggle, isAttending } = useAttendees();
  const value = useMemo(
    () => ({ attending, toggle, isAttending }),
    [attending, toggle, isAttending],
  );
  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendanceContext(): AttendanceContextValue {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendanceContext must be used within AttendanceProvider');
  return ctx;
}

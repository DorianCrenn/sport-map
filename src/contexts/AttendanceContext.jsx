import { createContext, useContext, useMemo } from 'react';
import { useAttendees } from '../hooks/useAttendees.js';

const AttendanceContext = createContext(null);

export function AttendanceProvider({ children }) {
  const { attending, toggle, isAttending } = useAttendees();
  const value = useMemo(
    () => ({ attending, toggle, isAttending }),
    [attending, toggle, isAttending]
  );
  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>;
}

export function useAttendanceContext() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendanceContext must be used within AttendanceProvider');
  return ctx;
}

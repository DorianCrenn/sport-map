import { createContext, useContext } from 'react';

export const DemoContext = createContext(null);

export function useDemoContext() {
  return useContext(DemoContext); // peut être null si hors mode démo
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used within DemoApp');
  return ctx;
}

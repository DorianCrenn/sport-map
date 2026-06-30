/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('sl-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return 'light'; // light par défaut — l'utilisateur peut basculer manuellement
}

function applySimpleModeOnLoad(): void {
  if (localStorage.getItem('sl-simple-mode') === 'true') {
    document.documentElement.setAttribute('data-simple-mode', 'true');
  }
}

function applyTheme(theme: Theme): void {
  const el = document.documentElement;
  el.setAttribute('data-theme-transition', '');
  if (theme === 'light') {
    el.setAttribute('data-theme', 'light');
  } else {
    el.removeAttribute('data-theme');
  }
  setTimeout(() => el.removeAttribute('data-theme-transition'), 300);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { applyTheme(theme); applySimpleModeOnLoad(); }, []);

  // Plus de suivi automatique de l'OS — le défaut est light, l'utilisateur choisit manuellement

  function setTheme(next: Theme): void {
    localStorage.setItem('sl-theme', next);
    applyTheme(next);
    setThemeState(next);
  }

  function toggleTheme(): void {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

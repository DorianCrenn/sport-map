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
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
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
  useLayoutEffect(() => { applyTheme(theme); }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    function onChange(e: MediaQueryListEvent) {
      if (!localStorage.getItem('sl-theme')) {
        const next: Theme = e.matches ? 'light' : 'dark';
        applyTheme(next);
        setThemeState(next);
      }
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

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

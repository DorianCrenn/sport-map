import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';

const ThemeContext = createContext(null);

function getInitialTheme() {
  const saved = localStorage.getItem('sl-theme');
  if (saved === 'light' || saved === 'dark') return saved;
  // Auto-detect: dark is our default, but respect system light preference
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function applyTheme(theme) {
  const el = document.documentElement;
  // Add transition flag so CSS smooth-transitions can fire
  el.setAttribute('data-theme-transition', '');
  if (theme === 'light') {
    el.setAttribute('data-theme', 'light');
  } else {
    el.removeAttribute('data-theme');
  }
  setTimeout(() => el.removeAttribute('data-theme-transition'), 300);
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Applique le thème avant le premier paint pour éviter le FOUC.
  // L'initializer useState ne doit pas écrire dans le DOM.
  useLayoutEffect(() => {
    applyTheme(theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when system preference changes (only if no saved pref)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    function onChange(e) {
      if (!localStorage.getItem('sl-theme')) {
        const next = e.matches ? 'light' : 'dark';
        applyTheme(next);
        setThemeState(next);
      }
    }
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  function setTheme(next) {
    localStorage.setItem('sl-theme', next);
    applyTheme(next);
    setThemeState(next);
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}

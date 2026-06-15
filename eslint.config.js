import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', '**/*.ts', '**/*.tsx']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // set-state-in-effect : pattern intentionnel dans tout le projet (sync props→state)
      'react-hooks/set-state-in-effect': 'off',
      // refs : passing refs via ps object est un pattern établi dans PosterStudio
      'react-hooks/refs': 'off',
      // Règles react-hooks v7 trop strictes pour la base de code actuelle
      'react-compiler/react-compiler': 'off',
      'react-hooks/preserve-manual-memoization': 'off',  // inférence React Compiler non applicable
      'react-hooks/immutability': 'off',                  // hoisting intentionnel des fonctions déclarées
    },
  },
])

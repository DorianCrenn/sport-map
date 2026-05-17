import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { AttendeeCountProvider } from './contexts/AttendeeCountContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <AttendeeCountProvider>
          <App />
        </AttendeeCountProvider>
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
)

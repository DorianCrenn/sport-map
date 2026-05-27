import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import EventPublicPage from './components/EventPublicPage.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <EventPublicPage />
  </StrictMode>
);

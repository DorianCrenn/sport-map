import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ClubPublicPage from './components/ClubPublicPage.jsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClubPublicPage />
  </StrictMode>
);

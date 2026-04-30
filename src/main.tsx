import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import App from './App';
import PasswordGate from './components/PasswordGate';
import { initializeSecurity } from './utils/security';
import './index.css';

// Initialize security measures
initializeSecurity();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PasswordGate>
      <App />
    </PasswordGate>
    <Analytics />
    <SpeedInsights />
  </StrictMode>
);

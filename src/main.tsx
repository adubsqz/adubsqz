import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import PasswordGate from './components/PasswordGate';
import { initializeSecurity } from './utils/security';
import './index.css';

const VercelInsights = lazy(() => import('./components/VercelInsights'));

// Initialize security measures
initializeSecurity();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PasswordGate>
      <App />
    </PasswordGate>
    <Suspense fallback={null}>
      <VercelInsights />
    </Suspense>
  </StrictMode>
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import './stylex.css';
import App from './App.tsx';

createRoot(document.querySelector('#root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/app.css';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('DigiWard could not find its root element.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

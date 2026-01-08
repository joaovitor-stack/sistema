import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Registro obrigatório para o PWA funcionar
import { registerSW } from 'virtual:pwa-register';
registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
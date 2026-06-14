import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/services/i18n';
import '@/css/index.css';
import App from './app';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
);

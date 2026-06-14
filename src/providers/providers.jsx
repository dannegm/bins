import '@/services/i18n';
import '@/css/index.css';

import { BusProvider } from './bus-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }) => (
    <BusProvider>
        <ThemeProvider>{children}</ThemeProvider>
    </BusProvider>
);

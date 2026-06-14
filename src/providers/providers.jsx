import '@/services/i18n';
import '@/css/index.css';

import { BusProvider } from './bus-provider';
import { IdentityProvider } from './identity-provider';
import { ThemeProvider } from './theme-provider';

export const Providers = ({ children }) => (
    <BusProvider>
        <IdentityProvider>
            <ThemeProvider>{children}</ThemeProvider>
        </IdentityProvider>
    </BusProvider>
);

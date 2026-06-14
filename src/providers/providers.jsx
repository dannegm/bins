import '@/services/i18n';
import '@/css/index.css';

import { BusProvider } from './bus-provider';
import { IdentityProvider } from './identity-provider';
import { ThemeProvider } from './theme-provider';
import { useExternalCommands } from '@/hooks/use-external-commands';
import { useGlobalCommands } from '@/hooks/use-global-commands';

const CommandsBridge = () => {
    useExternalCommands();
    useGlobalCommands();
    return null;
};

export const Providers = ({ children }) => (
    <BusProvider>
        <IdentityProvider>
            <ThemeProvider>
                <CommandsBridge />
                {children}
            </ThemeProvider>
        </IdentityProvider>
    </BusProvider>
);

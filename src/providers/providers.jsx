import '@/services/i18n';
import '@/css/index.css';

import { createProviders } from '@/helpers/providers';
import { QueryProvider } from './query-provider';
import { BusProvider } from './bus-provider';
import { IdentityProvider } from './identity-provider';
import { ThemeProvider } from './theme-provider';
import { useExternalCommands } from '@/hooks/use-external-commands';
import { useGlobalCommands } from '@/hooks/use-global-commands';
import { useKeybindingCommands } from '@/hooks/use-keybinding-commands';
import { CommandPaletteProvider } from '@/providers/command-palette-provider';
import { ToastProvider } from '@/providers/toast-provider';

const CommandsBridge = ({ children }) => {
    useExternalCommands();
    useGlobalCommands();
    useKeybindingCommands();
    return children;
};

export const Providers = createProviders([
    [IdentityProvider],
    [BusProvider],
    [CommandsBridge],
    [QueryProvider],
    [ThemeProvider],
    [ToastProvider],
    [CommandPaletteProvider],
]);

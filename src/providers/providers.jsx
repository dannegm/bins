import '@/services/i18n';
import '@/css/index.css';

import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';
import { createProviders } from '@/helpers/providers';
import { HeadlessGuard } from './headless-guard';
import { QueryProvider } from './query-provider';
import { BusProvider } from './bus-provider';
import { IdentityProvider } from './identity-provider';
import { ThemeProvider } from './theme-provider';
import { useExternalCommands } from '@/hooks/use-external-commands';
import { useGlobalCommands } from '@/hooks/use-global-commands';
import { useKeybindingCommands } from '@/hooks/use-keybinding-commands';
import { CommandPaletteProvider } from '@/providers/command-palette-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { NudgeProvider } from '@/providers/nudge-provider';
import { NyanCatProvider } from '@/components/system/nyan-cat';

const CommandsBridge = ({ children }) => {
    useExternalCommands();
    useGlobalCommands();
    useKeybindingCommands();
    return children;
};

export const Providers = createProviders([
    [HeadlessGuard],
    [NuqsAdapter],
    [IdentityProvider],
    [BusProvider],
    [NudgeProvider],
    [CommandsBridge],
    [QueryProvider],
    [ThemeProvider],
    [ToastProvider],
    [CommandPaletteProvider],
    [NyanCatProvider],
]);

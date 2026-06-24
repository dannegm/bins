import '@/services/i18n';
import '@/css/index.css';

import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';
import { createProviders } from '@/helpers/providers';
import { MaintenanceProvider } from './maintenance-provider';
import { HeadlessGuard } from './headless-guard';
import { QueryProvider } from './query-provider';
import { BusProvider } from './bus-provider';
import { IdentityProvider } from './identity-provider';
import { ThemeProvider } from './theme-provider';
import { ForgottenProvider } from './forgotten-provider';
import { EditorEventsProvider } from './editor-events-provider';
import { useExternalCommands } from '@/hooks/use-external-commands';
import { useGlobalCommands } from '@/hooks/use-global-commands';
import { useKeybindingCommands } from '@/hooks/use-keybinding-commands';
import { CommandPaletteProvider } from '@/providers/command-palette-provider';
import { ToastProvider } from '@/providers/toast-provider';
import { NudgeProvider } from '@/providers/nudge-provider';
import { NyanCatProvider } from '@/components/system/nyan-cat';
import { DeviceProvider } from '@/providers/device-provider';
import { GlobalDropzoneProvider } from '@/providers/global-dropzone-provider';
import { PackagesProvider } from '@/providers/packages-provider';

const MAINTENANCE_MODE = false;

const CommandsBridge = ({ children }) => {
    useExternalCommands();
    useGlobalCommands();
    useKeybindingCommands();
    return children;
};

export const Providers = createProviders([
    [MaintenanceProvider, { enabled: MAINTENANCE_MODE }],
    [HeadlessGuard],
    [DeviceProvider],
    [ThemeProvider],
    [BusProvider],
    [NuqsAdapter],
    [ForgottenProvider],
    [IdentityProvider],
    [EditorEventsProvider],
    [NudgeProvider],
    [CommandsBridge],
    [QueryProvider],
    [ToastProvider],
    [GlobalDropzoneProvider],
    [CommandPaletteProvider],
    [PackagesProvider],
    [NyanCatProvider],
]);

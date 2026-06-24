import '@/services/i18n';
import '@/css/index.css';

import { NuqsAdapter } from 'nuqs/adapters/tanstack-router';
import { createProviders } from '@/helpers/providers';
import { MaintenanceProvider } from './maintenance-provider';
import { DeviceProvider } from './device-provider';
import { BusProvider } from './bus-provider';
import { EmbedThemeProvider } from './embed-theme-provider';
import { QueryProvider } from './query-provider';
import { NyanCatProvider } from '@/components/system/nyan-cat';

const MAINTENANCE_MODE = false;

export const EmbedProviders = createProviders([
    [MaintenanceProvider, { enabled: MAINTENANCE_MODE }],
    [DeviceProvider],
    [BusProvider],
    [NuqsAdapter],
    [EmbedThemeProvider],
    [QueryProvider],
    [NyanCatProvider],
]);

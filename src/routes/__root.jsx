import { createRootRoute, Outlet, useRouterState } from '@tanstack/react-router';
import { Providers } from '@/providers/providers';
import { EmbedProviders } from '@/providers/embed-providers';

const ROUTE_PROVIDERS = {
    '/embed': EmbedProviders,
};

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
    const pathname = useRouterState({ select: s => s.location.pathname });
    const match = Object.keys(ROUTE_PROVIDERS).find(prefix => pathname.startsWith(prefix));
    const ActiveProviders = match ? ROUTE_PROVIDERS[match] : Providers;
    return <ActiveProviders><Outlet /></ActiveProviders>;
}

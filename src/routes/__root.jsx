import { useMemo } from 'react';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Providers } from '@/providers/providers';
import { EmbedProviders } from '@/providers/embed-providers';

const ROUTE_PROVIDERS = {
    '/embed': EmbedProviders,
};

export const Route = createRootRoute({ component: RootLayout });

function RootLayout() {
    const ActiveProviders = useMemo(() => {
        const { pathname } = window.location;
        const match = Object.keys(ROUTE_PROVIDERS).find(prefix => pathname.startsWith(prefix));
        return match ? ROUTE_PROVIDERS[match] : Providers;
    }, []);

    return <ActiveProviders><Outlet /></ActiveProviders>;
}

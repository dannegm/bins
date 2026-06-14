import { createRootRoute, Outlet } from '@tanstack/react-router';
import { BusProvider } from '@/providers/bus-provider';
import { ThemeProvider } from '@/providers/theme-provider';

export const Route = createRootRoute({
    component: RootLayout,
});

function RootLayout() {
    return (
        <BusProvider>
            <ThemeProvider>
                <Outlet />
            </ThemeProvider>
        </BusProvider>
    );
}

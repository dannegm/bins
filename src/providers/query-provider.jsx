import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';

focusManager.setEventListener(handleFocus => {
    const onVisibility = () => handleFocus();
    const onFocus = () => handleFocus();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);
    return () => {
        document.removeEventListener('visibilitychange', onVisibility);
        window.removeEventListener('focus', onFocus);
    };
});

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: true,
            staleTime: 0,
        },
    },
});

export const QueryProvider = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

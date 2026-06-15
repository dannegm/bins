import { Toaster } from 'sonner';
import { useMediaQuery } from '@uidotdev/usehooks';
import { useTheme } from '@/providers/theme-provider';

export const ToastProvider = ({ children }) => {
    const { isDark } = useTheme();
    const isMobile = useMediaQuery('(max-width: 639px)');
    return (
        <>
            <Toaster
                position={isMobile ? 'top-center' : 'bottom-right'}
                theme={isDark ? 'dark' : 'light'}
                gap={8}
            />
            {children}
        </>
    );
};

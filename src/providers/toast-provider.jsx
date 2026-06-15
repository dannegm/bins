import { Toaster } from 'sonner';
import { useMediaQuery } from '@uidotdev/usehooks';
import { useTheme } from '@/providers/theme-provider';

const GAP_UNIT = 4;

export const ToastProvider = ({ children }) => {
    const { isDark } = useTheme();
    const isMobile = useMediaQuery('(max-width: 639px)');
    return (
        <>
            <Toaster
                position={isMobile ? 'top-center' : 'bottom-right'}
                theme={isDark ? 'dark' : 'light'}
                gap={GAP_UNIT * 2}
                offset={isMobile ? GAP_UNIT * 4 : { bottom: GAP_UNIT * 14, right: GAP_UNIT * 4 }}
            />
            {children}
        </>
    );
};

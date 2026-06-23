import { cn } from '@/helpers/utils';
import { Sidebar } from './sidebar';

export const Layout = ({ children, noScroll = false }) => (
    <>
        <div className={cn('flex h-full bg-background')}>
            <Sidebar />
            <main
                className={cn(
                    'sm:ml-14 sm:min-h-screen flex-1 pb-12 sm:pb-0 short:pb-0 ios:safari:pb-10',
                    noScroll ? 'overflow-hidden' : 'overflow-y-auto',
                )}
            >
                {children}
            </main>
        </div>
    </>
);

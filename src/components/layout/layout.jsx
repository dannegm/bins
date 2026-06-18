import { cn } from '@/helpers/utils';
import { Sidebar } from './sidebar';

export const Layout = ({ children }) => (
    <>
        <div className={cn('flex h-full bg-background')}>
            <Sidebar />
            <main className='sm:ml-14 sm:min-h-screen flex-1 overflow-y-auto pb-12 sm:pb-0 short:pb-0 ios:safari:pb-10'>{children}</main>
        </div>
    </>
);

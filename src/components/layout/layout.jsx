import { cn } from '@/helpers/utils';
import { Sidebar } from './sidebar';

export const Layout = ({ children }) => (
    <>
        <div className={cn('flex h-full bg-background')}>
            <Sidebar />
            <main className='flex-1 overflow-y-auto pb-10 sm:pb-0 short:pb-0'>{children}</main>
        </div>
    </>
);

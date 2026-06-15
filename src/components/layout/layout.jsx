import { Sidebar } from './sidebar';

export const Layout = ({ children }) => (
    <div className='flex h-screen bg-background'>
        <Sidebar />
        <main className='flex-1 overflow-y-auto pb-14 sm:pb-0 short:pb-0'>{children}</main>
    </div>
);

import { Sidebar } from './sidebar';

export const Layout = ({ children }) => (
    <div className='flex h-screen bg-background'>
        <Sidebar />
        <main className='flex-1 overflow-y-auto pb-2'>
            {children}
        </main>
    </div>
);

import { Link } from '@tanstack/react-router';
import { Home, Plus, Settings, ShieldCheck } from 'lucide-react';
import { cn } from '@/helpers/utils';
import { useAdmin } from '@/hooks/use-admin';

const NavItem = ({ to, icon: Icon, label }) => (
    <Link
        to={to}
        className={cn(
            'flex size-10 items-center justify-center rounded-lg text-zinc-500',
            'transition-colors hover:bg-white/10 hover:text-white/70',
            '[&.active]:bg-white/10 [&.active]:text-white/90',
        )}
        title={label}
    >
        <div className='[&>svg]:size-5'>
            <Icon />
        </div>
    </Link>
);

export const Sidebar = () => {
    const { isAdmin } = useAdmin();

    return (
    <aside className='flex h-screen w-14 shrink-0 flex-col items-center gap-2 border-r border-white/5 bg-zinc-950 py-3'>
        <Link to='/' className='mb-4 grid size-9 p-2 grid-cols-2 grid-rows-2 gap-0 overflow-hidden squircle-xl bg-indigo-500' title='Home'>
            {['B', 'I', 'N', 'S'].map(l => (
                <span key={l} className='flex items-center justify-center font-mono text-[11px] font-bold leading-none text-white'>
                    {l}
                </span>
            ))}
        </Link>

        <NavItem to='/' icon={Home} label='Home' />
        <NavItem to='/new' icon={Plus} label='New bin' />

        <div className='mt-auto flex flex-col items-center gap-1'>
            {isAdmin && (
                <NavItem to='/admin/bins' icon={ShieldCheck} label='Admin' />
            )}
            <NavItem to='/settings' icon={Settings} label='Settings' />
        </div>
    </aside>
    );
};

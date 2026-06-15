import { Link } from '@tanstack/react-router';
import { Home, Plus, Settings, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/button';
import { useAdmin } from '@/hooks/use-admin';
import { AppIcon } from './app-icon';

const NavItem = ({ to, icon: Icon, label }) => (
    <Button
        render={<Link to={to} />}
        nativeButton={false}
        variant='ghost'
        size='icon'
        className='text-sidebar-foreground/50 [&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground'
        title={label}
    >
        <Icon />
    </Button>
);

const Separator = () => (
    <div className='hidden sm:block border-t border-foreground/5 my-2 w-full' />
);
const Spacer = () => <div className='hidden sm:flex flex-1' />;

export const Sidebar = () => {
    const { t } = useTranslation();
    const { isAdmin } = useAdmin();

    return (
        <aside className='fixed bottom-0 left-0 right-0 z-40 flex h-14 flex-row items-center justify-evenly border-t border-sidebar-border bg-sidebar px-2 sm:relative sm:h-screen sm:w-14 sm:flex-col sm:justify-start sm:gap-2 sm:border-r sm:border-t-0 sm:px-0 sm:py-4 short:hidden sm:short:flex'>
            <AppIcon className='hidden sm:grid' />
            <AppIcon className='grid sm:hidden absolute left-4' />
            <div className='block sm:hidden w-8'></div>

            <Separator />

            <NavItem to='/' icon={Home} label={t('sidebar.home')} />
            <NavItem to='/new' icon={Plus} label={t('sidebar.new_bin')} />

            <Separator />
            <Spacer />
            <Separator />

            {isAdmin && <NavItem to='/admin/bins' icon={ShieldCheck} label={t('sidebar.admin')} />}
            <NavItem to='/settings' icon={Settings} label={t('sidebar.settings')} />
        </aside>
    );
};

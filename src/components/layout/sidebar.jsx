import { Link } from '@tanstack/react-router';
import { Home, Plus, Settings, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/button';
import { useAdmin } from '@/hooks/use-admin';
import { useIdentity } from '@/hooks/use-identity';
import { UserAvatar } from '@/components/system/user-avatar';
import { AppIcon } from './app-icon';
import { cn } from '@/helpers/utils';

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

const ProfileButton = ({ uuid, label }) => (
    <Button
        render={<Link to={`/user/${uuid}`} />}
        nativeButton={false}
        variant='ghost'
        size='icon'
        className='text-sidebar-foreground/50 [&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground'
        title={label}
    >
        <UserAvatar profileId={uuid} className='size-5' />
    </Button>
);

export const Sidebar = () => {
    const { t } = useTranslation();
    const { isAdmin } = useAdmin();
    const { user } = useIdentity();

    return (
        <aside
            className={cn(
                'fixed bottom-0 left-0 right-0 z-40 flex h-12 px-2',
                'flex-row items-center justify-evenly',
                'border-t border-sidebar-border bg-sidebar',

                'sm:h-screen sm:w-14 sm:flex-col sm:px-0 sm:py-4 sm:justify-start sm:gap-2',
                'sm:border-r sm:border-t-0',
                'short:hidden sm:short:flex',
                'ios:safari:h-10 ios:safari:pb-0 ios:safari:pt-2'
            )}
        >
            <AppIcon />

            <Separator />

            <NavItem to='/' icon={Home} label={t('sidebar.home')} />
            <NavItem to='/new' icon={Plus} label={t('sidebar.new_bin')} />

            <Separator />
            <Spacer />
            <Separator />

            {isAdmin && <NavItem to='/admin/users' icon={ShieldCheck} label={t('sidebar.admin')} />}
            <NavItem to='/settings' icon={Settings} label={t('sidebar.settings')} />
            {user?.uuid && <ProfileButton uuid={user.uuid} label={t('sidebar.profile')} />}
        </aside>
    );
};

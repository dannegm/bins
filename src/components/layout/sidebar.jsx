import { Link } from '@tanstack/react-router';
import { Home, Plus, Settings, ShieldCheck, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/ui/button';
import { useAdmin } from '@/hooks/use-admin';
import { useIdentity } from '@/hooks/use-identity';
import { usePackagesPanel } from '@/providers/packages-provider';
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

const ProfileButton = ({ user, label }) => (
    <Button
        render={<Link to={`/user/${user.uuid}`} />}
        nativeButton={false}
        variant='ghost'
        size='icon'
        className='text-sidebar-foreground/50 [&.active]:bg-sidebar-accent [&.active]:text-sidebar-accent-foreground'
        title={label}
    >
        <UserAvatar profile={user} className='size-5' />
    </Button>
);

export const Sidebar = () => {
    const { t } = useTranslation();
    const { isAdmin } = useAdmin();
    const { user } = useIdentity();
    const { isJsFile, setPackagesOpen } = usePackagesPanel();

    return (
        <aside
            className={cn(
                'fixed bottom-0 left-0 right-0 flex h-12 px-2',
                'flex-row items-center justify-evenly',
                'border-t border-sidebar-border bg-sidebar',

                'sm:h-screen sm:w-14 sm:flex-col sm:px-0 sm:py-4 sm:justify-start sm:gap-2',
                'sm:border-r sm:border-t-0',
                'short:hidden sm:short:flex',
                'ios:safari:h-10 ios:safari:pb-0 ios:safari:pt-2',
            )}
        >
            <AppIcon />

            <Separator />

            <NavItem to='/' icon={Home} label={t('sidebar.home')} />
            <NavItem to='/new' icon={Plus} label={t('sidebar.new_bin')} />

            {isJsFile && (
                <>
                    <Separator />
                    <Button
                        variant='ghost'
                        size='icon'
                        className='text-sidebar-foreground/50 hover:text-sidebar-accent-foreground hover:bg-sidebar-accent'
                        title={t('sidebar.packages')}
                        onClick={() => setPackagesOpen(true)}
                    >
                        <Package />
                    </Button>
                </>
            )}

            <Separator />
            <Spacer />
            <Separator />

            {isAdmin && <NavItem to='/admin/users' icon={ShieldCheck} label={t('sidebar.admin')} />}
            <NavItem to='/settings' icon={Settings} label={t('sidebar.settings')} />
            {user?.uuid && <ProfileButton user={user} label={t('sidebar.profile')} />}
        </aside>
    );
};

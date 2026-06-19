import { useEffect } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { ShieldCheck, LayoutGrid, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAdmin } from '@/hooks/use-admin';
import { Layout } from '@/components/layout/layout';
import { Footer } from '@/components/layout/footer';

const NavTab = ({ to, icon: Icon, label }) => (
    <Link
        to={to}
        activeOptions={{ exact: true }}
        activeProps={{ className: 'bg-surface-raised text-foreground' }}
        inactiveProps={{ className: 'text-muted-foreground' }}
        className='flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-surface-raised hover:text-foreground'
    >
        <Icon className='size-4' />
        {label}
    </Link>
);

export const AdminLayout = ({ children }) => {
    const { t } = useTranslation();
    const { isAdmin } = useAdmin();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin) navigate({ to: '/' });
    }, [isAdmin, navigate]);

    if (!isAdmin) return null;

    return (
        <Layout>
            <div className='flex h-dvh flex-col'>
                <div className='shrink-0 border-b border-border px-6 py-5 sm:px-8'>
                    <div className='flex items-center gap-2'>
                        <ShieldCheck className='size-4 text-brand' />
                        <span className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                            {t('admin.title')}
                        </span>
                    </div>
                    <div className='mt-3 flex gap-1'>
                        <NavTab to='/admin/users' icon={Users} label={t('admin.nav.users')} />
                        <NavTab to='/admin/bins' icon={LayoutGrid} label={t('admin.nav.bins')} />
                    </div>
                </div>
                <div className='flex flex-1 flex-col overflow-y-auto'>
                    <div className='flex-1 p-6 sm:p-8'>{children}</div>
                    <Footer />
                </div>
            </div>
        </Layout>
    );
};

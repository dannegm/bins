import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Plus, Code2, GitFork, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { supabase } from '@/services/supabase';
import { useIdentity } from '@/hooks/use-identity';
import { Button } from '@/ui/button';
import { Skeleton } from '@/ui/skeleton';
import {
    Empty,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
    EmptyDescription,
    EmptyContent,
} from '@/ui/empty';
import { BinCard } from '@/components/bins/bin-card';

const useMyBins = uuid =>
    useQuery({
        queryKey: ['bins', uuid],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('bins')
                .select('*, bin_files(language)')
                .eq('author_id', uuid)
                .order('updated_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!uuid,
    });

const MyBinsLayout = ({ t, children }) => (
    <div className='flex flex-col gap-4'>
        <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
            {t('home.my_bins.title')}
        </h2>
        {children}
    </div>
);

const MyBinsLoading = ({ t }) => (
    <MyBinsLayout t={t}>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-24 rounded-xl' />
            ))}
        </div>
    </MyBinsLayout>
);

const MyBinsEmpty = ({ t }) => (
    <MyBinsLayout t={t}>
        <Empty className='border py-16'>
            <EmptyHeader>
                <EmptyMedia>
                    <div className='flex items-end gap-2'>
                        {[Code2, GitFork, Globe, Sparkles].map((Icon, i) => (
                            <div
                                key={i}
                                className={cn(
                                    'flex items-center justify-center size-10 rounded-xl bg-surface text-muted-foreground [&>svg]:size-5',
                                    { 'size-14 text-brand': i === 1 },
                                )}
                            >
                                <Icon />
                            </div>
                        ))}
                    </div>
                </EmptyMedia>
                <EmptyTitle>{t('home.my_bins.empty_title')}</EmptyTitle>
                <EmptyDescription>{t('home.my_bins.empty_description')}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
                <Button render={<Link to='/new' />} nativeButton={false}>
                    <Plus data-icon='inline-start' />
                    {t('home.my_bins.empty_cta')}
                </Button>
            </EmptyContent>
        </Empty>
    </MyBinsLayout>
);

export const MyBins = () => {
    const { t } = useTranslation();
    const { user } = useIdentity();
    const { data: bins = [], isLoading } = useMyBins(user?.uuid);

    if (isLoading) return <MyBinsLoading t={t} />;
    if (bins.length === 0) return <MyBinsEmpty t={t} />;

    return (
        <MyBinsLayout t={t}>
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                {bins.map(bin => (
                    <BinCard key={bin.id} bin={bin} />
                ))}
            </div>
        </MyBinsLayout>
    );
};

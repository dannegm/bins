import { Code2, GitFork, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { Skeleton } from '@/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/ui/empty';
import { BinCard } from '@/components/bins/bin-card';

const ProfileBinsLoading = () => (
    <div className='flex flex-col gap-4'>
        <Skeleton className='h-4 w-10 rounded-full' />
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className='h-24 rounded-xl' />
            ))}
        </div>
    </div>
);

const ProfileBinsEmpty = ({ t }) => (
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
            <EmptyTitle>{t('profile.bins.empty_title')}</EmptyTitle>
            <EmptyDescription>{t('profile.bins.empty_description')}</EmptyDescription>
        </EmptyHeader>
    </Empty>
);

export const ProfileBins = ({ bins, isLoading }) => {
    const { t } = useTranslation();

    if (isLoading) return <ProfileBinsLoading />;

    return (
        <div className='flex flex-col gap-4'>
            <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                {t('profile.bins.title')}
            </h2>
            {bins.length === 0 ? (
                <ProfileBinsEmpty t={t} />
            ) : (
                <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                    {bins.map(bin => (
                        <BinCard key={bin.id} bin={bin} />
                    ))}
                </div>
            )}
        </div>
    );
};

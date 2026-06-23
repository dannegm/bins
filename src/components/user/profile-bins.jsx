import { Code2, GitFork, Globe, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { Skeleton } from '@/ui/skeleton';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/ui/empty';
import { BinCard, BinList, ViewToggle } from '@/components/bins/bin-card';

const ProfileBinsLoading = ({ view }) => (
    <div className='flex flex-col gap-4'>
        <Skeleton className='h-4 w-10 rounded-full' />
        {view === 'grid' ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-24 rounded-xl' />
                ))}
            </div>
        ) : (
            <div className='overflow-hidden rounded-xl border border-border'>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className='h-11 rounded-none border-b border-border last:border-0'
                    />
                ))}
            </div>
        )}
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

export const ProfileBins = ({ bins, isLoading, view, onViewChange }) => {
    const { t } = useTranslation();

    if (isLoading) return <ProfileBinsLoading view={view} />;

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                        {t('profile.bins.title')}
                    </h2>
                    <span className='rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground'>
                        {bins.length}
                    </span>
                </div>
                <ViewToggle view={view} onChange={onViewChange} />
            </div>
            {bins.length === 0 ? (
                <ProfileBinsEmpty t={t} />
            ) : view === 'grid' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                    {bins.map(bin => (
                        <BinCard key={bin.id} bin={bin} />
                    ))}
                </div>
            ) : (
                <BinList bins={bins} />
            )}
        </div>
    );
};

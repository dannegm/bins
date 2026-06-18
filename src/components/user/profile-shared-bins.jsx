import { useTranslation } from 'react-i18next';
import { BinCard, BinList, ViewToggle } from '@/components/bins/bin-card';

export const ProfileSharedBins = ({ bins, view, onViewChange }) => {
    const { t } = useTranslation();

    if (!bins.length) return null;

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                        {t('profile.shared_with_me.title')}
                    </h2>
                    <span className='rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground'>
                        {bins.length}
                    </span>
                </div>
                <ViewToggle view={view} onChange={onViewChange} />
            </div>
            {view === 'grid' ? (
                <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
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

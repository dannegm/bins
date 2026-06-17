import { useTranslation } from 'react-i18next';
import { BinCard, BinRow, ViewToggle } from '@/components/bins/bin-card';

export const ProfileSharedBins = ({ bins, view, onViewChange }) => {
    const { t } = useTranslation();

    if (!bins.length) return null;

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
                <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                    {t('profile.shared_with_me.title')}
                </h2>
                <ViewToggle view={view} onChange={onViewChange} />
            </div>
            {view === 'grid' ? (
                <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                    {bins.map(bin => (
                        <BinCard key={bin.id} bin={bin} />
                    ))}
                </div>
            ) : (
                <div className='flex flex-col overflow-hidden rounded-xl border border-border'>
                    {bins.map(bin => (
                        <BinRow key={bin.id} bin={bin} />
                    ))}
                </div>
            )}
        </div>
    );
};

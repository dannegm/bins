import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/services/supabase';
import { useIdentity } from '@/hooks/use-identity';
import { BinCard, BinList, ViewToggle } from '@/components/bins/bin-card';

const useSharedBins = uuid =>
    useQuery({
        queryKey: ['shared-bins', uuid],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('bin_collaborators')
                .select('bin:bins(*, bin_files(language))')
                .eq('user_id', uuid)
                .neq('bins.author_id', uuid)
                .order('joined_at', { ascending: false });
            if (error) throw error;
            return data?.map(r => r.bin).filter(Boolean) ?? [];
        },
        enabled: !!uuid,
    });

export const SharedBins = ({ view, onViewChange }) => {
    const { t } = useTranslation();
    const { user } = useIdentity();
    const { data: bins = [] } = useSharedBins(user?.uuid);

    if (!bins.length) return null;

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                        {t('home.shared_bins.title')}
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
                        <BinCard key={bin.id} bin={bin} canUnlink />
                    ))}
                </div>
            ) : (
                <BinList bins={bins} canUnlink />
            )}
        </div>
    );
};

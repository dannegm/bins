import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/services/supabase';
import { useIdentity } from '@/hooks/use-identity';
import { BinCard } from '@/components/bins/bin-card';

const useSharedBins = uuid =>
    useQuery({
        queryKey: ['shared-bins', uuid],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('bin_collaborators')
                .select('bin:bins(*)')
                .eq('user_id', uuid)
                .neq('bins.author_id', uuid)
                .order('joined_at', { ascending: false });
            if (error) throw error;
            return data?.map(r => r.bin).filter(Boolean) ?? [];
        },
        enabled: !!uuid,
    });

export const SharedBins = () => {
    const { t } = useTranslation();
    const { user } = useIdentity();
    const { data: bins = [] } = useSharedBins(user?.uuid);

    if (!bins.length) return null;

    return (
        <div className='flex flex-col gap-4'>
            <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                {t('home.shared_bins.title')}
            </h2>
            <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                {bins.map(bin => (
                    <BinCard key={bin.id} bin={bin} />
                ))}
            </div>
        </div>
    );
};

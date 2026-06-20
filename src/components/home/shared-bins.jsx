import { useQuery } from '@tanstack/react-query';
import { useQueryState, parseAsInteger } from 'nuqs';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { useIdentity } from '@/hooks/use-identity';
import { BinCard, BinList, ViewToggle } from '@/components/bins/bin-card';

const PER_PAGE = 12;

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

const applySearch = (bins, search) => {
    const q = search.toLowerCase().trim();
    if (!q) return bins;
    return bins.filter(
        b =>
            (b.title ?? '').toLowerCase().includes(q) ||
            b.bin_files?.some(f => (f.language ?? '').toLowerCase().includes(q)),
    );
};

const Pagination = ({ page, totalPages, onPage }) => {
    if (totalPages <= 1) return null;
    return (
        <div className='flex items-center justify-center gap-2 pt-2'>
            <button
                disabled={page <= 1}
                onClick={() => onPage(page - 1)}
                className='flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-40'
            >
                <ChevronLeft className='size-3.5' />
            </button>
            <span className='text-xs tabular-nums text-muted-foreground'>
                {page} / {totalPages}
            </span>
            <button
                disabled={page >= totalPages}
                onClick={() => onPage(page + 1)}
                className='flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:pointer-events-none disabled:opacity-40'
            >
                <ChevronRight className='size-3.5' />
            </button>
        </div>
    );
};

export const SharedBins = ({ view, onViewChange, search = '' }) => {
    const { t } = useTranslation();
    const { user } = useIdentity();
    const [page, setPage] = useQueryState('sh_page', parseAsInteger.withDefault(1));
    const { data: bins = [] } = useSharedBins(user?.uuid);

    if (!bins.length) return null;

    const filtered = applySearch(bins, search);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                    <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                        {t('home.shared_bins.title')}
                    </h2>
                    <span className='rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground'>
                        {filtered.length}
                    </span>
                </div>
                <ViewToggle view={view} onChange={onViewChange} />
            </div>
            {view === 'grid' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                    {paginated.map(bin => (
                        <BinCard key={bin.id} bin={bin} canUnlink />
                    ))}
                </div>
            ) : (
                <BinList bins={paginated} canUnlink />
            )}
            <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </div>
    );
};

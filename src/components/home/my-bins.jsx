import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useQueryState, parseAsInteger } from 'nuqs';
import { Plus, Code2, GitFork, Globe, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { VISIBILITY } from '@/constants/visibility';
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
import { BinCard, BinList, ViewToggle } from '@/components/bins/bin-card';

const PER_PAGE = 12;

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

const applyFilter = (bins, filter) => {
    if (filter === 'public') return bins.filter(b => b.visibility === VISIBILITY.PUBLIC);
    if (filter === 'private') return bins.filter(b => b.visibility !== VISIBILITY.PUBLIC);
    return bins;
};

const applySearch = (bins, search) => {
    const q = search.toLowerCase().trim();
    if (!q) return bins;
    return bins.filter(
        b =>
            (b.title ?? '').toLowerCase().includes(q) ||
            b.bin_files?.some(f => (f.language ?? '').toLowerCase().includes(q)),
    );
};

const VisibilityFilter = ({ filter, onChange, t }) => {
    const options = [
        { value: 'all', label: t('home.my_bins.filter_all') },
        { value: 'public', label: t('home.my_bins.filter_public') },
        { value: 'private', label: t('home.my_bins.filter_private') },
    ];

    return (
        <div className='flex items-center gap-0.5'>
            {options.map(opt => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        'rounded px-1.5 py-0.5 text-xs transition-colors',
                        {
                            'bg-surface text-foreground': filter === opt.value,
                            'text-muted-foreground hover:text-foreground': filter !== opt.value,
                        },
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
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

const MyBinsLayout = ({ t, view, onViewChange, filter, onFilterChange, count, children }) => (
    <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
                <h2 className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                    {t('home.my_bins.title')}
                </h2>
                {count !== undefined && (
                    <span className='rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground'>
                        {count}
                    </span>
                )}
            </div>
            <div className='flex items-center gap-2'>
                <VisibilityFilter filter={filter} onChange={onFilterChange} t={t} />
                <ViewToggle view={view} onChange={onViewChange} />
            </div>
        </div>
        {children}
    </div>
);

const MyBinsLoading = ({ t, view, onViewChange, filter, onFilterChange }) => (
    <MyBinsLayout t={t} view={view} onViewChange={onViewChange} filter={filter} onFilterChange={onFilterChange}>
        {view === 'grid' ? (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-24 rounded-xl' />
                ))}
            </div>
        ) : (
            <div className='overflow-hidden rounded-xl border border-border'>
                {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className='h-11 rounded-none border-b border-border last:border-0' />
                ))}
            </div>
        )}
    </MyBinsLayout>
);

const MyBinsEmpty = ({ t, view, onViewChange, filter, onFilterChange }) => (
    <MyBinsLayout t={t} view={view} onViewChange={onViewChange} filter={filter} onFilterChange={onFilterChange}>
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

export const MyBins = ({ view, onViewChange, search = '' }) => {
    const { t } = useTranslation();
    const { user } = useIdentity();
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useQueryState('my_page', parseAsInteger.withDefault(1));
    const { data: bins = [], isLoading } = useMyBins(user?.uuid);

    const handleFilterChange = val => {
        setFilter(val);
        setPage(1);
    };

    if (isLoading) return <MyBinsLoading t={t} view={view} onViewChange={onViewChange} filter={filter} onFilterChange={handleFilterChange} />;
    if (bins.length === 0) return <MyBinsEmpty t={t} view={view} onViewChange={onViewChange} filter={filter} onFilterChange={handleFilterChange} />;

    const filtered = applySearch(applyFilter(bins, filter), search);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

    return (
        <MyBinsLayout t={t} view={view} onViewChange={onViewChange} filter={filter} onFilterChange={handleFilterChange} count={filtered.length}>
            {view === 'grid' ? (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                    {paginated.map(bin => (
                        <BinCard key={bin.id} bin={bin} />
                    ))}
                </div>
            ) : (
                <BinList bins={paginated} />
            )}
            <Pagination page={safePage} totalPages={totalPages} onPage={setPage} />
        </MyBinsLayout>
    );
};

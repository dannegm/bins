import { useState } from 'react';
import { Link as RouterLink } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/system/toast';
import { useQueryState, parseAsStringLiteral, parseAsInteger } from 'nuqs';
import {
    Braces,
    Eye,
    EyeOff,
    File,
    Globe,
    Link as LinkIcon,
    Lock,
    LockOpen,
    Search,
    ExternalLink,
    Trash2,
    Share2,
    RefreshCw,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { deleteBin } from '@/services/bins';
import { VISIBILITY } from '@/constants/visibility';
import { getLanguage } from '@/constants/languages';
import { getAvatarUrl } from '@/helpers/avatar';
import { useTheme } from '@/providers/theme-provider';
import { LangDot } from '@/components/bins/lang-dot';
import { cn } from '@/helpers/utils';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Badge } from '@/ui/badge';
import { Skeleton } from '@/ui/skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/ui/table';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/ui/tooltip';
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverTrigger,
} from '@/ui/popover';

const dateFnsLocales = { en: enUS, es };

const SORT_KEYS = ['updated_at', 'title', 'author', 'views', 'status', 'files', 'languages'];
const FILTER_KEYS = ['all', 'empty'];
const PER_PAGE_OPTIONS = [10, 25, 50];

const isBinEmpty = bin => !bin.bin_files?.length || bin.bin_files.every(f => !f.content?.trim());

const useAdminBinsStats = () =>
    useQuery({
        queryKey: ['admin-bins-stats'],
        queryFn: async () => {
            const [
                { count: total },
                { count: readonly },
                { count: totalFiles },
                { data: viewData },
            ] = await Promise.all([
                supabase().from('bins').select('*', { count: 'exact', head: true }),
                supabase()
                    .from('bins')
                    .select('*', { count: 'exact', head: true })
                    .eq('is_readonly', true),
                supabase().from('bin_files').select('*', { count: 'exact', head: true }),
                supabase().from('bins').select('views'),
            ]);
            const totalViews = (viewData ?? []).reduce((sum, b) => sum + (b.views ?? 0), 0);
            return {
                total: total ?? 0,
                readonly: readonly ?? 0,
                totalFiles: totalFiles ?? 0,
                totalViews,
            };
        },
    });

const useAdminBins = ({ page, perPage, sortBy, sortDir, search }) =>
    useQuery({
        queryKey: ['admin-bins', page, perPage, sortBy, sortDir, search],
        queryFn: async () => {
            let query = supabase()
                .from('bins')
                .select(
                    '*, profiles(uuid, name, color_light, color_dark), bin_files(language, content)',
                    { count: 'exact' },
                );

            const q = search.trim();
            if (q) query = query.or(`title.ilike.%${q}%,id.ilike.%${q}%`);

            const ascending = sortDir === 'asc';
            if (sortBy === 'title') query = query.order('title', { ascending, nullsFirst: false });
            else if (sortBy === 'author')
                query = query.order('name', { ascending, referencedTable: 'profiles' });
            else if (sortBy === 'views') query = query.order('views', { ascending });
            else if (sortBy === 'status') query = query.order('is_readonly', { ascending });
            else query = query.order('updated_at', { ascending });

            const from = (page - 1) * perPage;
            query = query.range(from, from + perPage - 1);

            const { data, error, count } = await query;
            if (error) throw error;
            return { rows: data ?? [], total: count ?? 0 };
        },
    });

const EmptyBadge = ({ t }) => (
    <span className='inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-destructive/10 text-destructive'>
        {t('admin.bins.badge_empty')}
    </span>
);

const LangStack = ({ files }) => {
    const seen = new Set();
    const unique = (files ?? [])
        .map(f => getLanguage(f.language))
        .filter(l => {
            if (seen.has(l.id)) return false;
            seen.add(l.id);
            return true;
        });

    if (!unique.length) return <span className='text-muted-foreground'>—</span>;

    const visible = unique.slice(0, 3);
    const extra = unique.length - 3;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className='flex w-fit items-center -space-x-1.5 cursor-default'>
                        {visible.map(lang => (
                            <LangDot key={lang.id} lang={lang} />
                        ))}
                        {extra > 0 && (
                            <span className='flex size-5 shrink-0 items-center justify-center rounded-full border border-background bg-surface text-[9px] font-medium text-muted-foreground'>
                                +{extra}
                            </span>
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <ul className='flex flex-col gap-0.5'>
                        {unique.map(lang => (
                            <li key={lang.id} className='text-xs'>
                                {lang.label}
                            </li>
                        ))}
                    </ul>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const AuthorCell = ({ profiles, t }) => {
    const { isDark } = useTheme();

    if (!profiles) {
        return <span className='text-xs text-muted-foreground'>{t('admin.bins.no_author')}</span>;
    }

    const color = isDark ? profiles.color_dark : profiles.color_light;
    const seed = profiles.name + profiles.uuid;

    return (
        <RouterLink
            to='/user/$uuid'
            params={{ uuid: profiles.uuid }}
            className='flex items-center gap-2 transition-opacity hover:opacity-80'
        >
            <div
                className='size-5 shrink-0 overflow-hidden rounded-full bg-(--author-color)'
                style={{ '--author-color': color }}
            >
                <img src={getAvatarUrl(seed)} alt={profiles.name} className='size-full' />
            </div>
            <span className='max-w-28 truncate text-xs text-foreground'>
                {profiles.name || t('admin.bins.anonymous')}
            </span>
        </RouterLink>
    );
};

const VISIBILITY_ICON_MAP = {
    [VISIBILITY.PUBLIC]: Globe,
    [VISIBILITY.UNLISTED]: LinkIcon,
    [VISIBILITY.PRIVATE]: EyeOff,
};

const VisibilityBadge = ({ visibility, t }) => {
    const v = visibility ?? VISIBILITY.PUBLIC;
    const Icon = VISIBILITY_ICON_MAP[v] ?? Globe;

    return (
        <Badge
            className={cn({
                'border-success/40 bg-success/10 text-success': v === VISIBILITY.PUBLIC,
                'border-warning/40 bg-warning/10 text-warning': v === VISIBILITY.UNLISTED,
                'border-border bg-surface text-muted-foreground': v === VISIBILITY.PRIVATE,
            })}
        >
            <Icon className='size-2.5' />
            {t(`bins.card.visibility_${v}`)}
        </Badge>
    );
};

const DeleteAction = ({ bin, t }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: () => deleteBin(bin.id),
        onSuccess: () => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-bins'] });
            queryClient.invalidateQueries({ queryKey: ['admin-bins-stats'] });
        },
    });

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                className='flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive'
                title={t('admin.bins.delete')}
            >
                <Trash2 className='size-3.5' />
            </PopoverTrigger>
            <PopoverContent side='left' align='start' className='w-60'>
                <PopoverHeader>
                    <PopoverTitle>{t('bins.card.delete_title')}</PopoverTitle>
                    <PopoverDescription>{t('bins.card.delete_description')}</PopoverDescription>
                </PopoverHeader>
                <div className='flex gap-2 pt-1'>
                    <Button
                        variant='outline'
                        size='sm'
                        className='flex-1'
                        onClick={() => setOpen(false)}
                    >
                        {t('bins.card.delete_cancel')}
                    </Button>
                    <Button
                        variant='destructive'
                        size='sm'
                        className='flex-1'
                        disabled={isPending}
                        onClick={() => mutate()}
                    >
                        {t('bins.card.delete_confirm')}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const BinsTableSkeleton = ({ rows = 5 }) =>
    Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i} className='hover:bg-transparent'>
            <TableCell>
                <div className='flex flex-col gap-1.5'>
                    <Skeleton className='h-3.5 w-40' />
                    <Skeleton className='h-2.5 w-24' />
                </div>
            </TableCell>
            <TableCell>
                <div className='flex items-center gap-2'>
                    <Skeleton className='size-5 rounded-full' />
                    <Skeleton className='h-3 w-20' />
                </div>
            </TableCell>
            <TableCell>
                <div className='flex items-center gap-0.5'>
                    <Skeleton className='size-5 rounded-full' />
                    <Skeleton className='size-5 rounded-full' />
                </div>
            </TableCell>
            <TableCell className='text-right'>
                <Skeleton className='ml-auto h-3 w-8' />
            </TableCell>
            <TableCell className='text-right'>
                <Skeleton className='ml-auto h-3 w-8' />
            </TableCell>
            <TableCell>
                <Skeleton className='h-5 w-16 rounded-full' />
            </TableCell>
            <TableCell>
                <Skeleton className='h-5 w-16 rounded-full' />
            </TableCell>
            <TableCell>
                <Skeleton className='h-3 w-24' />
            </TableCell>
            <TableCell className='text-right'>
                <div className='flex items-center justify-end gap-1'>
                    <Skeleton className='size-5 rounded' />
                    <Skeleton className='size-5 rounded' />
                    <Skeleton className='size-5 rounded' />
                </div>
            </TableCell>
        </TableRow>
    ));

const BinRow = ({ bin, t, formatDate }) => {
    const copyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/editor/${bin.id}`);
        toast.success(t('admin.bins.copy_link_success'));
    };

    return (
        <TableRow>
            <TableCell>
                <div className='flex min-w-0 flex-col gap-0.5'>
                    <RouterLink
                        to='/editor/$binId'
                        params={{ binId: bin.id }}
                        target='_blank'
                        className='block max-w-52 truncate text-sm font-medium text-foreground transition-colors hover:text-brand'
                    >
                        {bin.title || t('bins.card.untitled')}
                    </RouterLink>
                    <span className='font-mono text-[10px] text-muted-foreground'>{bin.id}</span>
                </div>
            </TableCell>

            <TableCell>
                <AuthorCell profiles={bin.profiles} t={t} />
            </TableCell>

            <TableCell>
                <LangStack files={bin.bin_files} />
            </TableCell>

            <TableCell className='text-right'>
                <div className='flex items-center justify-end gap-2'>
                    {isBinEmpty(bin) && <EmptyBadge t={t} />}
                    <span className='flex items-center gap-1 text-xs text-muted-foreground [&>svg]:size-3'>
                        <File />
                        {bin.bin_files?.length ?? 0}
                    </span>
                </div>
            </TableCell>

            <TableCell className='text-right'>
                <span className='flex items-center justify-end gap-1 text-xs text-muted-foreground [&>svg]:size-3'>
                    <Eye />
                    {bin.views ?? 0}
                </span>
            </TableCell>

            <TableCell>
                <Badge
                    variant={bin.is_readonly ? 'brand' : 'success'}
                    style={
                        bin.is_readonly
                            ? {
                                  '--ro-border-light': '#6366f150',
                                  '--ro-bg-light': '#6366f115',
                                  '--ro-text-light': '#4338ca',
                                  '--ro-border-dark': '#818cf850',
                                  '--ro-bg-dark': '#818cf815',
                                  '--ro-text-dark': '#a5b4fc',
                              }
                            : undefined
                    }
                >
                    {bin.is_readonly ? (
                        <Lock className='size-2.5' />
                    ) : (
                        <LockOpen className='size-2.5' />
                    )}
                    {bin.is_readonly ? t('bins.card.readonly') : t('bins.card.editable')}
                </Badge>
            </TableCell>

            <TableCell>
                <VisibilityBadge visibility={bin.visibility} t={t} />
            </TableCell>

            <TableCell>
                <span className='whitespace-nowrap text-xs text-muted-foreground'>
                    {formatDate(bin.updated_at)}
                </span>
            </TableCell>

            <TableCell className='text-right'>
                <div className='flex items-center justify-end gap-0.5'>
                    <RouterLink
                        to='/editor/$binId'
                        params={{ binId: bin.id }}
                        target='_blank'
                        title={t('admin.bins.view')}
                    >
                        <button className='flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground'>
                            <ExternalLink className='size-3.5' />
                        </button>
                    </RouterLink>
                    <button
                        className='flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground'
                        title={t('admin.bins.copy_link')}
                        onClick={copyLink}
                    >
                        <Share2 className='size-3.5' />
                    </button>
                    <DeleteAction bin={bin} t={t} />
                </div>
            </TableCell>
        </TableRow>
    );
};

const SortableHead = ({ column, label, sortBy, sortDir, onSort, className, align = 'start' }) => {
    const isActive = sortBy === column;
    const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

    return (
        <TableHead className={className}>
            <button
                onClick={() => onSort(column)}
                className={cn(
                    'flex items-center gap-1 cursor-pointer transition-colors hover:text-foreground',
                    {
                        'text-foreground': isActive,
                        'text-muted-foreground': !isActive,
                        'w-full justify-end': align === 'end',
                    },
                )}
            >
                {label}
                <Icon className='size-3' />
            </button>
        </TableHead>
    );
};

const StatsBar = ({ stats, t }) => {
    const item = (value, label, Icon) => (
        <div className='flex items-center gap-4 rounded-xl border border-border bg-card p-4'>
            <div className='flex shrink-0 items-center justify-center rounded-xl bg-foreground/5 p-2'>
                <Icon className='size-10 text-muted-foreground' strokeWidth={1} />
            </div>
            <div className='flex flex-col gap-0.5'>
                <span className='text-2xl font-semibold tabular-nums text-foreground'>
                    {(value ?? 0).toLocaleString()}
                </span>
                <span className='text-xs text-muted-foreground'>{label}</span>
            </div>
        </div>
    );

    return (
        <div className='mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {item(stats?.total, t('admin.stats.total_bins'), Braces)}
            {item(stats?.totalViews, t('admin.stats.total_views'), Eye)}
            {item(stats?.totalFiles, t('admin.stats.total_files'), File)}
            {item(stats?.readonly, t('admin.stats.readonly_bins'), Lock)}
        </div>
    );
};

const getPageNumbers = (page, totalPages) => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '…', totalPages];
    if (page >= totalPages - 3)
        return [1, '…', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '…', page - 1, page, page + 1, '…', totalPages];
};

const PageNumbers = ({ page, totalPages, onPage }) => {
    if (totalPages <= 1) return null;
    const pages = getPageNumbers(page, totalPages);

    return (
        <div className='flex items-center gap-0.5'>
            <button
                disabled={page <= 1}
                onClick={() => onPage(page - 1)}
                className='flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40'
            >
                <ChevronLeft className='size-3.5' />
            </button>
            {pages.map((p, i) =>
                p === '…' ? (
                    <span
                        key={`ellipsis-${i}`}
                        className='flex size-7 items-center justify-center text-xs text-muted-foreground'
                    >
                        …
                    </span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onPage(p)}
                        className={cn(
                            'flex size-7 items-center justify-center rounded text-xs font-medium transition-colors',
                            {
                                'bg-brand text-white': p === page,
                                'text-muted-foreground hover:bg-surface hover:text-foreground':
                                    p !== page,
                            },
                        )}
                    >
                        {p}
                    </button>
                ),
            )}
            <button
                disabled={page >= totalPages}
                onClick={() => onPage(page + 1)}
                className='flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40'
            >
                <ChevronRight className='size-3.5' />
            </button>
        </div>
    );
};

const PerPageSelector = ({ perPage, onPerPage, t }) => (
    <div className='flex h-7 items-center gap-2'>
        <span className='text-xs text-muted-foreground'>{t('admin.users.per_page')}</span>
        <div className='flex items-center gap-0.5'>
            {PER_PAGE_OPTIONS.map(n => (
                <button
                    key={n}
                    onClick={() => onPerPage(n)}
                    className={cn('h-5 rounded px-2 text-xs font-medium transition-colors', {
                        'bg-brand text-white': perPage === n,
                        'text-muted-foreground hover:text-foreground': perPage !== n,
                    })}
                >
                    {n}
                </button>
            ))}
        </div>
    </div>
);

export const BinsTable = () => {
    const { t, i18n } = useTranslation();
    const locale = dateFnsLocales[i18n.language] ?? enUS;
    const formatDate = iso => format(new Date(iso), t('formats.date.short_time'), { locale });

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useQueryState(
        'filter',
        parseAsStringLiteral(FILTER_KEYS).withDefault('all'),
    );
    const [sortBy, setSortBy] = useQueryState(
        'sort',
        parseAsStringLiteral(SORT_KEYS).withDefault('updated_at'),
    );
    const [sortDir, setSortDir] = useQueryState(
        'dir',
        parseAsStringLiteral(['asc', 'desc']).withDefault('desc'),
    );
    const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
    const [perPage, setPerPage] = useQueryState('per_page', parseAsInteger.withDefault(25));

    const queryClient = useQueryClient();

    const { data: stats, isFetching: isFetchingStats } = useAdminBinsStats();
    const {
        data: { rows: allRows = [], total = 0 } = {},
        isLoading,
        isFetching,
    } = useAdminBins({ page, perPage, sortBy, sortDir, search });

    const rows = filter === 'empty' ? allRows.filter(isBinEmpty) : allRows;

    const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ['admin-bins'] });
        queryClient.invalidateQueries({ queryKey: ['admin-bins-stats'] });
    };

    const totalPages = Math.ceil(total / perPage);

    const handleSort = col => {
        if (col === sortBy) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
        else {
            setSortBy(col);
            setSortDir('desc');
        }
        setPage(1);
    };
    const handleFilter = val => {
        setFilter(val);
        setPage(1);
    };
    const handleSearch = val => {
        setSearch(val);
        setPage(1);
    };
    const handlePerPage = val => {
        setPerPage(val);
        setPage(1);
    };

    return (
        <div>
            <StatsBar stats={stats} t={t} />

            <div className='mb-4 flex items-center gap-3'>
                <button
                    onClick={handleRefresh}
                    disabled={isFetching || isFetchingStats}
                    title={t('admin.refresh')}
                    className='flex size-7 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:size-3.5'
                >
                    <RefreshCw className={isFetching || isFetchingStats ? 'animate-spin' : ''} />
                </button>
                <div className='relative max-w-sm flex-1'>
                    <Search className='pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder={t('admin.bins.search_placeholder')}
                        className='h-7 pl-8'
                    />
                </div>

                <div className='flex h-7 items-center gap-0.5 rounded-lg border border-border bg-surface px-1'>
                    {FILTER_KEYS.map(key => (
                        <button
                            key={key}
                            onClick={() => handleFilter(key)}
                            className={cn(
                                'h-5 rounded px-3 text-xs font-medium transition-colors',
                                {
                                    'bg-brand text-white': filter === key,
                                    'text-muted-foreground hover:text-foreground': filter !== key,
                                },
                            )}
                        >
                            {t(`admin.bins.filter_${key}`)}
                        </button>
                    ))}
                </div>

                <span className='whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-muted-foreground'>
                    {t('admin.count_chip', { shown: rows.length, total })}
                </span>
                <div className='ml-auto'>
                    <PerPageSelector perPage={perPage} onPerPage={handlePerPage} t={t} />
                </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-border'>
                <Table>
                    <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                            <SortableHead
                                column='title'
                                label={t('admin.bins.col_bin')}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                onSort={handleSort}
                            />
                            <SortableHead
                                column='author'
                                label={t('admin.bins.col_author')}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                onSort={handleSort}
                            />
                            <SortableHead
                                column='languages'
                                label={t('admin.bins.col_languages')}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                onSort={handleSort}
                            />
                            <SortableHead
                                column='files'
                                label={t('admin.bins.col_files')}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                onSort={handleSort}
                                align='end'
                            />
                            <SortableHead
                                column='views'
                                label={t('admin.bins.col_views')}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                onSort={handleSort}
                                align='end'
                            />
                            <SortableHead
                                column='status'
                                label={t('admin.bins.col_status')}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                onSort={handleSort}
                            />
                            <TableHead className='text-xs text-muted-foreground'>
                                {t('admin.bins.col_visibility')}
                            </TableHead>
                            <SortableHead
                                column='updated_at'
                                label={t('admin.bins.col_updated')}
                                sortBy={sortBy}
                                sortDir={sortDir}
                                onSort={handleSort}
                            />
                            <TableHead className='text-right'>
                                {t('admin.bins.col_actions')}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className={cn({ 'opacity-50 transition-opacity': isFetching && !isLoading })}>
                        {isLoading && <BinsTableSkeleton />}
                        {!isLoading && rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className='h-32 text-center text-muted-foreground'
                                >
                                    {t('admin.bins.empty')}
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map(bin => (
                            <BinRow key={bin.id} bin={bin} t={t} formatDate={formatDate} />
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className='flex items-center justify-between pt-4'>
                <div>
                    <PageNumbers page={page} totalPages={totalPages} onPage={setPage} />
                </div>
                <PerPageSelector perPage={perPage} onPerPage={handlePerPage} t={t} />
            </div>
        </div>
    );
};

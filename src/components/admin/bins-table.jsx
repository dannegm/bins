import { useState, useMemo } from 'react';
import { Link as RouterLink } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
    Eye,
    File,
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
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { deleteBin } from '@/services/bins';
import { getLanguage } from '@/constants/languages';
import { getAvatarUrl } from '@/helpers/avatar';
import { useTheme } from '@/providers/theme-provider';
import { LangDot } from '@/components/bins/lang-dot';
import { cn } from '@/helpers/utils';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';
import { Badge } from '@/ui/badge';
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

const useAdminBins = () =>
    useQuery({
        queryKey: ['admin-bins'],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('bins')
                .select('*, profiles(uuid, name, color_light, color_dark), bin_files(language)')
                .order('updated_at', { ascending: false })
                .limit(500);
            if (error) throw error;
            return data ?? [];
        },
        refetchOnWindowFocus: false,
    });

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

const DeleteAction = ({ bin, t }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: () => deleteBin(bin.id),
        onSuccess: () => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-bins'] });
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
                <span className='flex items-center justify-end gap-1 text-xs text-muted-foreground [&>svg]:size-3'>
                    <File />
                    {bin.bin_files?.length ?? 0}
                </span>
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

const StatsBar = ({ bins, t }) => {
    const totalViews = bins.reduce((sum, b) => sum + (b.views ?? 0), 0);
    const totalFiles = bins.reduce((sum, b) => sum + (b.bin_files?.length ?? 0), 0);
    const readonlyCount = bins.filter(b => b.is_readonly).length;

    const item = (value, label) => (
        <div className='flex flex-col gap-0.5 rounded-xl border border-border bg-card p-4'>
            <span className='text-2xl font-semibold tabular-nums text-foreground'>
                {value.toLocaleString()}
            </span>
            <span className='text-xs text-muted-foreground'>{label}</span>
        </div>
    );

    return (
        <div className='mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {item(bins.length, t('admin.stats.total_bins'))}
            {item(totalViews, t('admin.stats.total_views'))}
            {item(totalFiles, t('admin.stats.total_files'))}
            {item(readonlyCount, t('admin.stats.readonly_bins'))}
        </div>
    );
};

const getSortValue = (bin, key) => {
    if (key === 'title') return (bin.title ?? '').toLowerCase();
    if (key === 'author') return (bin.profiles?.name ?? '').toLowerCase();
    if (key === 'languages') {
        const seen = new Set();
        return (bin.bin_files ?? []).filter(f => {
            const id = getLanguage(f.language).id;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        }).length;
    }
    if (key === 'files') return bin.bin_files?.length ?? 0;
    if (key === 'views') return bin.views ?? 0;
    if (key === 'status') return bin.is_readonly ? 1 : 0;
    if (key === 'updated_at') return bin.updated_at ?? '';
    return '';
};

export const BinsTable = () => {
    const { t, i18n } = useTranslation();
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortDir, setSortDir] = useState('desc');
    const { data: bins = [], isLoading, isFetching, refetch } = useAdminBins();
    const locale = dateFnsLocales[i18n.language] ?? enUS;
    const formatDate = iso => format(new Date(iso), t('formats.date.short_time'), { locale });

    const handleSort = col => {
        if (col === sortBy) setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
        else { setSortBy(col); setSortDir('desc'); }
    };

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        let result = q
            ? bins.filter(
                  b =>
                      b.title?.toLowerCase().includes(q) ||
                      b.id.toLowerCase().includes(q) ||
                      b.profiles?.name?.toLowerCase().includes(q),
              )
            : [...bins];

        result.sort((a, b) => {
            const av = getSortValue(a, sortBy);
            const bv = getSortValue(b, sortBy);
            const cmp = av < bv ? -1 : av > bv ? 1 : 0;
            return sortDir === 'asc' ? cmp : -cmp;
        });

        return result;
    }, [bins, search, sortBy, sortDir]);

    return (
        <div>
            <StatsBar bins={bins} t={t} />

            <div className='mb-4 flex items-center gap-3'>
                <button
                    onClick={() => refetch()}
                    disabled={isFetching}
                    title={t('admin.refresh')}
                    className='flex size-7 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 [&>svg]:size-3.5'
                >
                    <RefreshCw className={isFetching ? 'animate-spin' : ''} />
                </button>
                <div className='relative max-w-sm flex-1'>
                    <Search className='pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('admin.bins.search_placeholder')}
                        className='pl-8'
                    />
                </div>
                <span className='whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-muted-foreground'>
                    {t('admin.count_chip', { shown: filtered.length, total: bins.length })}
                </span>
            </div>

            <div className='overflow-hidden rounded-xl border border-border'>
                <Table>
                    <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                            <SortableHead column='title' label={t('admin.bins.col_bin')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                            <SortableHead column='author' label={t('admin.bins.col_author')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                            <SortableHead column='languages' label={t('admin.bins.col_languages')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                            <SortableHead column='files' label={t('admin.bins.col_files')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} align='end' />
                            <SortableHead column='views' label={t('admin.bins.col_views')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} align='end' />
                            <SortableHead column='status' label={t('admin.bins.col_status')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                            <SortableHead column='updated_at' label={t('admin.bins.col_updated')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                            <TableHead className='text-right'>
                                {t('admin.bins.col_actions')}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className='h-32 text-center text-muted-foreground'
                                >
                                    {t('admin.loading')}
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && filtered.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={8}
                                    className='h-32 text-center text-muted-foreground'
                                >
                                    {t('admin.bins.empty')}
                                </TableCell>
                            </TableRow>
                        )}
                        {filtered.map(bin => (
                            <BinRow key={bin.id} bin={bin} t={t} formatDate={formatDate} />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

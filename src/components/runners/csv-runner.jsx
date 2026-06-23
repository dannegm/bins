import { useState, useMemo } from 'react';
import Papa from 'papaparse';
import Fuse from 'fuse.js';
import { ArrowUp, ArrowDown, ArrowUpDown, Search, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { NumberScrubber } from '@/ui/number-scrubber';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/ui/tooltip';

const parseCsv = raw => {
    const { data } = Papa.parse(raw.trim(), { skipEmptyLines: true });
    return data;
};

const EmptyState = () => (
    <div className='flex h-full items-center justify-center text-xs text-muted-foreground'>
        No data
    </div>
);

const NoResults = ({ colCount }) => (
    <tr>
        <td colSpan={colCount} className='px-3 py-6 text-center text-xs text-muted-foreground'>
            No results
        </td>
    </tr>
);

const SortIcon = ({ col, sort }) => {
    if (sort?.col !== col) return <ArrowUpDown className='size-3 shrink-0 opacity-25' />;
    return sort.dir === 'asc' ? (
        <ArrowUp className='size-3 shrink-0' />
    ) : (
        <ArrowDown className='size-3 shrink-0' />
    );
};

const CsvTable = ({ headers, body }) => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState(null);
    const [threshold, setThreshold] = useState(30);

    const objects = useMemo(
        () => body.map(row => Object.fromEntries(headers.map((_, i) => [String(i), row[i] ?? '']))),
        [body, headers],
    );

    const fuse = useMemo(
        () =>
            new Fuse(objects, {
                keys: headers.map((_, i) => String(i)),
                threshold: threshold / 100,
            }),
        [objects, headers, threshold],
    );

    const filtered = useMemo(
        () => (query.trim() ? fuse.search(query).map(r => r.item) : objects),
        [query, fuse, objects],
    );

    const sorted = useMemo(() => {
        if (!sort) return filtered;
        return [...filtered].sort((a, b) => {
            const av = a[sort.col] ?? '';
            const bv = b[sort.col] ?? '';
            const na = parseFloat(av);
            const nb = parseFloat(bv);
            const cmp = !isNaN(na) && !isNaN(nb) ? na - nb : av.localeCompare(bv);
            return sort.dir === 'asc' ? cmp : -cmp;
        });
    }, [filtered, sort]);

    const handleSort = col => {
        setSort(prev => {
            if (!prev || prev.col !== col) return { col, dir: 'asc' };
            if (prev.dir === 'asc') return { col, dir: 'desc' };
            return null;
        });
    };

    return (
        <div className='flex h-full flex-col'>
            <div className='shrink-0 border-b border-border px-3 py-2'>
                <div className='flex items-center gap-2'>
                    <div className='relative flex min-w-0 flex-1 items-center'>
                        <Search className='absolute left-2 size-3 text-muted-foreground' />
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder='Filter…'
                            className='w-full rounded bg-surface-raised py-1.5 pl-7 pr-6 text-xs text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-brand'
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className='absolute right-2 text-muted-foreground transition-colors hover:text-foreground'
                            >
                                <X className='size-3' />
                            </button>
                        )}
                    </div>
                    <span className='h-4 w-px shrink-0 bg-border' />
                    <div className='flex shrink-0 items-center gap-1.5'>
                        <span className='text-xs text-muted-foreground'>
                            {t('editor.runner_panel.csv.threshold')}
                        </span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger className='flex items-center text-muted-foreground'>
                                    <Info className='size-3' />
                                </TooltipTrigger>
                                <TooltipContent side='bottom' align='end'>
                                    {t('editor.runner_panel.csv.threshold_desc')}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <NumberScrubber
                            value={threshold}
                            onChange={setThreshold}
                            min={0}
                            max={100}
                            step={1}
                            scrubSensitivity={0.5}
                            className='w-20 rounded border-0 bg-surface-raised py-1.5 text-center text-xs text-foreground outline-none focus-visible:ring-1 focus-visible:ring-brand'
                        />
                    </div>
                </div>
            </div>
            <div className='min-h-0 flex-1 overflow-auto'>
                <table className='w-full border-collapse text-xs'>
                    <thead className='sticky top-0 z-10 bg-surface'>
                        <tr>
                            {headers.map((h, i) => (
                                <th
                                    key={i}
                                    onClick={() => handleSort(i)}
                                    className='cursor-pointer select-none border-b border-r border-border px-3 py-2 text-left font-medium text-muted-foreground last:border-r-0 hover:bg-surface-raised hover:text-foreground'
                                >
                                    <div className='flex items-center gap-1.5'>
                                        <span
                                            className={cn({ 'text-foreground': sort?.col === i })}
                                        >
                                            {h}
                                        </span>
                                        <SortIcon col={i} sort={sort} />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sorted.length === 0 ? (
                            <NoResults colCount={headers.length} />
                        ) : (
                            sorted.map((row, ri) => (
                                <tr
                                    key={ri}
                                    className='border-b border-border last:border-b-0 hover:bg-surface'
                                >
                                    {headers.map((_, ci) => (
                                        <td
                                            key={ci}
                                            className='border-r border-border px-3 py-1.5 text-foreground last:border-r-0'
                                        >
                                            {row[String(ci)]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const CsvRunner = ({ content }) => {
    const rows = useMemo(() => parseCsv(content ?? ''), [content]);
    if (rows.length === 0) return <EmptyState />;
    const [headers, ...body] = rows;
    return <CsvTable headers={headers} body={body} />;
};

import { useState } from 'react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQueryState, parseAsInteger } from 'nuqs';
import { TIPS } from '@/constants/tips';
import { RichText } from '@/components/system/tips-carousel';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/helpers/utils';
import { Input } from '@/ui/input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/ui/table';

const PER_PAGE_OPTIONS = [10, 25];
const LANG_OPTIONS = ['en', 'es'];

const NEUTRAL_STYLE = {
    '--tip-color-light': '#4f46e5',
    '--tip-color-dark': '#818cf8',
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
                        key={`e-${i}`}
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

const TipRow = ({ tip, lang, t, context }) => {
    const title = t(`editor.tips.${tip.id}.title`, { lng: lang });
    const body = t(`editor.tips.${tip.id}.body`, { lng: lang });

    return (
        <TableRow style={NEUTRAL_STYLE}>
            <TableCell>
                <div className='flex size-7 items-center justify-center rounded-lg bg-surface text-muted-foreground [&>svg]:size-3.5'>
                    <DynamicIcon name={tip.icon} />
                </div>
            </TableCell>
            <TableCell>
                <span className='font-mono text-xs text-muted-foreground'>{tip.id}</span>
            </TableCell>
            <TableCell className='whitespace-nowrap'>
                <RichText
                    text={title}
                    className='text-sm font-medium text-foreground'
                    context={context}
                />
            </TableCell>
            <TableCell>
                <RichText text={body} className='text-sm text-muted-foreground' context={context} />
            </TableCell>
        </TableRow>
    );
};

export const TipsTable = () => {
    const { t } = useTranslation();
    const [appKeybindings] = useSettings('appKeybindings');
    const context = { appKeybindings };

    const [search, setSearch] = useState('');
    const [lang, setLang] = useState('en');
    const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
    const [perPage, setPerPage] = useQueryState('per_page', parseAsInteger.withDefault(10));

    const filtered = TIPS.filter(tip => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        const title = t(`editor.tips.${tip.id}.title`, { lng: lang }).toLowerCase();
        const body = t(`editor.tips.${tip.id}.body`, { lng: lang }).toLowerCase();
        return tip.id.includes(q) || title.includes(q) || body.includes(q);
    });

    const totalPages = Math.ceil(filtered.length / perPage);
    const from = (page - 1) * perPage;
    const rows = filtered.slice(from, from + perPage);

    const handleSearch = val => {
        setSearch(val);
        setPage(1);
    };
    const handlePerPage = val => {
        setPerPage(val);
        setPage(1);
    };
    const handleLang = l => {
        setLang(l);
        setPage(1);
    };

    return (
        <div>
            <div className='mb-4 flex flex-wrap items-center gap-3'>
                <div className='relative max-w-sm flex-1'>
                    <Search className='pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        placeholder={t('admin.tips.search_placeholder')}
                        className='h-7 pl-8'
                    />
                </div>

                <div className='flex h-7 items-center gap-0.5 rounded-lg border border-border bg-surface px-1'>
                    {LANG_OPTIONS.map(l => (
                        <button
                            key={l}
                            onClick={() => handleLang(l)}
                            className={cn(
                                'h-5 rounded px-3 text-xs font-medium uppercase transition-colors',
                                {
                                    'bg-brand text-white': lang === l,
                                    'text-muted-foreground hover:text-foreground': lang !== l,
                                },
                            )}
                        >
                            {l}
                        </button>
                    ))}
                </div>

                <span className='whitespace-nowrap rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-muted-foreground'>
                    {t('admin.count_chip', { shown: rows.length, total: filtered.length })}
                </span>
                <div className='ml-auto'>
                    <PerPageSelector perPage={perPage} onPerPage={handlePerPage} t={t} />
                </div>
            </div>

            <div className='overflow-hidden rounded-xl border border-border'>
                <Table>
                    <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                            <TableHead className='w-12'>{t('admin.tips.col_icon')}</TableHead>
                            <TableHead>{t('admin.tips.col_id')}</TableHead>
                            <TableHead>{t('admin.tips.col_title')}</TableHead>
                            <TableHead>{t('admin.tips.col_body')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className='h-32 text-center text-muted-foreground'
                                >
                                    {t('admin.tips.empty')}
                                </TableCell>
                            </TableRow>
                        )}
                        {rows.map(tip => (
                            <TipRow
                                key={tip.id}
                                tip={tip}
                                lang={lang}
                                t={t}
                                context={context}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className='flex items-center justify-between pt-4'>
                <PageNumbers page={page} totalPages={totalPages} onPage={setPage} />
                <PerPageSelector perPage={perPage} onPerPage={handlePerPage} t={t} />
            </div>
        </div>
    );
};

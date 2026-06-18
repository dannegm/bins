import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Braces,
    Eye,
    EyeOff,
    File,
    GitFork,
    Globe,
    LayoutGrid,
    List,
    Link as LinkIcon,
    Lock,
    LockOpen,
    Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { VISIBILITY } from '@/constants/visibility';
import { getLanguage } from '@/constants/languages';
import { LangDot } from '@/components/bins/lang-dot';
import { useIdentity } from '@/hooks/use-identity';
import { useAdmin } from '@/hooks/use-admin';
import { deleteBin } from '@/services/bins';
import { Button } from '@/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverTrigger,
} from '@/ui/popover';

const dateFnsLocales = { en: enUS, es };

const LanguageStack = ({ files }) => {
    const seen = new Set();
    const unique = files
        .map(f => getLanguage(f.language))
        .filter(l => {
            if (seen.has(l.id)) return false;
            seen.add(l.id);
            return true;
        });

    if (!unique.length) return null;

    const visible = unique.slice(0, 3);
    const extra = unique.length - 3;

    return (
        <div className='flex items-center -space-x-1.5'>
            {visible.map(lang => (
                <LangDot key={lang.id} lang={lang} />
            ))}
            {extra > 0 && (
                <span className='flex size-5 shrink-0 items-center justify-center rounded-full border border-background bg-surface text-[9px] font-medium text-muted-foreground'>
                    +{extra}
                </span>
            )}
        </div>
    );
};

const roStyle = {
    '--ro-border-light': '#6366f150',
    '--ro-bg-light': '#6366f115',
    '--ro-text-light': '#4338ca',
    '--ro-border-dark': '#818cf850',
    '--ro-bg-dark': '#818cf815',
    '--ro-text-dark': '#a5b4fc',
};

const VISIBILITY_ICON_MAP = {
    [VISIBILITY.PUBLIC]: Globe,
    [VISIBILITY.UNLISTED]: LinkIcon,
    [VISIBILITY.PRIVATE]: EyeOff,
};

export const VisibilityBadge = ({ visibility, t }) => {
    const v = visibility ?? VISIBILITY.PUBLIC;
    const Icon = VISIBILITY_ICON_MAP[v] ?? Globe;

    return (
        <span
            className={cn(
                'flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium [&>svg]:size-2.5',
                {
                    'border-success/40 bg-success/10 text-success': v === VISIBILITY.PUBLIC,
                    'border-warning/40 bg-warning/10 text-warning': v === VISIBILITY.UNLISTED,
                    'border-border bg-surface text-muted-foreground': v === VISIBILITY.PRIVATE,
                },
            )}
        >
            <Icon />
            {t(`bins.card.visibility_${v}`)}
        </span>
    );
};

const AccessBadge = ({ bin, t, canDelete }) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    const { mutate: remove, isPending } = useMutation({
        mutationFn: () => deleteBin(bin.id),
        onSuccess: () => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['bins'] });
            queryClient.invalidateQueries({ queryKey: ['profile-bins'] });
        },
    });

    const badgeClass = cn(
        'flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium [&>svg]:size-2.5',
        {
            'border-(--ro-border-light) bg-(--ro-bg-light) text-(--ro-text-light) dark:border-(--ro-border-dark) dark:bg-(--ro-bg-dark) dark:text-(--ro-text-dark)':
                bin.is_readonly,
            'border-success/40 bg-success/10 text-success': !bin.is_readonly,
        },
    );

    const badgeStyle = bin.is_readonly ? roStyle : undefined;

    const badge = (
        <span className={badgeClass} style={badgeStyle}>
            {bin.is_readonly ? <Lock /> : <LockOpen />}
            {bin.is_readonly ? t('bins.card.readonly') : t('bins.card.editable')}
        </span>
    );

    if (!canDelete) {
        return badge;
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <div className='flex items-center gap-1.5 overflow-hidden'>
                {badge}
                <div className='-mr-1.5 w-0 overflow-hidden transition-all duration-200 group-hover/card:mr-0 group-hover/card:w-4'>
                    <PopoverTrigger
                        className='flex size-4 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-destructive'
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <Trash2 className='size-3.5' />
                    </PopoverTrigger>
                </div>
            </div>
            <PopoverContent
                side='bottom'
                align='end'
                className='w-60'
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
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
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            remove();
                        }}
                    >
                        {t('bins.card.delete_confirm')}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export const BinCard = ({ bin }) => {
    const { t, i18n } = useTranslation();
    const { user } = useIdentity();
    const { isAdmin } = useAdmin();
    const locale = dateFnsLocales[i18n.language] ?? enUS;
    const formatDate = iso => format(new Date(iso), t('formats.date.short'), { locale });
    const canDelete = user?.uuid === bin.author_id || isAdmin;
    const visibility = bin.visibility ?? VISIBILITY.PUBLIC;
    const isUnlisted = visibility === VISIBILITY.UNLISTED;
    const isPrivate = visibility === VISIBILITY.PRIVATE;

    return (
        <Link
            to='/editor/$binId'
            params={{ binId: bin.id }}
            className={cn(
                'group/card flex flex-col rounded-xl border border-border bg-card p-4',
                'transition-all hover:border-border/60 hover:bg-surface-raised',
                {
                    'opacity-50 outline-2 outline-dashed outline-offset-2 outline-border hover:opacity-100':
                        isUnlisted,
                },
            )}
        >
            <div
                className={cn('flex w-full flex-col gap-3', {
                    'blur-sm transition-[filter] duration-200 group-hover/card:blur-none':
                        isPrivate,
                })}
            >
                <div className='flex items-center justify-between gap-2'>
                    <span className='truncate text-sm font-medium text-card-foreground'>
                        {bin.title || t('bins.card.untitled')}
                    </span>
                    <AccessBadge bin={bin} t={t} canDelete={canDelete} />
                </div>

                <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                    <LanguageStack files={bin.bin_files ?? []} />
                    <span className='flex items-center gap-1 [&>svg]:size-3'>
                        <Eye />
                        {bin.views}
                    </span>
                    <span className='flex items-center gap-1 [&>svg]:size-3'>
                        <File />
                        {bin.bin_files?.length ?? 0}
                    </span>
                    {bin.forked_from && (
                        <span className='flex items-center gap-1 [&>svg]:size-3'>
                            <GitFork />
                            {t('bins.card.forked')}
                        </span>
                    )}
                    <span className='ml-auto'>{formatDate(bin.updated_at)}</span>
                </div>
            </div>
        </Link>
    );
};

const RowDeleteButton = ({ bin, t }) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    const { mutate: remove, isPending } = useMutation({
        mutationFn: () => deleteBin(bin.id),
        onSuccess: () => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['bins'] });
            queryClient.invalidateQueries({ queryKey: ['profile-bins'] });
        },
    });

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                className='flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive [&>svg]:size-3.5'
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
                <Trash2 />
            </PopoverTrigger>
            <PopoverContent
                side='bottom'
                align='end'
                className='w-60'
                onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                }}
            >
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
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            remove();
                        }}
                    >
                        {t('bins.card.delete_confirm')}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const BinRow = ({ bin }) => {
    const { t, i18n } = useTranslation();
    const { user } = useIdentity();
    const { isAdmin } = useAdmin();
    const navigate = useNavigate();
    const locale = dateFnsLocales[i18n.language] ?? enUS;
    const formatDate = iso => format(new Date(iso), t('formats.date.short'), { locale });
    const canDelete = user?.uuid === bin.author_id || isAdmin;
    const visibility = bin.visibility ?? VISIBILITY.PUBLIC;
    const isPrivate = visibility === VISIBILITY.PRIVATE;
    const isUnlisted = visibility === VISIBILITY.UNLISTED;

    const handleClick = () => navigate({ to: '/editor/$binId', params: { binId: bin.id } });

    return (
        <tr
            onClick={handleClick}
            className={cn(
                'group/card cursor-pointer border-b border-border last:border-0 hover:bg-surface-raised',
                'transition-[background-color,filter,opacity] duration-200',
                {
                    'blur-sm hover:blur-none': isPrivate,
                    'bg-muted/30 opacity-60 hover:opacity-100': isUnlisted,
                },
            )}
        >
            <td className='pl-3 pr-1 py-2.5'>
                <Braces className='size-3.5 text-muted-foreground' />
            </td>
            <td className='w-full max-w-0 px-2 py-2.5'>
                <span className='block truncate text-sm font-medium text-card-foreground'>
                    {bin.title || t('bins.card.untitled')}
                </span>
            </td>
            <td className='hidden whitespace-nowrap px-2 py-2.5 text-xs text-muted-foreground sm:table-cell'>
                {formatDate(bin.updated_at)}
            </td>
            <td className='hidden whitespace-nowrap px-2 py-2.5 text-xs text-muted-foreground sm:table-cell'>
                <span className='flex items-center gap-1 [&>svg]:size-3'>
                    <Eye />
                    {bin.views}
                </span>
            </td>
            <td className='whitespace-nowrap px-2 py-2.5 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1 [&>svg]:size-3'>
                    <File />
                    {bin.bin_files?.length ?? 0}
                </span>
            </td>
            <td className='hidden px-2 py-2.5 sm:table-cell'>
                {bin.forked_from && <GitFork className='size-3 text-muted-foreground' />}
            </td>
            <td className='px-2 py-2.5'>
                <LanguageStack files={bin.bin_files ?? []} />
            </td>
            <td className='whitespace-nowrap px-2 py-2.5'>
                <AccessBadge bin={bin} t={t} canDelete={false} />
            </td>
            <td className='whitespace-nowrap px-2 py-2.5'>
                <VisibilityBadge visibility={bin.visibility} t={t} />
            </td>
            <td className='pr-4 py-2.5'>{canDelete && <RowDeleteButton bin={bin} t={t} />}</td>
        </tr>
    );
};

export const BinList = ({ bins }) => (
    <div className='overflow-hidden rounded-xl border border-border'>
        <table className='w-full border-collapse'>
            <tbody>
                {bins.map(bin => (
                    <BinRow key={bin.id} bin={bin} />
                ))}
            </tbody>
        </table>
    </div>
);

export const ViewToggle = ({ view, onChange }) => (
    <div className='flex items-center gap-0.5'>
        <button
            onClick={() => onChange('grid')}
            className={cn(
                'flex size-6 items-center justify-center rounded transition-colors [&>svg]:size-3.5',
                {
                    'text-foreground': view === 'grid',
                    'text-muted-foreground hover:text-foreground': view !== 'grid',
                },
            )}
        >
            <LayoutGrid />
        </button>
        <button
            onClick={() => onChange('list')}
            className={cn(
                'flex size-6 items-center justify-center rounded transition-colors [&>svg]:size-3.5',
                {
                    'text-foreground': view === 'list',
                    'text-muted-foreground hover:text-foreground': view !== 'list',
                },
            )}
        >
            <List />
        </button>
    </div>
);

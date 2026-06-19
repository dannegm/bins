import { useState, useEffect, useRef } from 'react';
import { zipSync, strToU8 } from 'fflate';
import {
    Lock,
    LockOpen,
    Pencil,
    Share2,
    Check,
    GitFork,
    MoreHorizontal,
    ShieldCheck,
    Download,
    FileDown,
    Globe,
    Link,
    EyeOff,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lighten } from 'polished';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/system/toast';
import { cn } from '@/helpers/utils';
import { VISIBILITY } from '@/constants/visibility';
import { getBin } from '@/services/bins';
import { getProfile } from '@/services/profiles';
import { useTheme } from '@/providers/theme-provider';
import { UserAvatar } from '@/components/system/user-avatar';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/ui/tooltip';
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverTitle,
    PopoverDescription,
} from '@/ui/popover';

const VISIBILITY_OPTIONS = [
    { value: VISIBILITY.PUBLIC, icon: Globe },
    { value: VISIBILITY.UNLISTED, icon: Link },
    { value: VISIBILITY.PRIVATE, icon: EyeOff },
];

const ShareToast = ({ isReadonly, t }) => (
    <div className='flex min-w-64 items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg shadow-black/25'>
        <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-success/15 [&>svg]:size-3.5'>
            <Check className='text-success' />
        </div>
        <div className='flex flex-col'>
            <span className='text-sm font-medium text-foreground'>
                {t('editor.bin_header.share_copied')}
            </span>
            <span className='text-xs text-muted-foreground'>
                {isReadonly
                    ? t('editor.bin_header.share_mode_readonly')
                    : t('editor.bin_header.share_mode_editable')}
            </span>
        </div>
    </div>
);

const AuthorChip = ({ authorId, t, className }) => {
    const { isDark } = useTheme();
    const { data: profile } = useQuery({
        queryKey: ['profile', authorId],
        queryFn: () => getProfile(authorId),
        enabled: !!authorId,
    });

    if (!authorId) return null;

    const color = isDark ? profile?.colorDark : profile?.colorLight;

    return (
        <a
            href={`/user/${authorId}`}
            target='_blank'
            rel='noopener noreferrer'
            className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 transition-colors hover:border-brand hover:bg-surface-raised',
                className,
            )}
        >
            <span className='text-[11px] text-muted-foreground'>
                {t('editor.bin_header.created_by')}
            </span>
            <UserAvatar profileId={authorId} className='size-3.5' />
            {profile?.name && (
                <span
                    className='font-mono text-[12px] text-(--author-color)'
                    style={{ '--author-color': lighten(0.2, color) }}
                >
                    {profile.name}
                </span>
            )}
        </a>
    );
};

const ForkedFromChip = ({ parentId, t }) => {
    const { data: parentBin } = useQuery({
        queryKey: ['bin', parentId],
        queryFn: () => getBin(parentId),
        enabled: !!parentId,
    });

    return (
        <a
            href={`/editor/${parentId}`}
            target='_blank'
            rel='noopener noreferrer'
            className='flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 transition-colors hover:border-brand hover:bg-surface-raised'
        >
            <GitFork className='size-3 text-foreground/60' />
            <span className='font-sans text-[12px] text-foreground/60'>{t('editor.bin_header.forked_from')}</span>
            {parentBin?.title && (
                <span className='max-w-28 truncate font-mono text-[12px] text-foreground/80'>
                    {parentBin.title}
                </span>
            )}
        </a>
    );
};

const VisibilitySelector = ({ bin, isOwner, t, onVisibilityChange, compact = false }) => {
    const [open, setOpen] = useState(false);
    const visibility = bin?.visibility ?? VISIBILITY.PUBLIC;
    const current = VISIBILITY_OPTIONS.find(o => o.value === visibility) ?? VISIBILITY_OPTIONS[0];
    const Icon = current.icon;

    const label = t(`editor.bin_header.visibility_${visibility}`);

    const triggerClass = compact
        ? 'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground [&>svg]:size-3'
        : 'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs text-muted-foreground transition-colors hover:bg-muted [&>svg]:size-3.5';

    if (!isOwner) {
        return (
            <div className={triggerClass}>
                <Icon />
                <span>{label}</span>
            </div>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger className={triggerClass}>
                <Icon />
                <span>{label}</span>
            </PopoverTrigger>
            <PopoverContent side='bottom' align='end' className='w-56 px-1.5 py-1.5'>
                {VISIBILITY_OPTIONS.map(opt => {
                    const OptIcon = opt.icon;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => { onVisibilityChange(opt.value); setOpen(false); }}
                            className={cn(
                                'flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted',
                                { 'bg-muted': opt.value === visibility },
                            )}
                        >
                            <OptIcon className='mt-0.5 size-3.5 shrink-0 text-muted-foreground' />
                            <div className='flex flex-col gap-0.5'>
                                <span className='font-medium text-foreground'>
                                    {t(`editor.bin_header.visibility_${opt.value}`)}
                                </span>
                                <span className='text-muted-foreground'>
                                    {t(`editor.bin_header.visibility_${opt.value}_desc`)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
};

export const BinHeader = ({ bin, activeFile, files = [], isAuthor, isAdmin, isOwner, onTitleChange, onReadonlyToggle, onVisibilityChange, onShare }) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [shareState, setShareState] = useState('idle');
    const [forkOpen, setForkOpen] = useState(false);
    const [downloadOpen, setDownloadOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileForkConfirm, setMobileForkConfirm] = useState(false);
    const $input = useRef(null);

    const visibility = bin?.visibility ?? VISIBILITY.PUBLIC;
    const canFork = visibility === VISIBILITY.PUBLIC;
    const canShare = visibility !== VISIBILITY.PRIVATE;

    const handleDownloadFile = () => {
        if (!activeFile) return;
        setDownloadOpen(false);
        const blob = new Blob([activeFile.content ?? ''], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleMobileDownloadFile = () => {
        setMobileMenuOpen(false);
        handleDownloadFile();
    };

    const handleDownloadZip = () => {
        setDownloadOpen(false);
        const entries = {};
        for (const file of files) {
            entries[file.name] = strToU8(file.content ?? '');
        }
        const zipped = zipSync(entries);
        const blob = new Blob([zipped], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${(bin?.title ?? 'untitled').trim()}.zip`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleMobileDownloadZip = () => {
        setMobileMenuOpen(false);
        handleDownloadZip();
    };

    const startEdit = () => {
        if (!isAuthor) return;
        setDraft(bin?.title ?? '');
        setIsEditing(true);
    };

    useEffect(() => {
        if (isEditing) $input.current?.select();
    }, [isEditing]);

    const commit = () => {
        setIsEditing(false);
        const value = draft.trim() || t('editor.bin_header.untitled');
        if (value !== bin?.title) onTitleChange?.(value);
    };

    const openFork = () => window.open(`/fork/${bin?.id}`, '_blank', 'noopener,noreferrer');

    const handleForkConfirm = () => {
        setForkOpen(false);
        openFork();
    };

    const handleMobileForkConfirm = () => {
        setMobileMenuOpen(false);
        setMobileForkConfirm(false);
        openFork();
    };

    const performShare = async () => {
        await onShare?.();
        setShareState('copied');
        setTimeout(() => setShareState('idle'), 2000);
        toast.custom(() => <ShareToast isReadonly={bin?.is_readonly} t={t} />);
    };

    const handleShare = () => performShare();

    const handleMobileShare = () => {
        setMobileMenuOpen(false);
        performShare();
    };

    const onKeyDown = e => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setIsEditing(false);
    };

    return (
        <div className='flex h-10 shrink-0 items-center gap-2 border-b border-border px-3'>
            {/* Admin override indicator */}
            {isAdmin && bin?.is_readonly && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className='flex shrink-0 items-center text-green-700 dark:text-green-500'>
                            <ShieldCheck className='size-3.5' />
                        </TooltipTrigger>
                        <TooltipContent side='bottom' align='start'>
                            {t('editor.bin_header.admin_override')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            {/* Lock button */}
            <div className='flex'>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger
                            onClick={isAuthor ? onReadonlyToggle : undefined}
                            style={{
                                '--ro-border-light': '#6366f150',
                                '--ro-bg-light': '#6366f115',
                                '--ro-text-light': '#4338ca',
                                '--ro-border-dark': '#818cf850',
                                '--ro-bg-dark': '#818cf815',
                                '--ro-text-dark': '#a5b4fc',
                            }}
                            className={cn(
                                'flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors [&>svg]:size-3',
                                bin?.is_readonly
                                    ? 'border-(--ro-border-light) bg-(--ro-bg-light) text-(--ro-text-light) dark:border-(--ro-border-dark) dark:bg-(--ro-bg-dark) dark:text-(--ro-text-dark)'
                                    : 'border-success/40 bg-success/10 text-success',
                                {
                                    'cursor-pointer hover:border-foreground hover:bg-surface hover:text-foreground':
                                        isAuthor && bin?.is_readonly,
                                    'cursor-pointer hover:border-warning/40 hover:bg-warning/10 hover:text-warning':
                                        isAuthor && !bin?.is_readonly,
                                    'cursor-default': !isAuthor,
                                },
                            )}
                        >
                            {bin?.is_readonly ? <Lock /> : <LockOpen />}
                            {bin?.is_readonly
                                ? t('editor.bin_header.locked_label')
                                : t('editor.bin_header.unlocked_label')}
                        </TooltipTrigger>
                        <TooltipContent side='bottom' align='start'>
                            {isAuthor
                                ? bin?.is_readonly
                                    ? t('editor.bin_header.locked_action')
                                    : t('editor.bin_header.unlocked_action')
                                : bin?.is_readonly
                                  ? t('editor.bin_header.locked_guest')
                                  : t('editor.bin_header.unlocked_guest')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Title */}
            <div className='flex min-w-0 flex-1 items-center gap-1.5'>
                {isEditing ? (
                    <div className='relative min-w-8'>
                        <span className='invisible whitespace-pre text-sm font-medium'>
                            {draft || ' '}
                        </span>
                        <input
                            ref={$input}
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            onBlur={commit}
                            onKeyDown={onKeyDown}
                            className='absolute inset-0 w-full border-b border-brand bg-transparent pb-px text-sm font-medium text-foreground outline-none select-text'
                        />
                    </div>
                ) : (
                    <span
                        onClick={startEdit}
                        className={cn('truncate text-sm font-medium text-foreground select-text', {
                            'cursor-text': isAuthor,
                            'cursor-default': !isAuthor,
                        })}
                    >
                        {bin?.title || t('editor.bin_header.untitled')}
                    </span>
                )}
                {isAuthor && (
                    <button
                        onClick={startEdit}
                        className='shrink-0 text-muted-foreground transition-colors hover:text-foreground'
                    >
                        <Pencil className='size-3' />
                    </button>
                )}
            </div>

            {/* Fork + Download + Share + Author — desktop only */}
            <div className='hidden items-center gap-2 sm:flex'>
                {bin?.forked_from && <ForkedFromChip parentId={bin.forked_from} t={t} />}

                {canFork ? (
                    <Popover open={forkOpen} onOpenChange={setForkOpen}>
                        <PopoverTrigger className='flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'>
                            <GitFork className='size-3' />
                            <span>{t('editor.bin_header.fork')}</span>
                        </PopoverTrigger>
                        <PopoverContent side='bottom' align='end' className='w-64'>
                            <PopoverTitle className='text-sm font-medium text-foreground'>
                                {t('editor.bin_header.fork_title')}
                            </PopoverTitle>
                            <PopoverDescription className='text-pretty text-xs text-muted-foreground'>
                                {t('editor.bin_header.fork_description')}
                            </PopoverDescription>
                            <div className='flex justify-end gap-2 pt-1'>
                                <button
                                    onClick={() => setForkOpen(false)}
                                    className='rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'
                                >
                                    {t('editor.bin_header.fork_cancel')}
                                </button>
                                <button
                                    onClick={handleForkConfirm}
                                    className='flex items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-brand-foreground transition-opacity hover:opacity-90'
                                >
                                    <GitFork className='size-3' />
                                    {t('editor.bin_header.fork_confirm')}
                                </button>
                            </div>
                        </PopoverContent>
                    </Popover>
                ) : (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger className='flex cursor-not-allowed items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground/40'>
                                <GitFork className='size-3' />
                                <span>{t('editor.bin_header.fork')}</span>
                            </TooltipTrigger>
                            <TooltipContent side='bottom' align='end'>
                                {t('editor.bin_header.fork_disabled')}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                <Popover open={downloadOpen} onOpenChange={setDownloadOpen}>
                    <PopoverTrigger className='flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'>
                        <Download className='size-3' />
                        <span>{t('editor.bin_header.download')}</span>
                    </PopoverTrigger>
                    <PopoverContent side='bottom' align='end' className='w-48 px-1.5 py-1.5'>
                        <button
                            onClick={handleDownloadFile}
                            className='flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted'
                        >
                            <FileDown className='size-3.5 shrink-0 text-muted-foreground' />
                            <span className='text-foreground'>{t('editor.bin_header.download_file')}</span>
                        </button>
                        <button
                            onClick={handleDownloadZip}
                            className='flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted'
                        >
                            <Download className='size-3.5 shrink-0 text-muted-foreground' />
                            <span className='text-foreground'>{t('editor.bin_header.download_zip')}</span>
                        </button>
                    </PopoverContent>
                </Popover>

                <VisibilitySelector
                    bin={bin}
                    isOwner={isOwner}
                    t={t}
                    onVisibilityChange={onVisibilityChange}
                    compact
                />

                {canShare ? (
                    <button
                        onClick={handleShare}
                        className='flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'
                    >
                        {shareState === 'copied' ? (
                            <>
                                <Check className='size-3 text-success' />
                                <span className='text-success'>{t('editor.tab_bar.copied')}</span>
                            </>
                        ) : (
                            <>
                                <Share2 className='size-3' />
                                <span>{t('editor.tab_bar.share')}</span>
                            </>
                        )}
                    </button>
                ) : (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger className='flex cursor-not-allowed items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground/40'>
                                <Share2 className='size-3' />
                                <span>{t('editor.tab_bar.share')}</span>
                            </TooltipTrigger>
                            <TooltipContent side='bottom' align='end'>
                                {t('editor.bin_header.share_disabled')}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}

                <span className='h-4 w-px shrink-0 bg-border' />

                <AuthorChip authorId={bin?.author_id} t={t} />
            </div>

            {/* Mobile menu */}
            <div className='sm:hidden'>
                <Popover
                    open={mobileMenuOpen}
                    onOpenChange={o => {
                        setMobileMenuOpen(o);
                        if (!o) setMobileForkConfirm(false);
                    }}
                >
                    <PopoverTrigger className='flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'>
                        <MoreHorizontal className='size-4' />
                    </PopoverTrigger>
                    <PopoverContent side='bottom' align='end' className='w-fit px-1.5 py-3'>
                        {canFork && (
                            mobileForkConfirm ? (
                                <div className='flex flex-col gap-2 rounded-md bg-muted px-2 py-2'>
                                    <p className='text-pretty text-xs text-muted-foreground'>
                                        {t('editor.bin_header.fork_description')}
                                    </p>
                                    <div className='flex justify-end gap-1.5'>
                                        <button
                                            onClick={() => setMobileForkConfirm(false)}
                                            className='rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'
                                        >
                                            {t('editor.bin_header.fork_cancel')}
                                        </button>
                                        <button
                                            onClick={handleMobileForkConfirm}
                                            className='flex items-center gap-1 rounded bg-brand px-2 py-1 text-xs font-medium text-brand-foreground'
                                        >
                                            <GitFork className='size-3' />
                                            {t('editor.bin_header.fork_confirm')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setMobileForkConfirm(true)}
                                    className='flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted'
                                >
                                    <GitFork className='size-3.5 shrink-0 text-muted-foreground' />
                                    <span className='text-foreground'>
                                        {t('editor.bin_header.fork')}
                                    </span>
                                </button>
                            )
                        )}

                        {canShare && (
                            <button
                                onClick={handleMobileShare}
                                className='flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted'
                            >
                                <Share2 className='size-3.5 shrink-0 text-muted-foreground' />
                                <span className='text-foreground'>{t('editor.tab_bar.share')}</span>
                            </button>
                        )}

                        <button
                            onClick={handleMobileDownloadFile}
                            className='flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted'
                        >
                            <FileDown className='size-3.5 shrink-0 text-muted-foreground' />
                            <span className='text-foreground'>{t('editor.bin_header.download_file')}</span>
                        </button>
                        <button
                            onClick={handleMobileDownloadZip}
                            className='flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left text-xs transition-colors hover:bg-muted'
                        >
                            <Download className='size-3.5 shrink-0 text-muted-foreground' />
                            <span className='text-foreground'>{t('editor.bin_header.download_zip')}</span>
                        </button>

                        <div className='h-px bg-border/50' />

                        <div className='px-0.5'>
                            <VisibilitySelector
                                bin={bin}
                                isOwner={isOwner}
                                t={t}
                                onVisibilityChange={onVisibilityChange}
                            />
                        </div>

                        {(bin?.forked_from || bin?.author_id) && (
                            <div className='h-px bg-border/50' />
                        )}
                        {bin?.forked_from && (
                            <div className='px-0.5'>
                                <ForkedFromChip parentId={bin.forked_from} t={t} />
                            </div>
                        )}
                        {bin?.author_id && (
                            <div className='px-0.5'>
                                <AuthorChip
                                    authorId={bin?.author_id}
                                    t={t}
                                    className='w-full border-0'
                                />
                            </div>
                        )}
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    );
};

import { useState, useEffect, useRef } from 'react';
import { Lock, LockOpen, Pencil, Share2, Check, GitFork } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { lighten } from 'polished';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/helpers/utils';
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

const AuthorChip = ({ authorId, t }) => {
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
            className='flex shrink-0 items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 transition-colors hover:border-brand hover:bg-surface-raised'
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

export const BinHeader = ({ bin, isAuthor, onTitleChange, onReadonlyToggle, onShare }) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [shareState, setShareState] = useState('idle');
    const [forkOpen, setForkOpen] = useState(false);
    const $input = useRef(null);

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

    const handleForkConfirm = () => {
        setForkOpen(false);
        window.open(`/fork/${bin?.id}`, '_blank', 'noopener,noreferrer');
    };

    const handleShare = async () => {
        await onShare?.();
        setShareState('copied');
        setTimeout(() => setShareState('idle'), 2000);
        toast.custom(() => <ShareToast isReadonly={bin?.is_readonly} t={t} />);
    };

    const onKeyDown = e => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setIsEditing(false);
    };

    return (
        <div className='flex h-10 shrink-0 items-center gap-2 border-b border-border px-3'>
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
                    <TooltipContent side='bottom'>
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

            <div className='flex min-w-0 items-center gap-1.5'>
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
                            className='absolute inset-0 w-full border-b border-brand bg-transparent pb-px text-sm font-medium text-foreground outline-none'
                        />
                    </div>
                ) : (
                    <span
                        onClick={startEdit}
                        className={cn('truncate text-sm font-medium text-foreground', {
                            'cursor-text': isAuthor,
                            'cursor-default': !isAuthor,
                        })}
                    >
                        {bin?.title || t('editor.bin_header.untitled')}
                    </span>
                )}
                {isAuthor && <Pencil className='size-3 shrink-0 text-muted-foreground' />}
            </div>

            <span className='flex-1' />

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

            <span className='h-4 w-px shrink-0 bg-border' />

            <AuthorChip authorId={bin?.author_id} t={t} />
        </div>
    );
};

import { useState, useEffect, useRef } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/helpers/utils';
import { getProfile } from '@/services/profiles';
import { UserAvatar } from '@/components/system/user-avatar';

const AuthorChip = ({ authorId }) => {
    const { data: profile } = useQuery({
        queryKey: ['profile', authorId],
        queryFn: () => getProfile(authorId),
        enabled: !!authorId,
    });

    if (!authorId) return null;

    return (
        <div className='flex shrink-0 items-center gap-1.5'>
            <UserAvatar profileId={authorId} className='size-5' />
            {profile?.name && <span className='text-xs text-muted-foreground'>{profile.name}</span>}
        </div>
    );
};

export const BinHeader = ({ bin, isAuthor, onTitleChange, onReadonlyToggle }) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState('');
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

    const onKeyDown = e => {
        if (e.key === 'Enter') commit();
        if (e.key === 'Escape') setIsEditing(false);
    };

    return (
        <div className='flex h-10 shrink-0 items-center gap-2 border-b border-border px-3'>
            <button
                onClick={isAuthor ? onReadonlyToggle : undefined}
                className={cn(
                    'flex shrink-0 items-center rounded p-1 transition-colors [&>svg]:size-3.5',
                    {
                        'cursor-pointer text-muted-foreground hover:bg-surface hover:text-foreground': isAuthor,
                        'cursor-default text-muted-foreground': !isAuthor,
                        'text-success': !bin?.is_readonly,
                    },
                )}
                title={
                    bin?.is_readonly
                        ? t('editor.bin_header.locked')
                        : t('editor.bin_header.unlocked')
                }
            >
                {bin?.is_readonly ? <Lock /> : <LockOpen />}
            </button>

            {isEditing ? (
                <input
                    ref={$input}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={onKeyDown}
                    className='min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none'
                />
            ) : (
                <span
                    onClick={startEdit}
                    className={cn(
                        'min-w-0 flex-1 truncate text-sm font-medium text-foreground',
                        { 'cursor-text': isAuthor, 'cursor-default': !isAuthor },
                    )}
                >
                    {bin?.title || t('editor.bin_header.untitled')}
                </span>
            )}

            <AuthorChip authorId={bin?.author_id} />
        </div>
    );
};

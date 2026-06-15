import { useState, useRef } from 'react';
import { Undo2, Redo2, Plus, Trash2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { getLanguage } from '@/constants/languages';
import { useTheme } from '@/providers/theme-provider';

const LangIcon = ({ language, className }) => {
    const lang = getLanguage(language);

    if (lang.icon) {
        return (
            <i
                className={cn(lang.icon, 'colored text-sm leading-none', className)}
                style={{ color: lang.color }}
            />
        );
    }

    return <FileText className={cn('size-3.5 text-muted-foreground', className)} />;
};

const FileTab = ({
    file,
    isActive,
    isReadonly,
    canDelete,
    tabGradient,
    onSelect,
    onRename,
    deleteConfirmId,
    onDeleteConfirm,
}) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(file.name);
    const $input = useRef(null);

    const handleDoubleClick = () => {
        if (isReadonly) return;
        setEditName(file.name);
        setIsEditing(true);
        setTimeout(() => $input.current?.select(), 0);
    };

    const commitRename = () => {
        const trimmed = editName.trim();
        if (trimmed && trimmed !== file.name) onRename(file.id, trimmed);
        setIsEditing(false);
    };

    const handleKeyDown = e => {
        if (e.key === 'Enter') commitRename();
        if (e.key === 'Escape') setIsEditing(false);
    };

    const isConfirming = deleteConfirmId === file.id;

    return (
        <div
            role='tab'
            aria-selected={isActive}
            onClick={() => onSelect(file.id)}
            onDoubleClick={handleDoubleClick}
            className={cn(
                'group relative flex h-full min-w-0 max-w-48 shrink-0 cursor-pointer items-center gap-1.5 border-r border-border px-3 text-sm select-none',
                {
                    'bg-background text-foreground': isActive,
                    'bg-surface text-muted-foreground hover:bg-background/50 hover:text-foreground':
                        !isActive,
                },
            )}
        >
            {tabGradient && (
                <span
                    className='absolute inset-x-0 top-0 h-0.5'
                    style={{ background: tabGradient }}
                />
            )}
            <LangIcon language={file.language} />

            {isEditing ? (
                <input
                    ref={$input}
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={handleKeyDown}
                    onClick={e => e.stopPropagation()}
                    className='min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none'
                />
            ) : (
                <span className='min-w-0 flex-1 truncate'>{file.name}</span>
            )}

            {!isReadonly && (
                <button
                    onClick={e => {
                        e.stopPropagation();
                        if (!canDelete) return;
                        onDeleteConfirm(file.id);
                    }}
                    onDoubleClick={e => e.stopPropagation()}
                    title={
                        isConfirming
                            ? t('editor.tab_bar.confirm_delete')
                            : t('editor.tab_bar.delete_file')
                    }
                    className={cn(
                        'ml-0.5 shrink-0 rounded p-0.5 text-muted-foreground transition-colors',
                        {
                            'text-destructive': isConfirming,
                            'hover:text-foreground': canDelete && !isConfirming,
                            'opacity-35 cursor-default': !canDelete && !isConfirming,
                        },
                    )}
                >
                    <Trash2 className='size-3' />
                </button>
            )}
        </div>
    );
};

const makeGradient = colors => {
    if (colors.length === 0) return null;
    if (colors.length === 1) return colors[0];
    return `linear-gradient(to right, ${colors.join(', ')})`;
};

export const TabBar = ({
    files,
    activeFileId,
    isReadonly,
    peers = {},
    user,
    onTabChange,
    onCreateFile,
    onDeleteFile,
    onRenameFile,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const getTabGradient = fileId => {
        const colors = [];
        if (fileId === activeFileId && user) colors.push(isDark ? user.colorDark : user.colorLight);
        for (const peer of Object.values(peers)) {
            if (peer.activeFileId === fileId)
                colors.push(isDark ? peer.colorDark : peer.colorLight);
        }
        return makeGradient(colors.filter(Boolean));
    };

    const handleDeleteConfirm = fileId => {
        if (deleteConfirmId === fileId) {
            onDeleteFile(fileId);
            setDeleteConfirmId(null);
        } else {
            setDeleteConfirmId(fileId);
            setTimeout(() => setDeleteConfirmId(null), 2500);
        }
    };

    return (
        <div className='flex h-10 shrink-0 items-stretch border-b border-border bg-surface'>
            {!isReadonly && (
                <div className='flex items-center gap-0.5 border-r border-border px-2'>
                    <button
                        onClick={canUndo ? onUndo : undefined}
                        title={t('editor.tab_bar.undo')}
                        className={cn(
                            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
                            {
                                'opacity-30 hover:opacity-60': !canUndo,
                                'hover:bg-surface-raised hover:text-foreground': canUndo,
                            },
                        )}
                    >
                        <Undo2 className='size-3.5' />
                    </button>
                    <button
                        onClick={canRedo ? onRedo : undefined}
                        title={t('editor.tab_bar.redo')}
                        className={cn(
                            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
                            {
                                'opacity-30 hover:opacity-60': !canRedo,
                                'hover:bg-surface-raised hover:text-foreground': canRedo,
                            },
                        )}
                    >
                        <Redo2 className='size-3.5' />
                    </button>
                </div>
            )}

            <div className='flex min-w-0 flex-1 items-stretch overflow-x-auto'>
                {files.map(file => (
                    <FileTab
                        key={file.id}
                        file={file}
                        isActive={file.id === activeFileId}
                        isReadonly={isReadonly}
                        canDelete={files.length > 1}
                        tabGradient={getTabGradient(file.id)}
                        onSelect={onTabChange}
                        onRename={onRenameFile}
                        deleteConfirmId={deleteConfirmId}
                        onDeleteConfirm={handleDeleteConfirm}
                    />
                ))}

                {!isReadonly && (
                    <button
                        onClick={files.length >= 10 ? undefined : onCreateFile}
                        title={t('editor.tab_bar.new_file')}
                        className={cn(
                            'flex size-10 shrink-0 items-center justify-center text-muted-foreground transition-all',
                            {
                                'opacity-30 hover:opacity-60': files.length >= 10,
                                'hover:bg-background/50 hover:text-foreground': files.length < 10,
                            },
                        )}
                    >
                        <Plus className='size-4' />
                    </button>
                )}
            </div>
        </div>
    );
};

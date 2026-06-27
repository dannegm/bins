import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Undo2,
    Redo2,
    Plus,
    Trash2,
    X,
    FileText,
    ChevronLeft,
    ChevronRight,
    Play,
    Wand2,
    Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { getLanguage } from '@/constants/languages';
import { useTheme } from '@/providers/theme-provider';
import { fetchNameSuggestion } from '@/services/ai-completions';
import { useSettings } from '@/hooks/use-settings';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/ui/tooltip';

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
    isDragging,
    dropIndicator,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    aiCompletions,
}) => {
    const { t } = useTranslation();
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(file.name);
    const [isAiLoading, setIsAiLoading] = useState(false);
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

    const handleAiSuggestName = async e => {
        e.stopPropagation();
        if (!aiCompletions?.enabled || isAiLoading) return;
        setIsAiLoading(true);
        try {
            const suggestion = await fetchNameSuggestion({
                provider: aiCompletions.provider,
                model: aiCompletions.model,
                apiKey: aiCompletions.apiKey,
                baseUrl: aiCompletions.baseUrl,
                content: file.content ?? '',
                hint: 'file_name',
            });
            if (suggestion) setEditName(suggestion);
        } finally {
            setIsAiLoading(false);
            $input.current?.focus();
        }
    };

    const isConfirming = deleteConfirmId === file.id;
    const [tooltipOpen, setTooltipOpen] = useState(false);

    useEffect(() => {
        setTooltipOpen(isConfirming);
    }, [isConfirming]);

    return (
        <div
            role='tab'
            aria-selected={isActive}
            draggable={!isReadonly}
            onClick={() => onSelect(file.id)}
            onDoubleClick={handleDoubleClick}
            onDragStart={e => onDragStart?.(e, file.id)}
            onDragOver={e => onDragOver?.(e, file.id, e.currentTarget)}
            onDrop={e => onDrop?.(e, file.id)}
            onDragEnd={onDragEnd}
            className={cn(
                'group relative flex h-full min-w-0 max-w-48 shrink-0 cursor-pointer items-center gap-1.5 border-r border-border px-3 text-sm font-light select-none',
                {
                    'bg-background text-foreground': isActive,
                    'bg-surface text-muted-foreground hover:bg-background/50 hover:text-foreground':
                        !isActive,
                    'opacity-40': isDragging,
                },
            )}
        >
            {dropIndicator === 'before' && (
                <span className='pointer-events-none absolute -inset-y-1 left-0 w-0.5 rounded-full bg-brand' />
            )}
            {dropIndicator === 'after' && (
                <span className='pointer-events-none absolute -inset-y-1 right-0 w-0.5 rounded-full bg-brand' />
            )}
            {tabGradient && (
                <span
                    className='absolute inset-x-0 top-0 h-0.5'
                    style={{ background: tabGradient }}
                />
            )}
            <LangIcon language={file.language} />

            {isEditing ? (
                <>
                    <input
                        ref={$input}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={handleKeyDown}
                        onClick={e => e.stopPropagation()}
                        className='min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none'
                    />
                    {aiCompletions?.enabled && (
                        <TooltipProvider delay={1500}>
                            <Tooltip>
                                <TooltipTrigger
                                    onClick={handleAiSuggestName}
                                    onDoubleClick={e => e.stopPropagation()}
                                    className='ml-0.5 shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40'
                                    disabled={isAiLoading}
                                >
                                    {isAiLoading ? (
                                        <Loader2 className='size-3 animate-spin' />
                                    ) : (
                                        <Wand2 className='size-3' />
                                    )}
                                </TooltipTrigger>
                                <TooltipContent side='bottom' align='end'>
                                    {t('editor.tab_bar.ai_suggest_name')}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </>
            ) : (
                <TooltipProvider delay={1500}>
                    <Tooltip>
                        <TooltipTrigger render={<span />} className='min-w-0 flex-1 truncate'>
                            {file.name}
                        </TooltipTrigger>
                        <TooltipContent side='bottom' align='start'>
                            {file.name}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            {!isReadonly && (
                <TooltipProvider>
                    <Tooltip
                        open={tooltipOpen}
                        onOpenChange={o => {
                            if (!isConfirming) setTooltipOpen(o);
                        }}
                    >
                        <TooltipTrigger
                            onClick={e => {
                                e.stopPropagation();
                                if (!canDelete) return;
                                onDeleteConfirm(file.id);
                            }}
                            onDoubleClick={e => e.stopPropagation()}
                            className={cn('ml-0.5 shrink-0 rounded p-0.5 transition-colors', {
                                'text-destructive': isConfirming,
                                'text-muted-foreground hover:text-foreground':
                                    canDelete && !isConfirming,
                                'text-muted-foreground opacity-35 cursor-default':
                                    !canDelete && !isConfirming,
                            })}
                        >
                            {isConfirming ? (
                                <Trash2 className='size-3' />
                            ) : (
                                <X className='size-3' />
                            )}
                        </TooltipTrigger>
                        <TooltipContent side='bottom' align='end'>
                            {isConfirming
                                ? t('editor.tab_bar.confirm_delete')
                                : t('editor.tab_bar.delete_file')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
        </div>
    );
};

const makeGradient = colors => {
    if (colors.length === 0) return null;
    if (colors.length === 1) return colors[0];
    return `linear-gradient(to right, ${colors.join(', ')})`;
};

const UndoRedo = ({ canUndo, canRedo, onUndo, onRedo }) => {
    const { t } = useTranslation();
    return (
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
    );
};

const TabStrip = ({
    files,
    activeFileId,
    isReadonly,
    onTabChange,
    onRenameFile,
    deleteConfirmId,
    onDeleteConfirm,
    getTabGradient,
    onReorderFiles,
    aiCompletions,
}) => {
    const { t } = useTranslation();
    const $scroll = useRef(null);
    const [overflow, setOverflow] = useState({ left: false, right: false });
    const [dragId, setDragId] = useState(null);
    const [dragOverId, setDragOverId] = useState(null);
    const [dropPosition, setDropPosition] = useState(null);

    const checkOverflow = useCallback(() => {
        const el = $scroll.current;
        if (!el) return;
        setOverflow({
            left: el.scrollLeft > 0,
            right: Math.ceil(el.scrollLeft) + el.clientWidth < el.scrollWidth,
        });
    }, []);

    useEffect(() => {
        const el = $scroll.current;
        if (!el) return;
        const ro = new ResizeObserver(checkOverflow);
        ro.observe(el);
        el.addEventListener('scroll', checkOverflow, { passive: true });
        checkOverflow();
        return () => {
            ro.disconnect();
            el.removeEventListener('scroll', checkOverflow);
        };
    }, [checkOverflow]);

    useEffect(() => {
        const el = $scroll.current;
        if (!el) return;
        const activeTab = el.querySelector('[aria-selected="true"]');
        activeTab?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }, [activeFileId]);

    const scroll = delta => $scroll.current?.scrollBy({ left: delta, behavior: 'smooth' });

    const handleDragStart = (e, fileId) => {
        setDragId(fileId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, fileId, el) => {
        e.preventDefault();
        if (fileId === dragId) return;
        const rect = el.getBoundingClientRect();
        setDragOverId(fileId);
        setDropPosition(e.clientX < rect.left + rect.width / 2 ? 'before' : 'after');
    };

    const handleDrop = (e, fileId) => {
        e.preventDefault();
        if (!dragId || !onReorderFiles) return;

        const fromIdx = files.findIndex(f => f.id === dragId);
        const toIdx = files.findIndex(f => f.id === fileId);

        if (fromIdx !== -1 && toIdx !== -1 && fromIdx !== toIdx) {
            let insertAt = dropPosition === 'after' ? toIdx + 1 : toIdx;
            if (fromIdx < insertAt) insertAt -= 1;
            if (insertAt !== fromIdx) onReorderFiles(dragId, insertAt);
        }

        setDragId(null);
        setDragOverId(null);
        setDropPosition(null);
    };

    const handleDragEnd = () => {
        setDragId(null);
        setDragOverId(null);
        setDropPosition(null);
    };

    const getDropIndicator = fileId => {
        if (!dragId || dragOverId !== fileId || dragId === fileId) return null;
        return dropPosition;
    };

    return (
        <div className='flex min-w-0 items-stretch overflow-hidden'>
            {overflow.left && (
                <button
                    onClick={() => scroll(-120)}
                    className='flex w-6 shrink-0 items-center justify-center border-r border-border text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'
                >
                    <ChevronLeft className='size-3.5' />
                </button>
            )}

            <div
                ref={$scroll}
                className='flex min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden'
                onDragLeave={e => {
                    if (!$scroll.current?.contains(e.relatedTarget)) {
                        setDragOverId(null);
                        setDropPosition(null);
                    }
                }}
            >
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
                        onDeleteConfirm={onDeleteConfirm}
                        isDragging={dragId === file.id}
                        dropIndicator={getDropIndicator(file.id)}
                        onDragStart={!isReadonly ? handleDragStart : undefined}
                        onDragOver={!isReadonly ? handleDragOver : undefined}
                        onDrop={!isReadonly ? handleDrop : undefined}
                        onDragEnd={!isReadonly ? handleDragEnd : undefined}
                        aiCompletions={aiCompletions}
                    />
                ))}
            </div>

            {overflow.right && (
                <button
                    onClick={() => scroll(120)}
                    className='flex w-6 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'
                >
                    <ChevronRight className='size-3.5' />
                </button>
            )}
        </div>
    );
};

const RunnerToggle = ({ isActive, onToggle, t }) => (
    <TooltipProvider delay={1500}>
        <Tooltip>
            <TooltipTrigger
                onClick={onToggle}
                className={cn(
                    'flex size-10 shrink-0 items-center justify-center border-l border-border transition-all',
                    {
                        'text-brand bg-brand/10 hover:bg-brand/20': isActive,
                        'text-muted-foreground hover:bg-surface-raised hover:text-foreground':
                            !isActive,
                    },
                )}
            >
                <Play className={cn('size-3.5', { 'fill-brand': isActive })} />
            </TooltipTrigger>
            <TooltipContent side='bottom' align='end'>
                {isActive ? t('editor.tab_bar.runner_hide') : t('editor.tab_bar.runner_show')}
            </TooltipContent>
        </Tooltip>
    </TooltipProvider>
);

export const TabBar = ({
    files,
    activeFileId,
    isReadonly,
    peers = {},
    user,
    runner,
    showRunner,
    onToggleRunner,
    onTabChange,
    onCreateFile,
    onDeleteFile,
    onRenameFile,
    onReorderFiles,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const [aiCompletions] = useSettings('aiCompletions');
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

    const canCreate = files.length < 10;

    return (
        <div className='flex h-10 shrink-0 items-stretch border-b border-border bg-surface'>
            {!isReadonly && (
                <UndoRedo canUndo={canUndo} canRedo={canRedo} onUndo={onUndo} onRedo={onRedo} />
            )}
            <TabStrip
                files={files}
                activeFileId={activeFileId}
                isReadonly={isReadonly}
                onTabChange={onTabChange}
                onRenameFile={onRenameFile}
                deleteConfirmId={deleteConfirmId}
                onDeleteConfirm={handleDeleteConfirm}
                getTabGradient={getTabGradient}
                onReorderFiles={onReorderFiles}
                aiCompletions={aiCompletions}
            />
            {!isReadonly && (
                <TooltipProvider delay={1500}>
                    <Tooltip>
                        <TooltipTrigger
                            onClick={canCreate ? onCreateFile : undefined}
                            className={cn(
                                'flex size-10 shrink-0 items-center justify-center border-l border-border text-muted-foreground transition-all',
                                {
                                    'opacity-30 hover:opacity-60': !canCreate,
                                    'hover:bg-surface-raised hover:text-foreground': canCreate,
                                },
                            )}
                        >
                            <Plus className='size-4' />
                        </TooltipTrigger>
                        <TooltipContent side='bottom' align='start'>
                            {t('editor.tab_bar.new_file')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            {runner && (
                <>
                    <span className='flex-1' />
                    <RunnerToggle isActive={showRunner} onToggle={onToggleRunner} t={t} />
                </>
            )}
        </div>
    );
};

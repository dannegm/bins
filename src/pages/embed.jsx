import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryState, parseAsString } from 'nuqs';
import { ExternalLink, Lock, FileQuestion, FileText, Play } from 'lucide-react';
import { Route } from '@/routes/embed.$binId';
import { getBinAccess, getBin } from '@/services/bins';
import { getFiles } from '@/services/bin-files';
import { EmbedMonacoEditor } from '@/components/editor/embed-monaco-editor';
import { EditorSkeleton } from '@/components/editor/editor-skeleton';
import { RunnerPanel } from '@/components/editor/runner-panel';
import { getLanguage } from '@/constants/languages';
import { getRunner } from '@/services/runners';
import { parseAsShorthandBoolean } from '@/helpers/parsers';
import { cn } from '@/helpers/utils';

const LangIcon = ({ language }) => {
    const lang = getLanguage(language);
    if (lang?.icon) {
        return (
            <i
                className={cn(lang.icon, 'colored text-sm leading-none')}
                style={{ color: lang.color }}
            />
        );
    }
    return <FileText className='size-3.5 text-muted-foreground' />;
};

const EmbedTabBar = ({ files, activeFileId, onSelect, showRunnerToggle, runnerActive, onToggleRunner }) => (
    <div className='flex h-9 shrink-0 border-b border-border bg-surface'>
        <div className='flex min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-none'>
            {files.map(file => (
                <button
                    key={file.id}
                    onClick={() => onSelect(file.id)}
                    className={cn(
                        'relative flex h-full shrink-0 cursor-pointer items-center gap-1.5 border-r border-border px-3 text-xs transition-colors',
                        {
                            'bg-background text-foreground': file.id === activeFileId,
                            'text-muted-foreground hover:text-foreground': file.id !== activeFileId,
                        },
                    )}
                >
                    {file.id === activeFileId && (
                        <span className='pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-brand' />
                    )}
                    <LangIcon language={file.language} />
                    {file.name}
                </button>
            ))}
        </div>
        {showRunnerToggle && (
            <button
                onClick={onToggleRunner}
                className={cn(
                    'flex size-9 shrink-0 cursor-pointer items-center justify-center border-l border-border transition-all',
                    {
                        'bg-brand/10 text-brand hover:bg-brand/20': runnerActive,
                        'text-muted-foreground hover:bg-surface-raised hover:text-foreground': !runnerActive,
                    },
                )}
            >
                <Play className={cn('size-3.5', { 'fill-brand': runnerActive })} />
            </button>
        )}
    </div>
);

const EmbedFooter = ({ bin, t }) => (
    <div className='flex h-8 shrink-0 items-center gap-2 border-t border-border bg-surface px-3'>
        <span className='min-w-0 flex-1 truncate text-xs text-muted-foreground'>
            {bin?.title || t('embed.untitled')}
        </span>
        <a
            href={`/editor/${bin?.id}`}
            target='_blank'
            rel='noopener noreferrer'
            className='flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
        >
            {t('embed.open_in_bins')}
            <ExternalLink className='size-3' />
        </a>
    </div>
);

const PrivateScreen = ({ t }) => (
    <div className='flex h-dvh flex-col items-center justify-center gap-3 bg-background'>
        <Lock className='size-7 text-muted-foreground' />
        <div className='text-center'>
            <p className='text-sm font-medium text-foreground'>{t('embed.private_title')}</p>
            <p className='mt-1 text-xs text-muted-foreground'>{t('embed.private_description')}</p>
        </div>
    </div>
);

const NotFoundScreen = ({ t }) => (
    <div className='flex h-dvh flex-col items-center justify-center gap-3 bg-background'>
        <FileQuestion className='size-7 text-muted-foreground' />
        <div className='text-center'>
            <p className='text-sm font-medium text-foreground'>{t('embed.not_found_title')}</p>
            <p className='mt-1 text-xs text-muted-foreground'>
                {t('embed.not_found_description')}
            </p>
        </div>
    </div>
);

export const EmbedPage = () => {
    const { t } = useTranslation();
    const { binId } = Route.useParams();

    const [viewsParam, setViewsParam] = useQueryState('views', parseAsString.withDefault('editor'));
    const [runnable] = useQueryState('runnable', parseAsShorthandBoolean);
    const [fileParam] = useQueryState('file', parseAsString);

    const showsEditor = viewsParam !== 'runner';
    const runnerVisible = viewsParam.includes('runner');

    const toggleRunner = () =>
        setViewsParam(runnerVisible ? (showsEditor ? 'editor' : null) : (showsEditor ? 'editor|runner' : 'runner'));
    const closeRunner = () =>
        setViewsParam(showsEditor ? 'editor' : null);

    const [bin, setBin] = useState(null);
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPrivate, setIsPrivate] = useState(false);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const load = async () => {
            const access = await getBinAccess(binId);
            if (!access.bin_exists) {
                setNotFound(true);
                setIsLoading(false);
                return;
            }
            if (!access.can_access) {
                setIsPrivate(true);
                setIsLoading(false);
                return;
            }

            const [binData, filesData] = await Promise.all([getBin(binId), getFiles(binId)]);
            setBin(binData);
            setFiles(filesData);

            const initial =
                fileParam && filesData.find(f => f.id === fileParam)
                    ? fileParam
                    : filesData[0]?.id ?? null;
            setActiveFileId(initial);
            setIsLoading(false);
        };
        load();
    }, [binId]);

    const handleTabSelect = id => {
        setActiveFileId(id);
    };

    if (isLoading) {
        return (
            <div className='h-dvh w-full'>
                <EditorSkeleton />
            </div>
        );
    }
    if (notFound) return <NotFoundScreen t={t} />;
    if (isPrivate) return <PrivateScreen t={t} />;

    const activeFile = files.find(f => f.id === activeFileId);
    const content = activeFile?.content ?? '';
    const runner = activeFile ? getRunner(activeFile.language) : null;

    const showRunnerToggle = runnable && !!runner;
    const runnerOnClose = runnable ? closeRunner : undefined;
    const showTabBar = files.length > 1 || showRunnerToggle;

    return (
        <div className='flex h-dvh flex-col overflow-hidden bg-background'>
            {showTabBar && (
                <EmbedTabBar
                    files={files}
                    activeFileId={activeFileId}
                    onSelect={handleTabSelect}
                    showRunnerToggle={showRunnerToggle}
                    runnerActive={runnerVisible}
                    onToggleRunner={toggleRunner}
                />
            )}

            <div
                className={cn('flex min-h-0 flex-1 flex-col', {
                    'sm:flex-row': showsEditor && runnerVisible,
                })}
            >
                {showsEditor && (
                    <div className='min-h-0 flex-1'>
                        {activeFile ? (
                            <EmbedMonacoEditor content={content} language={activeFile.language} />
                        ) : (
                            <EditorSkeleton />
                        )}
                    </div>
                )}
                {runnerVisible && runner && (
                    <RunnerPanel
                        runner={runner}
                        content={content}
                        language={activeFile.language}
                        fileId={activeFile.id}
                        packages={[]}
                        onClose={runnerOnClose}
                    />
                )}
            </div>

            <EmbedFooter bin={bin} t={t} />
        </div>
    );
};

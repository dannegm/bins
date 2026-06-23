import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { AnimatePresence } from 'motion/react';
import { MonacoEditor } from '@/components/editor/monaco-editor';
import { RunnerPanel } from '@/components/editor/runner-panel';
import { ErrorBoundary } from '@/components/system/error-boundary';
import { EditorSkeleton } from '@/components/editor/editor-skeleton';
import { StatusBar } from '@/components/editor/status-bar';
import { FileDropOverlay } from '@/components/editor/file-drop-overlay';
import { useDefaultLayout } from 'react-resizable-panels';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/ui/resizable';
import { Drawer, DrawerContent } from '@/ui/drawer';
import { updateFile } from '@/services/bin-files';
import { initYDoc } from '@/services/yjs';
import { settings } from '@/services/settings';
import { useIdentity } from '@/hooks/use-identity';
import { useIsMobile } from '@/hooks/use-mobile';

const SAVE_DEBOUNCE_MS = 1500;

export const EditorCore = ({
    binId,
    file,
    peers,
    readOnly,
    revealPosition,
    onRevealed,
    onUndoManagerReady,
    onFirstSave,
    onLanguageChange,
    onCursorChange,
    onSelectionChange,
    onCreateFile,
    onContentSaved,
    onSaveStatusChange,
    runner = null,
    showRunner = false,
    onCloseRunner,
}) => {
    const { user } = useIdentity();
    const isMobile = useIsMobile();
    const [saveStatus, setSaveStatus] = useState('idle');
    const [cursor, setCursor] = useState({ lineNumber: 1, column: 1 });
    const [lineCount, setLineCount] = useState(1);
    const [yContext, setYContext] = useState(null);
    const $saveTimer = useRef(null);
    const $hasLocalEdits = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    const panelStorage = useMemo(
        () => ({
            getItem: name => {
                const layouts = settings.get('runnerPanel.layouts', {});
                return layouts[name] ?? null;
            },
            setItem: (name, value) => {
                const layouts = settings.get('runnerPanel.layouts', {});
                settings.set('runnerPanel.layouts', { ...layouts, [name]: value });
            },
        }),
        [],
    );

    const panelGroupProps = useDefaultLayout({
        panelIds: [`editor:${file.id}`, `runner:${file.id}`],
        storage: panelStorage,
        defaultLayout: [50, 50],
    });

    const [channelStatus, setChannelStatus] = useState('connecting');

    useEffect(() => {
        const ctx = initYDoc(binId, file.id, file.content ?? '');
        onUndoManagerReady?.(ctx.undoManager);
        ctx.onReady(() => setYContext(ctx));
        ctx.onChannelStatus(setChannelStatus);

        return () => {
            clearTimeout($saveTimer.current);
            ctx.onChannelStatus(null);
        };
    }, []);

    const scheduleSave = useCallback(
        content => {
            clearTimeout($saveTimer.current);
            setSaveStatus('unsaved');

            $saveTimer.current = setTimeout(async () => {
                setSaveStatus('saving');
                try {
                    await updateFile(file.id, { content });
                    if (!$hasLocalEdits.current) {
                        $hasLocalEdits.current = true;
                        onFirstSave?.();
                    }
                    setSaveStatus('saved');
                    onContentSaved?.(content);
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } catch {
                    setSaveStatus('unsaved');
                }
            }, SAVE_DEBOUNCE_MS);
        },
        [file.id, onFirstSave],
    );

    useEffect(() => {
        onSaveStatusChange?.(saveStatus);
    }, [saveStatus]);

    useEffect(() => {
        if (!yContext) return;
        const count = () => setLineCount((yContext.yText.toString().match(/\n/g)?.length ?? 0) + 1);
        count();
        yContext.yText.observe(count);
        return () => yContext.yText.unobserve(count);
    }, [yContext]);

    useEffect(() => {
        if (!yContext || readOnly) return;
        const observer = event => {
            if (event.transaction.origin === 'remote' || event.transaction.origin === 'init')
                return;
            scheduleSave(yContext.yText.toString());
        };
        yContext.yText.observe(observer);
        return () => yContext.yText.unobserve(observer);
    }, [yContext, scheduleSave, readOnly]);

    useHotkeys(
        ['ctrl+s', 'meta+s'],
        () => {
            if (!yContext) return;
            clearTimeout($saveTimer.current);
            scheduleSave(yContext.yText.toString());
        },
        { preventDefault: true, enableOnContentEditable: true },
        [yContext, scheduleSave],
    );

    const selfPeer = {
        uuid: user.uuid,
        name: user.name,
        colorDark: user.colorDark,
        colorLight: user.colorLight,
    };
    const binPeers = [selfPeer, ...Object.values(peers)];
    const activePeers = binPeers.filter(p => p.activeFileId === file.id && p.cursor);

    const handleCursorChange = pos => {
        setCursor(pos);
        onCursorChange?.(pos);
    };

    const handleDragEnter = e => {
        if (!e.dataTransfer.types.includes('Files') || readOnly || !yContext) return;
        setIsDragging(true);
    };

    const handleDragLeave = e => {
        if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
    };

    const editorPane = (
        <div className='relative h-full min-w-0'>
            {yContext ? (
                <ErrorBoundary>
                    <MonacoEditor
                        yText={yContext.yText}
                        clientId={user?.uuid}
                        language={file.language}
                        readOnly={readOnly}
                        peers={activePeers}
                        revealPosition={revealPosition}
                        onRevealed={onRevealed}
                        onSave={() => scheduleSave(yContext.yText.toString())}
                        onCursorChange={handleCursorChange}
                        onSelectionChange={onSelectionChange}
                    />
                </ErrorBoundary>
            ) : (
                <EditorSkeleton />
            )}
        </div>
    );

    const runnerPane = runner && (
        <ErrorBoundary>
            <RunnerPanel
                runner={runner}
                content={file.content ?? ''}
                language={file.language}
                fileId={file.id}
                onClose={onCloseRunner}
            />
        </ErrorBoundary>
    );

    return (
        <div
            className='flex min-h-0 flex-1 flex-col overflow-hidden'
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
                e.preventDefault();
                setIsDragging(false);
            }}
        >
            <div className='relative min-h-0 flex-1 overflow-hidden'>
                {isMobile ? (
                    <>
                        <div className='h-full'>{editorPane}</div>
                        <Drawer
                            open={showRunner && !!runner}
                            onOpenChange={open => !open && onCloseRunner?.()}
                            direction='bottom'
                        >
                            <DrawerContent className='h-[calc(100dvh-5rem)] rounded-none p-0'>
                                {runnerPane}
                            </DrawerContent>
                        </Drawer>
                    </>
                ) : (
                    <ResizablePanelGroup direction='horizontal' {...panelGroupProps}>
                        <ResizablePanel
                            collapsible
                            minSize={200}
                            id={`editor:${file.id}`}
                            className='relative'
                        >
                            {editorPane}
                        </ResizablePanel>
                        {showRunner && runner && (
                            <>
                                <ResizableHandle withHandle />
                                <ResizablePanel
                                    minSize={400}
                                    id={`runner:${file.id}`}
                                    className='relative flex flex-col'
                                >
                                    {runnerPane}
                                </ResizablePanel>
                            </>
                        )}
                    </ResizablePanelGroup>
                )}
                <AnimatePresence>
                    {isDragging && yContext && !readOnly && (
                        <FileDropOverlay
                            yContext={yContext}
                            onCreateFile={onCreateFile}
                            onDismiss={() => setIsDragging(false)}
                        />
                    )}
                </AnimatePresence>
            </div>
            <StatusBar
                language={file.language}
                content={file.content ?? ''}
                cursor={cursor}
                lineCount={lineCount}
                isLoading={!yContext}
                saveStatus={saveStatus}
                syncStatus={channelStatus}
                peers={binPeers}
                onLanguageChange={lang => onLanguageChange(file.id, lang)}
            />
        </div>
    );
};

import { useEffect, useRef, useState, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { MonacoEditor } from '@/components/editor/monaco-editor';
import { EditorSkeleton } from '@/components/editor/editor-skeleton';
import { StatusBar } from '@/components/editor/status-bar';
import { FileDropOverlay } from '@/components/editor/file-drop-overlay';
import { updateFile } from '@/services/bin-files';
import { initYDoc } from '@/services/yjs';
import { useIdentity } from '@/hooks/use-identity';

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
}) => {
    const { user } = useIdentity();
    const [saveStatus, setSaveStatus] = useState('idle');
    const [cursor, setCursor] = useState({ lineNumber: 1, column: 1 });
    const [lineCount, setLineCount] = useState(1);
    const [yContext, setYContext] = useState(null);
    const $saveTimer = useRef(null);
    const $hasLocalEdits = useRef(false);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const ctx = initYDoc(binId, file.id, file.content ?? '');
        onUndoManagerReady?.(ctx.undoManager);
        ctx.onReady(() => setYContext(ctx));

        return () => {
            clearTimeout($saveTimer.current);
            ctx.destroy();
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

    return (
        <div
            className='flex min-h-0 flex-1 flex-col'
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); setIsDragging(false); }}
        >
            <div className='relative min-h-0 flex-1'>
                {yContext ? (
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
                ) : (
                    <EditorSkeleton />
                )}
                {isDragging && yContext && !readOnly && (
                    <FileDropOverlay
                        yContext={yContext}
                        onCreateFile={onCreateFile}
                        onDismiss={() => setIsDragging(false)}
                    />
                )}
            </div>
            <StatusBar
                language={file.language}
                cursor={cursor}
                lineCount={lineCount}
                isLoading={!yContext}
                saveStatus={saveStatus}
                peers={binPeers}
                onLanguageChange={lang => onLanguageChange(file.id, lang)}
            />
        </div>
    );
};

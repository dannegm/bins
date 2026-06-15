import { useEffect, useRef, useState, useCallback } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useTranslation } from 'react-i18next';
import { Route } from '@/routes/editor.$binId';
import { Layout } from '@/components/layout/layout';
import { BinHeader } from '@/components/editor/bin-header';
import { TabBar } from '@/components/editor/tab-bar';
import { MonacoEditor } from '@/components/editor/monaco-editor';
import { StatusBar } from '@/components/editor/status-bar';
import { ensureBin, permanentizeBin, updateBin } from '@/services/bins';
import { registerCollaborator } from '@/services/bin-collaborators';
import { getFiles, createFile, updateFile, deleteFile } from '@/services/bin-files';
import { initYDoc } from '@/services/yjs';
import { supabase } from '@/services/supabase';
import { useIdentity } from '@/hooks/use-identity';
import { getLanguageByFilename } from '@/constants/languages';

const SAVE_DEBOUNCE_MS = 1500;


const EditorCore = ({ binId, file, peers, readOnly, onUndoManagerReady, onFirstSave, onLanguageChange }) => {
    const { user } = useIdentity();
    const [saveStatus, setSaveStatus] = useState('idle');
    const [cursor, setCursor] = useState({ lineNumber: 1, column: 1 });
    const [yContext, setYContext] = useState(null);
    const $saveTimer = useRef(null);
    const $hasLocalEdits = useRef(false);

    useEffect(() => {
        const ctx = initYDoc(binId, file.id, file.content ?? '');
        setYContext(ctx);
        onUndoManagerReady?.(ctx.undoManager);

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
                    setTimeout(() => setSaveStatus('idle'), 2000);
                } catch {
                    setSaveStatus('unsaved');
                }
            }, SAVE_DEBOUNCE_MS);
        },
        [file.id, onFirstSave],
    );

    useEffect(() => {
        if (!yContext || readOnly) return;
        const observer = event => {
            if (event.transaction.origin === 'remote') return;
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

    const peerCount = Object.values(peers).filter(p => p.activeFileId === file.id).length;

    return (
        <div className='flex min-h-0 flex-1 flex-col'>
            <div className='min-h-0 flex-1'>
                {yContext && (
                    <MonacoEditor
                        yText={yContext.yText}
                        clientId={user?.uuid}
                        language={file.language}
                        readOnly={readOnly}
                        onCursorChange={setCursor}
                    />
                )}
            </div>
            <StatusBar
                language={file.language}
                cursor={cursor}
                saveStatus={saveStatus}
                peerCount={peerCount}
                onLanguageChange={lang => onLanguageChange(file.id, lang)}
            />
        </div>
    );
};

const sortByPosition = (a, b) => a.position - b.position;

const nextUntitledName = files => {
    const names = new Set(files.map(f => f.name));
    if (!names.has('untitled')) return 'untitled';
    let n = 2;
    while (names.has(`untitled-${n}`)) n++;
    return `untitled-${n}`;
};

export const EditorPage = () => {
    const { t } = useTranslation();
    const { binId } = Route.useParams();
    const { user } = useIdentity();

    const [bin, setBin] = useState(null);
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [peers, setPeers] = useState({});

    const $undoManager = useRef(null);
    const $hasBeenSaved = useRef(false);
    const $presenceChannel = useRef(null);
    const $binChannel = useRef(null);
    const [undoState, setUndoState] = useState({ canUndo: false, canRedo: false });

    const activeFile = files.find(f => f.id === activeFileId) ?? null;

    useEffect(() => {
        if (!user?.uuid) return;

        const ch = supabase()
            .channel(`bin:${binId}:awareness`)
            .on('presence', { event: 'sync' }, () => {
                const state = ch.presenceState();
                const next = {};
                for (const [uuid, presences] of Object.entries(state)) {
                    if (uuid !== user.uuid) next[uuid] = presences[0];
                }
                setPeers(next);
            })
            .subscribe(async status => {
                if (status === 'SUBSCRIBED') {
                    await ch.track({ uuid: user.uuid, name: user.name, activeFileId });
                }
            });

        $presenceChannel.current = ch;
        return () => {
            ch.unsubscribe();
            $presenceChannel.current = null;
        };
    }, [binId, user?.uuid]);

    useEffect(() => {
        const ch = $presenceChannel.current;
        if (!ch || !user?.uuid || !activeFileId) return;
        ch.track({ uuid: user.uuid, name: user.name, activeFileId });
    }, [activeFileId, user?.name]);

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const binData = await ensureBin(binId);
                if (!mounted) return;
                setBin(binData);

                const clientId = user?.uuid;
                if (clientId && binData.author_id !== clientId) {
                    registerCollaborator(binId, clientId).catch(() => {});
                }

                let fileList = await getFiles(binId);

                if (fileList.length === 0) {
                    const newFile = await createFile(binId, {
                        name: 'untitled',
                        language: 'markdown',
                        content: '',
                        position: 0,
                    });
                    fileList = [newFile];
                }

                if (!mounted) return;
                setFiles(fileList);
                setActiveFileId(fileList[0].id);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        init();

        const ch = supabase()
            .channel(`bin:${binId}:structure`, { config: { broadcast: { self: false } } })
            .on('broadcast', { event: 'bin:updated' }, ({ payload }) => {
                setBin(prev => ({ ...prev, ...payload }));
            })
            .on('broadcast', { event: 'file:created' }, ({ payload }) => {
                setFiles(prev => {
                    if (prev.some(f => f.id === payload.file.id)) return prev;
                    return [...prev, payload.file].sort(sortByPosition);
                });
            })
            .on('broadcast', { event: 'file:updated' }, ({ payload }) => {
                setFiles(prev => prev.map(f => (f.id === payload.file.id ? { ...f, ...payload.file } : f)));
            })
            .on('broadcast', { event: 'file:deleted' }, ({ payload }) => {
                setFiles(prev => {
                    const remaining = prev.filter(f => f.id !== payload.fileId);
                    setActiveFileId(cur => (cur === payload.fileId ? (remaining[0]?.id ?? null) : cur));
                    return remaining;
                });
            })
            .subscribe();

        $binChannel.current = ch;

        return () => {
            mounted = false;
            ch.unsubscribe();
            $binChannel.current = null;
        };
    }, [binId]);

    useEffect(() => {
        const cleanup = () => {
            if (!$hasBeenSaved.current) {
                supabase().from('bins').delete().eq('id', binId);
            }
        };
        window.addEventListener('beforeunload', cleanup);
        return () => window.removeEventListener('beforeunload', cleanup);
    }, [binId]);

    const handleUndoManagerReady = useCallback(um => {
        $undoManager.current = um;
        const refresh = () => setUndoState({ canUndo: um.canUndo(), canRedo: um.canRedo() });
        um.on('stack-item-added', refresh);
        um.on('stack-item-popped', refresh);
        um.on('stack-item-updated', refresh);
    }, []);

    const handleFirstSave = useCallback(async () => {
        if ($hasBeenSaved.current) return;
        $hasBeenSaved.current = true;
        await permanentizeBin(binId);
    }, [binId]);

    const isAuthor = user?.uuid === bin?.author_id;
    const isGuestReadonly = !isAuthor && (bin?.is_readonly ?? true);

    const broadcast = (event, payload) => {
        $binChannel.current?.send({ type: 'broadcast', event, payload });
    };

    const handleCreateFile = async () => {
        if (files.length >= 10) return;
        try {
            const newFile = await createFile(binId, {
                name: nextUntitledName(files),
                language: 'markdown',
                content: '',
                position: files.length,
            });
            setFiles(prev => {
                if (prev.some(f => f.id === newFile.id)) return prev;
                return [...prev, newFile].sort(sortByPosition);
            });
            setActiveFileId(newFile.id);
            broadcast('file:created', { file: newFile });
        } catch (err) {
            console.error('Failed to create file:', err);
        }
    };

    const handleDeleteFile = async fileId => {
        if (files.length <= 1) return;
        try {
            await deleteFile(fileId);
        } catch (err) {
            console.error('Failed to delete file:', err);
            return;
        }
        const remaining = files.filter(f => f.id !== fileId);
        setFiles(remaining);
        if (activeFileId === fileId) setActiveFileId(remaining[0]?.id ?? null);
        broadcast('file:deleted', { fileId });
    };

    const handleRenameFile = async (fileId, name) => {
        const lang = getLanguageByFilename(name);
        await updateFile(fileId, { name, language: lang.id });
        setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, name, language: lang.id } : f)));
        broadcast('file:updated', { file: { id: fileId, name, language: lang.id } });
    };

    const handleLanguageChange = async (fileId, language) => {
        await updateFile(fileId, { language });
        setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, language } : f)));
        broadcast('file:updated', { file: { id: fileId, language } });
    };

    const handleTitleChange = async title => {
        await updateBin(binId, { title });
        setBin(prev => ({ ...prev, title }));
        broadcast('bin:updated', { title });
    };

    const handleReadonlyToggle = async () => {
        const is_readonly = !bin?.is_readonly;
        await updateBin(binId, { is_readonly });
        setBin(prev => ({ ...prev, is_readonly }));
        broadcast('bin:updated', { is_readonly });
    };

    const handleShare = async () => {
        await permanentizeBin(binId);
        $hasBeenSaved.current = true;
        await navigator.clipboard.writeText(window.location.href);
    };

    if (isLoading) {
        return (
            <Layout>
                <div className='flex h-full items-center justify-center'>
                    <div className='size-5 animate-spin rounded-full border-2 border-border border-t-brand' />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className='flex h-full flex-col overflow-hidden'>
                <BinHeader
                    bin={bin}
                    isAuthor={isAuthor}
                    onTitleChange={handleTitleChange}
                    onReadonlyToggle={handleReadonlyToggle}
                />
                <TabBar
                    files={files}
                    activeFileId={activeFileId}
                    isReadonly={isGuestReadonly}
                    onTabChange={setActiveFileId}
                    onCreateFile={handleCreateFile}
                    onDeleteFile={handleDeleteFile}
                    onRenameFile={handleRenameFile}
                    onShare={handleShare}
                    onUndo={() => $undoManager.current?.undo()}
                    onRedo={() => $undoManager.current?.redo()}
                    canUndo={undoState.canUndo}
                    canRedo={undoState.canRedo}
                />

                {activeFile && (
                    <EditorCore
                        key={activeFileId}
                        binId={binId}
                        file={activeFile}
                        peers={peers}
                        readOnly={isGuestReadonly}
                        onUndoManagerReady={handleUndoManagerReady}
                        onFirstSave={handleFirstSave}
                        onLanguageChange={handleLanguageChange}
                    />
                )}
            </div>
        </Layout>
    );
};

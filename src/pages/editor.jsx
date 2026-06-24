import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { useQueryState, parseAsString, parseAsBoolean } from 'nuqs';
import { toast } from '@/components/system/toast';
import { Route } from '@/routes/editor.$binId';
import { VISIBILITY } from '@/constants/visibility';
import { Layout } from '@/components/layout/layout';
import { BinHeader } from '@/components/editor/bin-header';
import { TabBar } from '@/components/editor/tab-bar';
import { EditorCore } from '@/components/editor/editor-core';
import { UserAvatar } from '@/components/system/user-avatar';
import {
    getBinAccess,
    ensureBin,
    permanentizeBin,
    updateBin,
    incrementViews,
} from '@/services/bins';
import { registerCollaborator, clearCollaborators } from '@/services/bin-collaborators';
import { getFiles, createFile, updateFile, deleteFile } from '@/services/bin-files';
import { supabase } from '@/services/supabase';
import { useIdentity } from '@/hooks/use-identity';
import { useAdmin } from '@/hooks/use-admin';
import { useFavicon } from '@/hooks/use-favicon';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { useListener, useEvents } from '@/providers/bus-provider';
import { getLanguageByFilename } from '@/constants/languages';
import { getRunner } from '@/services/runners';
import { destroyYDoc, destroyAllYDocs } from '@/services/yjs';
import { FlickeringGrid } from '@/ui/flickering-grid';
import CoffeeLoader from '@/components/system/coffee-loader';
import { usePackagesPanel } from '@/providers/packages-provider';
import { PackagesDrawer } from '@/components/editor/packages-drawer';

const PeerToast = ({ peer, message }) => (
    <div className='flex min-w-64 items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg shadow-black/25'>
        <UserAvatar profileId={peer.uuid} className='size-7 shrink-0' />
        <div className='flex flex-col'>
            <span className='text-sm font-medium text-foreground'>{peer.name}</span>
            <span className='text-xs text-muted-foreground'>{message}</span>
        </div>
    </div>
);

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

    useEffect(() => {
        try {
            if (window.self !== window.top) {
                window.location.replace(`/embed/${binId}`);
            }
        } catch {
            window.location.replace(`/embed/${binId}`);
        }
    }, []);
    const { isAdmin } = useAdmin();
    const { emit } = useEvents();
    const navigate = useNavigate();
    const [showRunner, setShowRunner] = useQueryState('runner', parseAsBoolean.withDefault(false));

    const [bin, setBin] = useState(null);
    const [files, setFiles] = useState([]);
    const [activeFileId, setActiveFileId] = useQueryState('file', parseAsString);
    const [isLoading, setIsLoading] = useState(true);
    const [peers, setPeers] = useState({});
    const [pendingReveal, setPendingReveal] = useState(null);

    const [saveStatus, setSaveStatus] = useState('idle');

    const $undoManager = useRef(null);
    const $hasBeenSaved = useRef(false);
    const $presenceChannel = useRef(null);
    const $binChannel = useRef(null);
    const $broadcastTimer = useRef(null);
    const $cursorRef = useRef(null);
    const $selectionRef = useRef(null);
    const $activeFileRef = useRef(null);
    const $knownPeers = useRef(null);
    const [undoState, setUndoState] = useState({ canUndo: false, canRedo: false });

    const activeFile = files.find(f => f.id === activeFileId) ?? null;

    const { setIsJsFile } = usePackagesPanel();
    const JS_LANGS = new Set(['javascript', 'typescript', 'jsx', 'tsx']);
    const binPackages = bin?.packages ?? [];

    useEffect(() => {
        const current = new Map(Object.entries(peers));
        if ($knownPeers.current === null) {
            $knownPeers.current = current;
            return;
        }
        for (const [uuid, peer] of current) {
            if (!$knownPeers.current.has(uuid)) {
                toast.custom(() => <PeerToast peer={peer} message={t('editor.peer_joined')} />);
            }
        }
        for (const [uuid, peer] of $knownPeers.current) {
            if (!current.has(uuid)) {
                toast.custom(() => <PeerToast peer={peer} message={t('editor.peer_left')} />);
            }
        }
        $knownPeers.current = current;
    }, [peers]);

    useEffect(() => {
        setIsJsFile(JS_LANGS.has(activeFile?.language));
    }, [activeFile?.language]);

    useEffect(() => {
        if (!user?.uuid) return;

        const ch = supabase()
            .channel(`bin:${binId}:awareness`)
            .on('presence', { event: 'sync' }, () => {
                const state = ch.presenceState();
                setPeers(prev => {
                    const next = {};
                    for (const [, presences] of Object.entries(state)) {
                        const p = presences[0];
                        if (p.uuid !== user.uuid) {
                            const existing = prev[p.uuid] ?? {};
                            next[p.uuid] = {
                                uuid: p.uuid,
                                name: p.name,
                                colorDark: p.colorDark,
                                colorLight: p.colorLight,
                                activeFileId: existing.activeFileId ?? p.activeFileId,
                                cursor: existing.cursor,
                                selection: existing.selection,
                            };
                        }
                    }
                    return next;
                });
            })
            .subscribe(async status => {
                if (status === 'SUBSCRIBED') {
                    await ch.track({
                        uuid: user.uuid,
                        name: user.name,
                        activeFileId,
                        colorDark: user.colorDark,
                        colorLight: user.colorLight,
                    });
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
        ch.track({
            uuid: user.uuid,
            name: user.name,
            activeFileId,
            colorDark: user.colorDark,
            colorLight: user.colorLight,
        });
    }, [activeFileId, user?.name]);

    const scheduleBroadcast = useCallback(() => {
        clearTimeout($broadcastTimer.current);
        $broadcastTimer.current = setTimeout(() => {
            $binChannel.current?.send({
                type: 'broadcast',
                event: 'cursor:move',
                payload: {
                    uuid: user.uuid,
                    cursor: $cursorRef.current,
                    selection: $selectionRef.current,
                    activeFileId: $activeFileRef.current,
                },
            });
        }, 100);
    }, [user?.uuid]);

    useEffect(() => {
        $activeFileRef.current = activeFileId;
        if (!activeFileId || !user?.uuid) return;
        $binChannel.current?.send({
            type: 'broadcast',
            event: 'cursor:move',
            payload: {
                uuid: user.uuid,
                cursor: $cursorRef.current,
                selection: $selectionRef.current,
                activeFileId,
            },
        });
    }, [activeFileId]);

    useListener(
        'peer:focus',
        useCallback(({ fileId, cursor }) => {
            setActiveFileId(fileId);
            setPendingReveal(cursor ?? null);
        }, []),
    );

    useListener(
        'editor:set-language',
        useCallback(
            ({ language }) => {
                if (activeFileId) handleLanguageChange(activeFileId, language);
            },
            [activeFileId],
        ),
    );

    useListener(
        'editor:toggle-runner',
        useCallback(() => setShowRunner(prev => !prev), [setShowRunner]),
    );
    useListener(
        'bin:share',
        useCallback(() => handleShare(), []),
    );
    useListener(
        'bin:fork',
        useCallback(() => window.open(`/fork/${binId}`, '_blank', 'noopener,noreferrer'), [binId]),
    );
    useListener(
        'bin:change-visibility',
        useCallback(() => handleReadonlyToggle(), [bin?.is_readonly]),
    );
    useListener(
        'editor:new-file',
        useCallback(() => handleCreateFile(), [files.length]),
    );
    useListener(
        'peer:nudge',
        useCallback(() => {
            broadcast('peer:nudge', { sender: user?.uuid });
            emit('peer:nudge:received');
        }, [user?.uuid]),
    );

    const handleEditorCursorChange = useCallback(
        cursor => {
            $cursorRef.current = cursor;
            scheduleBroadcast();
        },
        [scheduleBroadcast],
    );

    const handleEditorSelectionChange = useCallback(
        selection => {
            $selectionRef.current = selection;
            scheduleBroadcast();
        },
        [scheduleBroadcast],
    );

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const { bin_exists, can_access } = await getBinAccess(binId);
                if (!mounted) return;

                if (bin_exists && !can_access) {
                    navigate({ to: '/' });
                    return;
                }

                const binData = await ensureBin(binId);
                if (!mounted) return;

                const clientId = user?.uuid;
                const isAuthorNow = binData.author_id === clientId;

                setBin(binData);

                incrementViews(binId).catch(() => {});

                if (clientId && !isAuthorNow && binData.visibility === VISIBILITY.PUBLIC) {
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
                const validId = fileList.find(f => f.id === activeFileId)?.id ?? fileList[0].id;
                setActiveFileId(validId);
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
            .on('broadcast', { event: 'bin:kick' }, () => {
                navigate({ to: '/' });
            })
            .on('broadcast', { event: 'file:created' }, ({ payload }) => {
                setFiles(prev => {
                    if (prev.some(f => f.id === payload.file.id)) return prev;
                    return [...prev, payload.file].sort(sortByPosition);
                });
            })
            .on('broadcast', { event: 'file:updated' }, ({ payload }) => {
                setFiles(prev =>
                    prev.map(f => (f.id === payload.file.id ? { ...f, ...payload.file } : f)),
                );
            })
            .on('broadcast', { event: 'file:reordered' }, ({ payload }) => {
                setFiles(prev =>
                    prev
                        .map(f =>
                            payload.positions[f.id] !== undefined
                                ? { ...f, position: payload.positions[f.id] }
                                : f,
                        )
                        .sort(sortByPosition),
                );
            })
            .on('broadcast', { event: 'file:deleted' }, ({ payload }) => {
                setFiles(prev => {
                    const remaining = prev.filter(f => f.id !== payload.fileId);
                    setActiveFileId(cur =>
                        cur === payload.fileId ? (remaining[0]?.id ?? null) : cur,
                    );
                    return remaining;
                });
            })
            .on('broadcast', { event: 'peer:nudge' }, ({ payload }) => {
                if (payload.sender !== user?.uuid) emit('peer:nudge:received');
            })
            .on('broadcast', { event: 'cursor:move' }, ({ payload }) => {
                setPeers(prev => {
                    const existing = prev[payload.uuid];
                    if (!existing) return prev;
                    return {
                        ...prev,
                        [payload.uuid]: {
                            ...existing,
                            cursor: payload.cursor,
                            selection: payload.selection ?? null,
                            ...(payload.activeFileId && { activeFileId: payload.activeFileId }),
                        },
                    };
                });
            })
            .subscribe();

        $binChannel.current = ch;

        return () => {
            mounted = false;
            ch.unsubscribe();
            $binChannel.current = null;
            destroyAllYDocs(binId);
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
    const isGuestReadonly = !isAuthor && !isAdmin && (bin?.is_readonly ?? true);
    const runner = activeFile ? getRunner(activeFile.language) : null;

    const hasUnsaved = saveStatus === 'unsaved';
    useFavicon({ hasUnsaved });
    useDocumentTitle({ binTitle: bin?.title, fileName: activeFile?.name, hasUnsaved });

    const broadcast = (event, payload) => {
        $binChannel.current?.send({ type: 'broadcast', event, payload });
    };

    const handleCreateFile = async (override = {}) => {
        if (files.length >= 10) return;
        try {
            const newFile = await createFile(binId, {
                name: override.name ?? nextUntitledName(files),
                language: override.language ?? 'markdown',
                content: override.content ?? '',
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
        destroyYDoc(binId, fileId);
        const remaining = files.filter(f => f.id !== fileId);
        setFiles(remaining);
        if (activeFileId === fileId) setActiveFileId(remaining[0]?.id ?? null);
        broadcast('file:deleted', { fileId });
    };

    const handleReorderFiles = async (fileId, newIndex) => {
        const fromIndex = files.findIndex(f => f.id === fileId);
        if (fromIndex === -1 || fromIndex === newIndex) return;

        const reordered = [...files];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(newIndex, 0, moved);

        const updated = reordered.map((f, i) => ({ ...f, position: i }));
        setFiles(updated);

        const posMap = new Map(files.map(f => [f.id, f.position]));
        const toUpdate = updated.filter(f => posMap.get(f.id) !== f.position);
        await Promise.all(toUpdate.map(f => updateFile(f.id, { position: f.position })));

        broadcast('file:reordered', {
            positions: Object.fromEntries(updated.map(f => [f.id, f.position])),
        });
    };

    const handleRenameFile = async (fileId, name) => {
        const lang = getLanguageByFilename(name);
        await updateFile(fileId, { name, language: lang.id });
        setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, name, language: lang.id } : f)));
        broadcast('file:updated', { file: { id: fileId, name, language: lang.id } });
    };

    const handleContentSaved = (fileId, content) => {
        setFiles(prev => prev.map(f => (f.id === fileId ? { ...f, content } : f)));
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

    const handleVisibilityChange = async visibility => {
        await updateBin(binId, { visibility });
        if (visibility === VISIBILITY.PRIVATE) {
            clearCollaborators(binId).catch(() => {});
            broadcast('bin:kick', {});
        }
        setBin(prev => ({ ...prev, visibility }));
        broadcast('bin:updated', { visibility });
    };

    const handlePackagesChange = useCallback(packages => {
        setBin(prev => ({ ...prev, packages }));
    }, []);

    const handleShare = async () => {
        await permanentizeBin(binId);
        $hasBeenSaved.current = true;
        const shareUrl = `${window.location.origin}/editor/${binId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success(t('editor.bin_header.share_copied'));
    };

    if (isLoading) {
        return (
            <Layout>
                <div className='relative flex h-full items-center justify-center'>
                    <CoffeeLoader className='absolute-center z-1 size-64' />
                    <FlickeringGrid />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className='flex h-full flex-col overflow-hidden'>
                <BinHeader
                    bin={bin}
                    activeFile={activeFile}
                    files={files}
                    isAuthor={isAuthor || isAdmin}
                    isAdmin={isAdmin && !isAuthor}
                    isOwner={isAuthor || isAdmin}
                    onTitleChange={handleTitleChange}
                    onReadonlyToggle={handleReadonlyToggle}
                    onVisibilityChange={handleVisibilityChange}
                    onShare={handleShare}
                />
                <TabBar
                    files={files}
                    activeFileId={activeFileId}
                    isReadonly={isGuestReadonly}
                    peers={peers}
                    user={user}
                    runner={runner}
                    showRunner={showRunner}
                    onToggleRunner={() => setShowRunner(prev => !prev)}
                    onTabChange={setActiveFileId}
                    onCreateFile={handleCreateFile}
                    onDeleteFile={handleDeleteFile}
                    onRenameFile={handleRenameFile}
                    onReorderFiles={handleReorderFiles}
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
                        revealPosition={pendingReveal}
                        onRevealed={() => setPendingReveal(null)}
                        onUndoManagerReady={handleUndoManagerReady}
                        onFirstSave={handleFirstSave}
                        onSaveStatusChange={setSaveStatus}
                        onCursorChange={handleEditorCursorChange}
                        onSelectionChange={handleEditorSelectionChange}
                        onLanguageChange={handleLanguageChange}
                        onCreateFile={handleCreateFile}
                        onContentSaved={content => handleContentSaved(activeFileId, content)}
                        runner={runner}
                        showRunner={showRunner}
                        onCloseRunner={() => setShowRunner(false)}
                        packages={binPackages}
                    />
                )}

                <PackagesDrawer
                    binId={binId}
                    packages={binPackages}
                    onPackagesChange={handlePackagesChange}
                />
            </div>
        </Layout>
    );
};

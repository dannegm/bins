import * as Y from 'yjs';
import { settings } from './settings';
import { supabase } from './supabase';

const docCache = new Map();
const RECONNECT_DELAY_MS = 2000;

export const initYDoc = (binId, fileId, initialContent = '') => {
    const cacheKey = `${binId}:${fileId}`;

    if (docCache.has(cacheKey)) {
        return docCache.get(cacheKey);
    }

    const clientId = settings.get('user.uuid');
    const yDoc = new Y.Doc();
    const yText = yDoc.getText('content');

    let synced = false;
    let isDestroyed = false;
    let initTimer = null;
    let reconnectTimer = null;
    let onReadyCallback = null;
    let channelStatusCallback = null;
    let lastChannelStatus = 'connecting';
    let channel = null;

    const markReady = () => {
        if (synced || isDestroyed) return;
        synced = true;
        onReadyCallback?.();
    };

    const notifyChannelStatus = status => {
        lastChannelStatus = status;
        channelStatusCallback?.(status);
    };

    const handleYjsUpdate = ({ payload }) => {
        if (isDestroyed || payload.sender === clientId) return;
        Y.applyUpdate(yDoc, new Uint8Array(payload.update), 'remote');
    };

    const handleSyncRequest = ({ payload }) => {
        if (isDestroyed || payload.sender === clientId) return;
        const state = Y.encodeStateAsUpdate(yDoc);
        channel?.send({
            type: 'broadcast',
            event: 'yjs:sync-response',
            payload: { state: Array.from(state), sender: clientId },
        });
    };

    const handleSyncResponse = ({ payload }) => {
        if (isDestroyed || payload.sender === clientId) return;
        clearTimeout(initTimer);
        Y.applyUpdate(yDoc, new Uint8Array(payload.state), 'remote');
        markReady();
    };

    const initChannel = () => {
        channel = supabase()
            .channel(`bin:${binId}:file:${fileId}`, {
                config: { broadcast: { self: false } },
            })
            .on('broadcast', { event: 'yjs:update' }, handleYjsUpdate)
            .on('broadcast', { event: 'yjs:sync-request' }, handleSyncRequest)
            .on('broadcast', { event: 'yjs:sync-response' }, handleSyncResponse)
            .subscribe(status => {
                if (isDestroyed) return;

                if (status === 'SUBSCRIBED') {
                    notifyChannelStatus('connected');
                    channel.send({
                        type: 'broadcast',
                        event: 'yjs:sync-request',
                        payload: { sender: clientId },
                    });
                    initTimer = setTimeout(() => {
                        if (!synced && initialContent) {
                            yDoc.transact(() => {
                                yText.insert(0, initialContent);
                            }, 'init');
                        }
                        markReady();
                    }, 300);
                } else if (
                    status === 'CHANNEL_ERROR' ||
                    status === 'TIMED_OUT' ||
                    status === 'CLOSED'
                ) {
                    notifyChannelStatus('reconnecting');
                    clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(() => {
                        if (isDestroyed) return;
                        channel.unsubscribe();
                        initChannel();
                    }, RECONNECT_DELAY_MS);
                }
            });
    };

    initChannel();

    const undoManager = new Y.UndoManager(yText, {
        trackedOrigins: new Set([clientId]),
    });

    yDoc.on('update', (update, origin) => {
        if (isDestroyed || origin === 'init' || origin === 'remote') return;
        channel?.send({
            type: 'broadcast',
            event: 'yjs:update',
            payload: { update: Array.from(update), sender: clientId },
        });
    });

    const destroy = () => {
        isDestroyed = true;
        clearTimeout(initTimer);
        clearTimeout(reconnectTimer);
        undoManager.destroy();
        channel?.unsubscribe();
        yDoc.destroy();
        docCache.delete(cacheKey);
    };

    const onReady = callback => {
        onReadyCallback = callback;
        if (synced) callback();
    };

    const onChannelStatus = callback => {
        channelStatusCallback = callback;
        if (callback) callback(lastChannelStatus);
    };

    const ctx = { yDoc, yText, undoManager, clientId, destroy, onReady, onChannelStatus };
    docCache.set(cacheKey, ctx);
    return ctx;
};

export const destroyYDoc = (binId, fileId) => {
    docCache.get(`${binId}:${fileId}`)?.destroy();
};

export const destroyAllYDocs = binId => {
    const keys = [...docCache.keys()].filter(k => k.startsWith(`${binId}:`));
    keys.forEach(k => docCache.get(k)?.destroy());
};

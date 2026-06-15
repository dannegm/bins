import * as Y from 'yjs';
import { settings } from './settings';
import { supabase } from './supabase';

export const initYDoc = (binId, fileId, initialContent = '') => {
    const clientId = settings.get('user.uuid');
    const yDoc = new Y.Doc();
    const yText = yDoc.getText('content');

    if (initialContent) {
        yDoc.transact(() => {
            yText.insert(0, initialContent);
        }, 'init');
    }

    const undoManager = new Y.UndoManager(yText, {
        trackedOrigins: new Set([clientId]),
    });

    const channel = supabase()
        .channel(`bin:${binId}:file:${fileId}`, {
            config: { broadcast: { self: false } },
        })
        .on('broadcast', { event: 'yjs:update' }, ({ payload }) => {
            if (payload.sender === clientId) return;
            Y.applyUpdate(yDoc, new Uint8Array(payload.update), 'remote');
        })
        .on('broadcast', { event: 'yjs:sync-request' }, ({ payload }) => {
            if (payload.sender === clientId) return;
            const state = Y.encodeStateAsUpdate(yDoc);
            channel.send({
                type: 'broadcast',
                event: 'yjs:sync-response',
                payload: { state: Array.from(state), sender: clientId },
            });
        })
        .on('broadcast', { event: 'yjs:sync-response' }, ({ payload }) => {
            if (payload.sender === clientId) return;
            Y.applyUpdate(yDoc, new Uint8Array(payload.state), 'remote');
        })
        .subscribe(status => {
            if (status !== 'SUBSCRIBED') return;
            setTimeout(() => {
                channel.send({
                    type: 'broadcast',
                    event: 'yjs:sync-request',
                    payload: { sender: clientId },
                });
            }, 150);
        });

    yDoc.on('update', (update, origin) => {
        if (origin === 'init' || origin === 'remote') return;
        channel.send({
            type: 'broadcast',
            event: 'yjs:update',
            payload: { update: Array.from(update), sender: clientId },
        });
    });

    const destroy = () => {
        undoManager.destroy();
        channel.unsubscribe();
        yDoc.destroy();
    };

    return { yDoc, yText, undoManager, clientId, destroy };
};

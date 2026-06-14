import {
    push,
    subscribe as ntfySubscribe,
    buildCommand as ntfyBuild,
    parseCommand as ntfyParse,
} from '@/services/ntfy';

import { settings } from '@/services/settings';

const PREFIX = 'command:';

const splitTo = raw => {
    const match = raw.match(/^([\s\S]+?)\|to\[([^\]]*)\]$/);
    if (!match) return { commandStr: raw, to: null };
    return {
        commandStr: match[1],
        to: match[2].split(',').filter(Boolean),
    };
};

export const parseCommand = raw => {
    const { commandStr, to } = splitTo(raw);
    const parsed = ntfyParse(commandStr);
    if (!parsed || !parsed.name.startsWith(PREFIX)) return null;
    return { name: parsed.name.slice(PREFIX.length), params: parsed.params, to };
};

export const buildCommand = (name, params, toUuids) => {
    const base = ntfyBuild(`${PREFIX}${name}`, params ?? {});
    return toUuids?.length ? `${base}|to[${toUuids.join(',')}]` : base;
};

export const sendCommand = (name, params) => push(buildCommand(name, params));

export const sendCommandTo = (uuids, name, params) => push(buildCommand(name, params, uuids));

export const onCommand = (name, handler) =>
    ntfySubscribe(message => {
        const parsed = parseCommand(message);
        if (!parsed || parsed.name !== name) return;
        if (parsed.to && !parsed.to.includes(settings.get('user.uuid'))) return;
        handler(parsed.params);
    });

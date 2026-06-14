import { useEffect, useRef } from 'react';

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

// Use e.code for keys that shift-transform (e.g. Shift+[ → { on Mac)
const KEY_CODE_MAP = {
    // Navigation
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    PageUp: 'pageup',
    PageDown: 'pagedown',
    Home: 'home',
    End: 'end',
    Insert: 'insert',
    // Action
    Space: 'space',
    Enter: 'enter',
    Escape: 'escape',
    Backspace: 'backspace',
    Delete: 'delete',
    Tab: 'tab',
    Clear: 'clear',
    // Function keys (F1–F19)
    ...Object.fromEntries(Array.from({ length: 19 }, (_, i) => [`F${i + 1}`, `f${i + 1}`])),
    // Punctuation (shift-transforms on some platforms)
    BracketLeft: '[',
    BracketRight: ']',
    Comma: ',',
    Period: '.',
    Slash: '/',
    Backslash: '\\',
    Semicolon: ';',
    Quote: "'",
    Backquote: '`',
    Minus: '-',
    Equal: '=',
};

// Aliases matching react-hotkeys-hook conventions
const KEY_ALIASES = {
    esc: 'escape',
    return: 'enter',
    del: 'delete',
};

const normalizeKeys = keyStr =>
    keyStr
        .toLowerCase()
        .trim()
        .split('+')
        .map(part => KEY_ALIASES[part] ?? part)
        .join('+');

const getEventKey = e => {
    if (KEY_CODE_MAP[e.code] !== undefined) return KEY_CODE_MAP[e.code];
    if (e.code.startsWith('Key')) return e.code.slice(3).toLowerCase();
    if (e.code.startsWith('Digit')) return e.code.slice(5);
    return e.key.toLowerCase();
};

export const normalizeEvent = e => {
    const parts = [];
    // mod = platform primary modifier (Cmd on Mac, Ctrl on Windows)
    if (isMac ? e.metaKey : e.ctrlKey) parts.push('mod');
    if (isMac && e.ctrlKey) parts.push('ctrl');
    if (!isMac && e.metaKey) parts.push('meta');
    if (e.altKey) parts.push('alt');
    if (e.shiftKey) parts.push('shift');
    if (!['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) {
        parts.push(getEventKey(e));
    }
    return parts.join('+');
};

export const formatBinding = raw => {
    if (!raw) return [];
    return raw.split('+').map(part => {
        if (part === 'mod') return isMac ? '⌘' : 'Ctrl';
        if (part === 'ctrl') return 'Ctrl';
        if (part === 'meta') return '⌘';
        if (part === 'alt') return isMac ? '⌥' : 'Alt';
        if (part === 'shift') return '⇧';
        return part.toUpperCase();
    });
};

export const useHotkey = (keys, handler, options = {}) => {
    const { enabled = true, enableOnFormElements = false } = options;
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        if (!enabled || !keys) return;

        const normalized = normalizeKeys(keys);

        const onKey = e => {
            if (!enableOnFormElements) {
                const tag = e.target?.tagName;
                const isEditable = e.target?.isContentEditable;
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isEditable) return;
            }
            if (normalizeEvent(e) !== normalized) return;
            e.preventDefault();
            handlerRef.current(e);
        };

        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [keys, enabled, enableOnFormElements]);
};

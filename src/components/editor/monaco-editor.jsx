import { useEffect, useRef, useCallback } from 'react';
import * as monaco from 'monaco-editor';
import { desaturate, parseToRgb } from 'polished';
import {
    initMonacoWorkers,
    defineEditorThemes,
    registerCustomLanguages,
    getHttpVerbRules,
} from '@/helpers/monaco';
import { useSettings } from '@/hooks/use-settings';
import { useIdentity } from '@/hooks/use-identity';
import { useTheme } from '@/providers/theme-provider';
import { useAiCompletions } from '@/hooks/use-ai-completions';
import { getLanguage } from '@/constants/languages';
import { MONACO_THEMES } from '@/constants/themes';
import { useListener, useEvents } from '@/providers/bus-provider';

const toHex = color => {
    try {
        const { red, green, blue } = parseToRgb(color);
        return '#' + [red, green, blue].map(v => v.toString(16).padStart(2, '0')).join('');
    } catch {
        return color;
    }
};

const contrastColor = color => {
    try {
        const { red, green, blue } = parseToRgb(color);
        const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
        return luminance > 0.5 ? '#000' : '#fff';
    } catch {
        return '#fff';
    }
};

initMonacoWorkers();
defineEditorThemes();
registerCustomLanguages();

export const MonacoEditor = ({
    yText,
    clientId,
    language = 'markdown',
    readOnly = false,
    peers = [],
    revealPosition,
    onRevealed,
    onSave,
    onCursorChange,
    onSelectionChange,
    onEditorReady,
    onSearch,
}) => {
    useAiCompletions();

    const { emit } = useEvents();
    const $container = useRef(null);
    const $editor = useRef(null);
    const $isApplyingRemote = useRef(false);
    const $decorations = useRef(null);
    const $strudelDecorations = useRef(null);
    const $revealRef = useRef(revealPosition);
    $revealRef.current = revealPosition;

    const [fontSize] = useSettings('fontSize');
    const [wordWrap] = useSettings('wordWrap');
    const [lineNumbers] = useSettings('lineNumbers');
    const [minimap] = useSettings('minimap');
    const [monacoTheme] = useSettings('monacoTheme');
    const [prettier] = useSettings('prettier');
    const { user } = useIdentity();
    const { isDark } = useTheme();

    useEffect(() => {
        if (!$container.current) return;

        const langDef = getLanguage(language);
        const themeId =
            monacoTheme === 'light'
                ? 'bins-light'
                : monacoTheme === 'dracula'
                  ? 'bins-dracula'
                  : 'bins-dark';

        const editor = monaco.editor.create($container.current, {
            value: '',
            language: langDef.monacoId,
            theme: themeId,
            fontSize,
            tabSize: prettier?.tabWidth ?? 4,
            insertSpaces: !(prettier?.useTabs ?? false),
            rulers: [
                { column: prettier?.printWidth ?? 100, color: isDark ? '#ffffff18' : '#00000018' },
            ],
            wordWrap: wordWrap ? 'on' : 'off',
            lineNumbers: lineNumbers ? 'on' : 'off',
            minimap: { enabled: minimap },
            fontFamily: '"JetBrains Mono", monospace',
            fontLigatures: true,
            fontWeight: '200',
            automaticLayout: true,
            readOnly,
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'all',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            contextmenu: true,
            stickyScroll: { enabled: false },
            formatOnPaste: false,
            find: { autoFindInSelection: 'never' },
            inlineSuggest: { enabled: true },
        });

        $editor.current = editor;
        $decorations.current = editor.createDecorationsCollection([]);
        $strudelDecorations.current = editor.createDecorationsCollection([]);
        onEditorReady?.(editor);

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => onSave?.());
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => onSearch?.());

        editor.onDidChangeCursorSelection(e => {
            const pos = e.selection.getPosition();
            onCursorChange?.({ lineNumber: pos.lineNumber, column: pos.column });
            const sel = e.selection;
            const selection = {
                startLineNumber: sel.startLineNumber,
                startColumn: sel.startColumn,
                endLineNumber: sel.endLineNumber,
                endColumn: sel.endColumn,
            };
            onSelectionChange?.(sel.isEmpty() ? null : selection);
        });

        editor.onDidFocusEditorWidget(e => {
            emit('editor:focus', e);
        });
        editor.onDidBlurEditorWidget(e => {
            emit('editor:blur', e);
        });

        return () => {
            editor.dispose();
            $editor.current = null;
            $decorations.current = null;
            $strudelDecorations.current = null;
        };
    }, []);

    useEffect(() => {
        if (!$editor.current) return;
        const langDef = getLanguage(language);
        const model = $editor.current.getModel();
        if (model) monaco.editor.setModelLanguage(model, langDef.monacoId);
    }, [language]);

    useEffect(() => {
        if (!$editor.current) return;
        $editor.current.updateOptions({
            fontSize,
            tabSize: prettier?.tabWidth ?? 4,
            insertSpaces: !(prettier?.useTabs ?? false),
            wordWrap: wordWrap ? 'on' : 'off',
            lineNumbers: lineNumbers ? 'on' : 'off',
            minimap: { enabled: minimap },
        });
    }, [fontSize, prettier?.tabWidth, prettier?.useTabs, wordWrap, lineNumbers, minimap]);

    useEffect(() => {
        if (!$editor.current) return;
        $editor.current.updateOptions({
            rulers: [
                { column: prettier?.printWidth ?? 100, color: isDark ? '#ffffff18' : '#00000018' },
            ],
        });
    }, [prettier?.printWidth, isDark]);

    useEffect(() => {
        if (!$editor.current) return;
        $editor.current.updateOptions({ readOnly });
    }, [readOnly]);

    useEffect(() => {
        const userColor = isDark ? user?.colorDark : user?.colorLight;
        const baseTheme = MONACO_THEMES.find(t => t.id === monacoTheme);
        if (!baseTheme || !userColor) return;

        const hex = toHex(userColor);
        const selHex = toHex(desaturate(0.25, userColor));

        const themeId = `bins-${monacoTheme}-user`;
        const httpVerbRules = getHttpVerbRules(baseTheme.isDark);
        monaco.editor.defineTheme(themeId, {
            ...baseTheme.definition,
            rules: [...baseTheme.definition.rules, ...httpVerbRules],
            colors: {
                ...baseTheme.definition.colors,
                'editorCursor.foreground': hex,
                'editor.lineHighlightBackground': `${hex}33`,
                'editor.lineHighlightBorder': '#00000000',
                'editor.selectionBackground': `${selHex}55`,
                'editor.inactiveSelectionBackground': `${selHex}33`,
                'editor.selectionHighlightBackground': `${selHex}30`,
            },
        });
        monaco.editor.setTheme(themeId);
    }, [monacoTheme, user?.colorDark, user?.colorLight, isDark]);

    useEffect(() => {
        let style = document.getElementById('peer-cursors-style');
        if (!style) {
            style = document.createElement('style');
            style.id = 'peer-cursors-style';
            document.head.appendChild(style);
        }

        style.textContent = peers
            .map(peer => {
                const id = peer.uuid.slice(0, 8);
                const rawColor = isDark ? peer.colorDark : peer.colorLight;
                if (!rawColor) return '';
                const color = toHex(rawColor);
                const selColor = toHex(desaturate(0.2, rawColor));
                const safeName = peer.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
                const labelColor = contrastColor(rawColor);
                return `
                    .peer-cursor-${id} { position: relative; }
                    .peer-cursor-${id}::before {
                        content: '';
                        display: inline-block;
                        width: 2px;
                        height: 1.1em;
                        background: ${color};
                        margin-left: -1px;
                        vertical-align: text-bottom;
                    }
                    .peer-cursor-${id}::after {
                        content: '${safeName}';
                        position: absolute;
                        bottom: 100%;
                        left: -1px;
                        background: ${color};
                        color: ${labelColor};
                        padding: 1px 6px 2px;
                        border-radius: 3px 3px 3px 0;
                        font-size: 10px;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        font-weight: 500;
                        white-space: nowrap;
                        line-height: 1.5;
                        opacity: 0;
                        pointer-events: none;
                        transition: opacity 0.1s ease;
                        z-index: 9999;
                    }
                    .peer-cursor-${id}:hover::after { opacity: 1; }
                    .peer-line-${id} { background: ${color}26 !important; }
                    .peer-selection-${id} { background: ${selColor}44 !important; }
                `;
            })
            .join('');

        if ($decorations.current) {
            $decorations.current.set(
                peers.flatMap(peer => {
                    if (!peer.cursor) return [];
                    const { lineNumber, column } = peer.cursor;
                    const id = peer.uuid.slice(0, 8);
                    const decs = [
                        {
                            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
                            options: { isWholeLine: true, className: `peer-line-${id}` },
                        },
                        {
                            range: new monaco.Range(lineNumber, column, lineNumber, column),
                            options: { beforeContentClassName: `peer-cursor-${id}` },
                        },
                    ];
                    if (peer.selection) {
                        const { startLineNumber, startColumn, endLineNumber, endColumn } =
                            peer.selection;
                        decs.push({
                            range: new monaco.Range(
                                startLineNumber,
                                startColumn,
                                endLineNumber,
                                endColumn,
                            ),
                            options: { className: `peer-selection-${id}` },
                        });
                    }
                    return decs;
                }),
            );
        }
    }, [peers, isDark]);

    useEffect(() => {
        if (!$editor.current || !revealPosition) return;
        $editor.current.revealPositionInCenter(revealPosition);
        onRevealed?.();
    }, [revealPosition]);

    useEffect(() => {
        if (!$editor.current || !yText) return;

        const editor = $editor.current;
        const model = editor.getModel();

        $isApplyingRemote.current = true;
        model.setValue(yText.toString());
        if ($revealRef.current) {
            editor.revealPositionInCenter($revealRef.current);
            onRevealed?.();
        }
        setTimeout(() => {
            $isApplyingRemote.current = false;
        }, 0);

        const disposable = editor.onDidChangeModelContent(event => {
            if ($isApplyingRemote.current) return;

            yText.doc.transact(() => {
                for (const change of event.changes) {
                    if (change.rangeLength > 0)
                        yText.delete(change.rangeOffset, change.rangeLength);
                    if (change.text.length > 0) yText.insert(change.rangeOffset, change.text);
                }
            }, clientId);
        });

        const observer = event => {
            if (event.transaction.origin === clientId || event.transaction.origin === 'init')
                return;

            $isApplyingRemote.current = true;
            const edits = [];
            let index = 0;

            for (const op of event.delta) {
                if (op.retain !== undefined) {
                    index += op.retain;
                } else if (op.delete !== undefined) {
                    const start = model.getPositionAt(index);
                    const end = model.getPositionAt(index + op.delete);
                    edits.push({
                        range: new monaco.Range(
                            start.lineNumber,
                            start.column,
                            end.lineNumber,
                            end.column,
                        ),
                        text: '',
                    });
                    index += op.delete;
                } else if (op.insert !== undefined) {
                    const pos = model.getPositionAt(index);
                    edits.push({
                        range: new monaco.Range(
                            pos.lineNumber,
                            pos.column,
                            pos.lineNumber,
                            pos.column,
                        ),
                        text: op.insert,
                    });
                }
            }

            if (edits.length > 0) model.applyEdits(edits);
            setTimeout(() => {
                $isApplyingRemote.current = false;
            }, 0);
        };

        yText.observe(observer);

        return () => {
            disposable.dispose();
            yText.unobserve(observer);
        };
    }, [yText, clientId]);

    useListener(
        'editor:format',
        useCallback(() => {
            $editor.current?.getAction('editor.action.formatDocument')?.run();
        }, []),
    );

    useListener(
        'editor:goto-line',
        useCallback(({ line }) => {
            if (!$editor.current) return;
            $editor.current.revealLineInCenter(line);
            $editor.current.setPosition({ lineNumber: line, column: 1 });
            $editor.current.focus();
        }, []),
    );

    useListener(
        'strudel:highlight',
        useCallback(locations => {
            const dec = $strudelDecorations.current;
            const model = $editor.current?.getModel();
            if (!dec || !model) return;
            dec.set(
                locations.map(({ start, end }) => {
                    const s = model.getPositionAt(start);
                    const e = model.getPositionAt(end);
                    return {
                        range: new monaco.Range(s.lineNumber, s.column, e.lineNumber, e.column),
                        options: { inlineClassName: 'strudel-active' },
                    };
                }),
            );
        }, []),
    );

    return <div ref={$container} className='h-full w-full min-w-0 overflow-hidden select-text' />;
};

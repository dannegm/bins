import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { initMonacoWorkers } from '@/helpers/monaco';
import { useSettings } from '@/hooks/use-settings';
import { getLanguage } from '@/constants/languages';

initMonacoWorkers();

export const MonacoEditor = ({ yText, clientId, language = 'markdown', readOnly = false, onCursorChange, onEditorReady }) => {
    const $container = useRef(null);
    const $editor = useRef(null);
    const $isApplyingRemote = useRef(false);

    const [fontSize] = useSettings('fontSize');
    const [tabSize] = useSettings('tabSize');
    const [wordWrap] = useSettings('wordWrap');
    const [lineNumbers] = useSettings('lineNumbers');
    const [minimap] = useSettings('minimap');
    const [monacoTheme] = useSettings('monacoTheme');

    useEffect(() => {
        if (!$container.current) return;

        const langDef = getLanguage(language);
        const themeId = monacoTheme === 'light' ? 'vs' : 'vs-dark';

        const editor = monaco.editor.create($container.current, {
            value: '',
            language: langDef.monacoId,
            theme: themeId,
            fontSize,
            tabSize,
            wordWrap: wordWrap ? 'on' : 'off',
            lineNumbers: lineNumbers ? 'on' : 'off',
            minimap: { enabled: minimap },
            fontFamily: '"JetBrains Mono", monospace',
            fontLigatures: true,
            automaticLayout: true,
            readOnly,
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'all',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            contextmenu: true,
            formatOnPaste: false,
            find: { autoFindInSelection: 'never' },
        });

        $editor.current = editor;
        onEditorReady?.(editor);

        editor.onDidChangeCursorPosition(e => {
            onCursorChange?.({
                lineNumber: e.position.lineNumber,
                column: e.position.column,
            });
        });

        return () => {
            editor.dispose();
            $editor.current = null;
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
            tabSize,
            wordWrap: wordWrap ? 'on' : 'off',
            lineNumbers: lineNumbers ? 'on' : 'off',
            minimap: { enabled: minimap },
        });
    }, [fontSize, tabSize, wordWrap, lineNumbers, minimap]);

    useEffect(() => {
        if (!$editor.current) return;
        $editor.current.updateOptions({ readOnly });
    }, [readOnly]);

    useEffect(() => {
        if (!$editor.current) return;
        const themeId = monacoTheme === 'light' ? 'vs' : 'vs-dark';
        monaco.editor.setTheme(themeId);
    }, [monacoTheme]);

    useEffect(() => {
        if (!$editor.current || !yText) return;

        const editor = $editor.current;
        const model = editor.getModel();

        $isApplyingRemote.current = true;
        model.setValue(yText.toString());
        setTimeout(() => { $isApplyingRemote.current = false; }, 0);

        const disposable = editor.onDidChangeModelContent(event => {
            if ($isApplyingRemote.current) return;

            yText.doc.transact(() => {
                for (const change of event.changes) {
                    if (change.rangeLength > 0) yText.delete(change.rangeOffset, change.rangeLength);
                    if (change.text.length > 0) yText.insert(change.rangeOffset, change.text);
                }
            }, clientId);
        });

        const observer = event => {
            if (event.transaction.origin === clientId || event.transaction.origin === 'init') return;

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
                        range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
                        text: '',
                    });
                    index += op.delete;
                } else if (op.insert !== undefined) {
                    const pos = model.getPositionAt(index);
                    edits.push({
                        range: new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column),
                        text: op.insert,
                    });
                }
            }

            if (edits.length > 0) model.applyEdits(edits);
            setTimeout(() => { $isApplyingRemote.current = false; }, 0);
        };

        yText.observe(observer);

        return () => {
            disposable.dispose();
            yText.unobserve(observer);
        };
    }, [yText, clientId]);

    return <div ref={$container} className='h-full w-full' />;
};

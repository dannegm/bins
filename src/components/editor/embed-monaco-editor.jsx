import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { initMonacoWorkers, defineEditorThemes, registerCustomLanguages } from '@/helpers/monaco';
import { useSettings } from '@/hooks/use-settings';
import { useEmbedTheme } from '@/providers/embed-theme-provider';
import { getLanguage } from '@/constants/languages';
import { MONACO_THEMES } from '@/constants/themes';

initMonacoWorkers();
defineEditorThemes();
registerCustomLanguages();

export const EmbedMonacoEditor = ({ content = '', language = 'plaintext' }) => {
    const $container = useRef(null);
    const $editor = useRef(null);

    const [fontSize] = useSettings('fontSize');
    const [wordWrap] = useSettings('wordWrap');
    const [lineNumbers] = useSettings('lineNumbers');
    const [minimap] = useSettings('minimap');
    const [prettier] = useSettings('prettier');
    const monacoTheme = useEmbedTheme();

    useEffect(() => {
        if (!$container.current) return;

        const langDef = getLanguage(language);
        const theme = MONACO_THEMES.find(t => t.id === monacoTheme) ?? MONACO_THEMES[1];

        const editor = monaco.editor.create($container.current, {
            value: content,
            language: langDef.monacoId,
            theme: `bins-${theme.id}`,
            fontSize,
            tabSize: prettier?.tabWidth ?? 4,
            insertSpaces: !(prettier?.useTabs ?? false),
            wordWrap: wordWrap ? 'on' : 'off',
            lineNumbers: lineNumbers ? 'on' : 'off',
            minimap: { enabled: minimap },
            fontFamily: '"JetBrains Mono", monospace',
            fontLigatures: true,
            fontWeight: '200',
            automaticLayout: true,
            readOnly: true,
            scrollBeyondLastLine: false,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'none',
            smoothScrolling: true,
            contextmenu: false,
            stickyScroll: { enabled: false },
            find: { autoFindInSelection: 'never' },
            inlineSuggest: { enabled: false },
        });

        $editor.current = editor;

        return () => {
            editor.dispose();
            $editor.current = null;
        };
    }, []);

    useEffect(() => {
        if (!$editor.current) return;
        const model = $editor.current.getModel();
        if (model && model.getValue() !== content) model.setValue(content);
    }, [content]);

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
    }, [fontSize, wordWrap, lineNumbers, minimap, prettier?.tabWidth, prettier?.useTabs]);

    useEffect(() => {
        if (!$editor.current) return;
        const theme = MONACO_THEMES.find(t => t.id === monacoTheme) ?? MONACO_THEMES[1];
        monaco.editor.setTheme(`bins-${theme.id}`);
    }, [monacoTheme]);

    return <div ref={$container} className='h-full w-full min-w-0 overflow-hidden select-text' />;
};

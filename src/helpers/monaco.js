import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

export const defineEditorThemes = () => {
    monaco.editor.defineTheme('bins-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.lineHighlightBackground': '#ffffff0f',
            'editor.lineHighlightBorder': '#00000000',
        },
    });

    monaco.editor.defineTheme('bins-light', {
        base: 'vs',
        inherit: true,
        rules: [],
        colors: {
            'editor.lineHighlightBackground': '#0000000a',
            'editor.lineHighlightBorder': '#00000000',
        },
    });

    monaco.editor.defineTheme('bins-dracula', {
        base: 'vs-dark',
        inherit: true,
        rules: [],
        colors: {
            'editor.background': '#282a36',
            'editor.foreground': '#f8f8f2',
            'editor.lineHighlightBackground': '#44475a80',
            'editor.lineHighlightBorder': '#00000000',
        },
    });
};

export const initMonacoWorkers = () => {
    self.MonacoEnvironment = {
        getWorker(_, label) {
            if (label === 'json') return new jsonWorker();
            if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
            if (label === 'html' || label === 'handlebars' || label === 'razor')
                return new htmlWorker();
            if (label === 'typescript' || label === 'javascript') return new tsWorker();
            return new editorWorker();
        },
    };
};

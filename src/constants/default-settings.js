export const defaultSettings = {
    user: {
        uuid: null,
        name: null,
        colorLight: null,
        colorDark: null,
    },

    language: 'en',
    uiTheme: 'dark',
    monacoTheme: 'dark',

    fontSize: 14,
    tabSize: 2,
    wordWrap: false,
    lineNumbers: true,
    minimap: false,

    searchWidget: { x: 0, y: 0 },
    runnerPanel: { size: 40 },

    tipsEnabled: true,

    aiCompletions: {
        enabled: false,
        provider: 'ollama',
        apiKey: '',
        baseUrl: 'http://localhost:11434',
        model: '',
    },

    keybindings: {
        command_palette: 'cmd+k',
        settings: 'cmd+,',
        new_bin: 'cmd+n',
        new_file: 'cmd+shift+n',
        prev_tab: 'cmd+shift+[',
        next_tab: 'cmd+shift+]',
        copy_link: 'cmd+shift+c',
        toggle_runner: 'opt+shift+r',
        format_code: 'opt+shift+f',
        word_wrap: 'opt+shift+w',
        redo: 'cmd+y',
    },

    prettier: {
        printWidth: 100,
        tabWidth: 4,
        useTabs: false,
        semi: true,
        singleQuote: true,
        trailingComma: 'all',
        bracketSpacing: true,
        arrowParens: 'avoid',
        jsxSingleQuote: true,
    },
};

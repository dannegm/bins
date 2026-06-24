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
    runnerPanel: { layouts: {} },

    tipsEnabled: true,
    binView: {
        myBins: 'grid',
        sharedBins: 'grid',
        profileBins: 'grid',
        profileSharedBins: 'grid',
    },

    favoritePackages: [],

    aiCompletions: {
        enabled: false,
        provider: 'ollama',
        apiKey: '',
        baseUrl: 'http://localhost:11434',
        model: '',
    },

    appKeybindings: {
        command_palette: 'mod+shift+p',
        settings: 'mod+,',
        new_bin: 'alt+n',
        new_file: 'alt+shift+n',
        prev_tab: 'mod+shift+[',
        next_tab: 'mod+shift+]',
        copy_link: 'mod+shift+c',
        toggle_runner: 'alt+shift+r',
        format_code: 'alt+shift+f',
    },

    monacoKeybindings: {
        redo: 'mod+y',
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

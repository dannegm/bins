export const UI_THEMES = [
    { id: 'light', label: 'Light', isDark: false },
    { id: 'dark', label: 'Dark', isDark: true },
    { id: 'dracula', label: 'Dracula', isDark: true },
];

export const MONACO_THEMES = [
    {
        id: 'light',
        label: 'Light',
        isDark: false,
        preview: {
            bg: '#ffffff',
            keyword: '#0000ff',
            string: '#a31515',
            comment: '#008000',
            text: '#000000',
        },
        definition: {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.lineHighlightBackground': '#0000000a',
                'editor.lineHighlightBorder': '#00000000',
            },
        },
    },
    {
        id: 'dark',
        label: 'Dark',
        isDark: true,
        preview: {
            bg: '#1e1e1e',
            keyword: '#569cd6',
            string: '#ce9178',
            comment: '#6a9955',
            text: '#d4d4d4',
        },
        definition: {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.lineHighlightBackground': '#ffffff0f',
                'editor.lineHighlightBorder': '#00000000',
            },
        },
    },
    {
        id: 'dracula',
        label: 'Dracula',
        isDark: true,
        preview: {
            bg: '#282a36',
            keyword: '#ff79c6',
            string: '#f1fa8c',
            comment: '#6272a4',
            text: '#f8f8f2',
        },
        definition: {
            base: 'vs-dark',
            inherit: false,
            rules: [
                { token: '', foreground: 'f8f8f2', background: '282a36' },

                // Comments
                { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
                { token: 'comment.doc', foreground: '6272a4', fontStyle: 'italic' },

                // Keywords
                { token: 'keyword', foreground: 'ff79c6' },
                { token: 'keyword.control', foreground: 'ff79c6' },
                { token: 'keyword.operator', foreground: 'ff79c6' },
                { token: 'keyword.other', foreground: 'ff79c6' },
                { token: 'storage', foreground: 'ff79c6' },
                { token: 'storage.type', foreground: '8be9fd', fontStyle: 'italic' },
                { token: 'storage.modifier', foreground: 'ff79c6' },

                // Strings
                { token: 'string', foreground: 'f1fa8c' },
                { token: 'string.escape', foreground: 'ff79c6' },
                { token: 'string.regexp', foreground: 'ff79c6' },

                // Numbers & constants
                { token: 'number', foreground: 'bd93f9' },
                { token: 'constant', foreground: 'bd93f9' },
                { token: 'constant.numeric', foreground: 'bd93f9' },
                { token: 'constant.language', foreground: 'bd93f9' },
                { token: 'constant.character', foreground: 'bd93f9' },
                { token: 'variable.predefined', foreground: 'bd93f9' },

                // Functions & methods
                { token: 'entity.name.function', foreground: '50fa7b' },
                { token: 'support.function', foreground: '50fa7b' },
                { token: 'function', foreground: '50fa7b' },
                { token: 'member', foreground: '50fa7b' },

                // Types & classes
                { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
                { token: 'type.identifier', foreground: '8be9fd', fontStyle: 'italic' },
                { token: 'entity.name.type', foreground: '8be9fd' },
                { token: 'entity.name.class', foreground: '8be9fd' },
                {
                    token: 'entity.other.inherited-class',
                    foreground: '8be9fd',
                    fontStyle: 'italic',
                },
                { token: 'support.class', foreground: '8be9fd' },
                { token: 'support.type', foreground: '8be9fd', fontStyle: 'italic' },
                { token: 'class', foreground: '8be9fd' },
                { token: 'interface', foreground: '8be9fd' },
                { token: 'namespace', foreground: '8be9fd' },

                // Variables & parameters
                { token: 'variable', foreground: 'f8f8f2' },
                { token: 'variable.language', foreground: 'ff79c6' },
                { token: 'variable.parameter', foreground: 'ffb86c', fontStyle: 'italic' },
                { token: 'parameter', foreground: 'ffb86c', fontStyle: 'italic' },

                // Properties
                { token: 'property', foreground: 'f8f8f2' },
                { token: 'entity.other.attribute-name', foreground: '50fa7b' },

                // Operators & punctuation
                { token: 'operator', foreground: 'ff79c6' },
                { token: 'delimiter', foreground: 'f8f8f2' },
                { token: 'punctuation', foreground: 'f8f8f2' },

                // HTML / XML
                { token: 'tag', foreground: 'ff79c6' },
                { token: 'tag.id', foreground: 'ff79c6' },
                { token: 'tag.class', foreground: 'ff79c6' },
                { token: 'metatag', foreground: 'ff79c6' },
                { token: 'metatag.content', foreground: 'f1fa8c' },
                { token: 'attribute.name', foreground: '50fa7b' },
                { token: 'attribute.value', foreground: 'f1fa8c' },
                { token: 'attribute.value.number', foreground: 'bd93f9' },
                { token: 'delimiter.html', foreground: 'f8f8f2' },

                // CSS
                { token: 'attribute.name.css', foreground: '50fa7b' },
                { token: 'attribute.value.css', foreground: 'f1fa8c' },
                { token: 'number.css', foreground: 'bd93f9' },
                { token: 'unit.css', foreground: 'ffb86c' },
                { token: 'selector', foreground: 'ff79c6' },
                { token: 'key.css', foreground: '8be9fd' },

                // Markdown
                { token: 'emphasis', fontStyle: 'italic' },
                { token: 'strong', fontStyle: 'bold' },
                { token: 'keyword.md', foreground: 'ff79c6' },
                { token: 'string.link.md', foreground: '8be9fd' },
            ],
            colors: {
                'editor.background': '#282a36',
                'editor.foreground': '#f8f8f2',
                'editor.lineHighlightBackground': '#44475a80',
                'editor.lineHighlightBorder': '#00000000',
                'editor.selectionBackground': '#44475a',
                'editor.inactiveSelectionBackground': '#44475a80',
                'editor.selectionHighlightBackground': '#44475a60',
                'editorCursor.foreground': '#f8f8f2',
                'editorLineNumber.foreground': '#6272a4',
                'editorLineNumber.activeForeground': '#f8f8f2',
                'editorIndentGuide.background1': '#44475a',
                'editorIndentGuide.activeBackground1': '#6272a4',
                'editorWhitespace.foreground': '#44475a',
                'editorBracketMatch.background': '#44475a',
                'editorBracketMatch.border': '#ff79c6',
                'editorGutter.background': '#282a36',
            },
        },
    },
];

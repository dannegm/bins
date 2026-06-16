export const UI_THEMES = [
    { id: 'light', label: 'Light', isDark: false },
    { id: 'dark', label: 'Dark', isDark: true },
    { id: 'rose-pine-dawn', label: 'Rosé Pine Dawn', isDark: false },
    { id: 'dracula', label: 'Dracula', isDark: true },
    { id: 'tlapalli-quartz', label: 'Tlapalli Quartz', isDark: false },
    { id: 'tlapalli-fire-opal', label: 'Tlapalli Fire Opal', isDark: true },
];

export const THEME_ATTRIBUTIONS = {
    light: { nick: 'shadcn', license: 'MIT', url: 'https://github.com/shadcn-ui/ui' },
    dark: { nick: 'shadcn', license: 'MIT', url: 'https://github.com/shadcn-ui/ui' },
    'rose-pine-dawn': { name: 'Rosé Pine', license: 'MIT', url: 'https://github.com/rose-pine/rose-pine-theme' },
    dracula: { name: 'Dracula Theme', license: 'MIT', url: 'https://github.com/dracula/dracula-theme' },
    'tlapalli-quartz': { nick: 'ackzell', license: 'MIT', url: 'https://github.com/ackzell/tlapalli-vscode-theme' },
    'tlapalli-fire-opal': { nick: 'ackzell', license: 'MIT', url: 'https://github.com/ackzell/tlapalli-vscode-theme' },
};

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
        id: 'rose-pine-dawn',
        label: 'Rosé Pine Dawn',
        isDark: false,
        preview: {
            bg: '#faf4ed',
            keyword: '#286983',
            string: '#ea9d34',
            comment: '#9893a5',
            text: '#575279',
        },
        definition: {
            base: 'vs',
            inherit: false,
            rules: [
                { token: '', foreground: '575279', background: 'faf4ed' },

                // Comments
                { token: 'comment', foreground: '9893a5', fontStyle: 'italic' },

                // Keywords & storage
                { token: 'keyword', foreground: '286983' },
                { token: 'keyword.control', foreground: '286983' },
                { token: 'keyword.operator', foreground: '286983' },
                { token: 'storage', foreground: '286983' },
                { token: 'storage.type', foreground: '286983' },
                { token: 'storage.modifier', foreground: '286983' },

                // Strings
                { token: 'string', foreground: 'ea9d34' },
                { token: 'string.escape', foreground: 'd7827e' },
                { token: 'string.regexp', foreground: 'd7827e' },

                // Numbers & constants
                { token: 'number', foreground: 'd7827e' },
                { token: 'constant', foreground: '286983' },
                { token: 'constant.numeric', foreground: 'd7827e' },
                { token: 'constant.language', foreground: 'd7827e' },

                // Functions
                { token: 'entity.name.function', foreground: 'b4637a', fontStyle: 'italic' },
                { token: 'support.function', foreground: 'b4637a', fontStyle: 'italic' },
                { token: 'function', foreground: 'b4637a' },

                // Types & classes
                { token: 'type', foreground: '56949f' },
                { token: 'type.identifier', foreground: '56949f' },
                { token: 'entity.name.type', foreground: '56949f' },
                { token: 'entity.name.class', foreground: '56949f' },
                { token: 'support.class', foreground: '56949f' },
                { token: 'support.type', foreground: '56949f' },
                { token: 'class', foreground: '56949f' },
                { token: 'interface', foreground: '56949f' },
                { token: 'namespace', foreground: '56949f' },

                // Variables & parameters
                { token: 'variable', foreground: 'd7827e', fontStyle: 'italic' },
                { token: 'variable.language', foreground: '575279' },
                { token: 'variable.parameter', foreground: '907aa9' },
                { token: 'parameter', foreground: '907aa9' },

                // Properties
                { token: 'property', foreground: '575279' },
                { token: 'entity.other.attribute-name', foreground: '907aa9', fontStyle: 'italic' },

                // Operators & punctuation
                { token: 'operator', foreground: '286983' },
                { token: 'delimiter', foreground: '797593' },
                { token: 'punctuation', foreground: '797593' },

                // HTML / XML
                { token: 'tag', foreground: '56949f' },
                { token: 'tag.id', foreground: '56949f' },
                { token: 'tag.class', foreground: '56949f' },
                { token: 'metatag', foreground: '56949f' },
                { token: 'metatag.content', foreground: 'ea9d34' },
                { token: 'attribute.name', foreground: '907aa9' },
                { token: 'attribute.value', foreground: 'ea9d34' },
                { token: 'attribute.value.number', foreground: 'd7827e' },
                { token: 'delimiter.html', foreground: '797593' },

                // CSS
                { token: 'attribute.name.css', foreground: '56949f' },
                { token: 'attribute.value.css', foreground: 'ea9d34' },
                { token: 'number.css', foreground: 'd7827e' },
                { token: 'unit.css', foreground: 'd7827e' },
                { token: 'selector', foreground: '907aa9' },
                { token: 'key.css', foreground: '56949f' },

                // Markdown
                { token: 'emphasis', fontStyle: 'italic' },
                { token: 'strong', fontStyle: 'bold' },
                { token: 'keyword.md', foreground: '286983' },
                { token: 'string.link.md', foreground: '56949f' },
            ],
            colors: {
                'editor.background': '#faf4ed',
                'editor.foreground': '#575279',
                'editor.lineHighlightBackground': '#6e6a860d',
                'editor.lineHighlightBorder': '#00000000',
                'editor.selectionBackground': '#6e6a8626',
                'editor.inactiveSelectionBackground': '#6e6a860d',
                'editor.selectionHighlightBackground': '#6e6a8614',
                'editorCursor.foreground': '#9893a5',
                'editorLineNumber.foreground': '#797593',
                'editorLineNumber.activeForeground': '#575279',
                'editorIndentGuide.background1': '#6e6a8626',
                'editorIndentGuide.activeBackground1': '#9893a5',
                'editorWhitespace.foreground': '#9893a580',
                'editorBracketMatch.background': '#00000000',
                'editorBracketMatch.border': '#797593',
                'editorGutter.background': '#faf4ed',
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

                // Keywords & storage
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
                { token: 'string.regexp', foreground: 'f1fa8c' },

                // Numbers & constants
                { token: 'number', foreground: 'bd93f9' },
                { token: 'constant', foreground: 'bd93f9' },
                { token: 'constant.numeric', foreground: 'bd93f9' },
                { token: 'constant.language', foreground: 'bd93f9' },
                { token: 'constant.character', foreground: 'bd93f9' },
                { token: 'constant.character.escape', foreground: 'ff79c6' },
                { token: 'variable.predefined', foreground: 'bd93f9' },

                // Functions & methods
                { token: 'entity.name.function', foreground: '50fa7b' },
                { token: 'support.function', foreground: '8be9fd', fontStyle: 'italic' },
                { token: 'function', foreground: '50fa7b' },
                { token: 'member', foreground: '50fa7b' },

                // Types & classes
                { token: 'type', foreground: '8be9fd', fontStyle: 'italic' },
                { token: 'type.identifier', foreground: '8be9fd', fontStyle: 'italic' },
                { token: 'entity.name.type', foreground: '8be9fd', fontStyle: 'italic' },
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
                { token: 'variable.language', foreground: 'bd93f9', fontStyle: 'italic' },
                { token: 'variable.parameter', foreground: 'ffb86c', fontStyle: 'italic' },
                { token: 'parameter', foreground: 'ffb86c', fontStyle: 'italic' },

                // Properties & attributes
                { token: 'property', foreground: 'f8f8f2' },
                { token: 'entity.other.attribute-name', foreground: '50fa7b', fontStyle: 'italic' },

                // Operators & punctuation
                { token: 'operator', foreground: 'ff79c6' },
                { token: 'delimiter', foreground: 'f8f8f2' },
                { token: 'punctuation', foreground: 'f8f8f2' },

                // Invalid
                { token: 'invalid', foreground: 'ff5555', fontStyle: 'italic underline' },

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
                { token: 'keyword.md', foreground: 'bd93f9', fontStyle: 'bold' },
                { token: 'string.link.md', foreground: '8be9fd' },
                { token: 'markup.bold', foreground: 'ffb86c', fontStyle: 'bold' },
                { token: 'markup.italic', foreground: 'f1fa8c', fontStyle: 'italic' },
                { token: 'markup.inline.raw', foreground: '50fa7b' },
            ],
            colors: {
                'editor.background': '#282a36',
                'editor.foreground': '#f8f8f2',
                'editor.lineHighlightBackground': '#44475a75',
                'editor.lineHighlightBorder': '#00000000',
                'editor.selectionBackground': '#44475a',
                'editor.inactiveSelectionBackground': '#44475a80',
                'editor.selectionHighlightBackground': '#44475a60',
                'editorCursor.foreground': '#f8f8f2',
                'editorLineNumber.foreground': '#6272a4',
                'editorLineNumber.activeForeground': '#f8f8f2',
                'editorIndentGuide.background1': '#44475a',
                'editorIndentGuide.activeBackground1': '#6272a4',
                'editorWhitespace.foreground': '#ffffff1a',
                'editorBracketMatch.background': '#44475a',
                'editorBracketMatch.border': '#ff79c6',
                'editorGutter.background': '#282a36',
            },
        },
    },
    {
        id: 'tlapalli-quartz',
        label: 'Tlapalli Quartz',
        isDark: false,
        preview: {
            bg: '#faf5f9',
            keyword: '#ac778b',
            string: '#4c002e',
            comment: '#b592a9',
            text: '#7a0033',
        },
        definition: {
            base: 'vs',
            inherit: false,
            rules: [
                { token: '', foreground: '7a0033', background: 'faf5f9' },

                // Comments
                { token: 'comment', foreground: 'b592a9', fontStyle: 'italic' },

                // Keywords & storage
                { token: 'keyword', foreground: 'ac778b', fontStyle: 'italic' },
                { token: 'keyword.control', foreground: 'ac778b', fontStyle: 'italic' },
                { token: 'keyword.operator', foreground: '5c002e' },
                { token: 'storage', foreground: 'b5446d' },
                { token: 'storage.type', foreground: 'b5446d' },
                { token: 'storage.modifier', foreground: 'ac778b', fontStyle: 'italic' },

                // Strings
                { token: 'string', foreground: '4c002e' },
                { token: 'string.escape', foreground: '94264f' },
                { token: 'string.regexp', foreground: '94264f' },

                // Numbers & constants
                { token: 'number', foreground: '660029' },
                { token: 'constant', foreground: 'be4878' },
                { token: 'constant.numeric', foreground: '660029' },
                { token: 'constant.language', foreground: 'be4878' },
                { token: 'constant.character.escape', foreground: '94264f' },

                // Functions & methods
                { token: 'entity.name.function', foreground: '7a0028', fontStyle: 'italic' },
                { token: 'support.function', foreground: '94264f' },
                { token: 'function', foreground: '7a0028' },
                { token: 'member', foreground: '94264f' },

                // Types & classes
                { token: 'type', foreground: '8f003d' },
                { token: 'type.identifier', foreground: '8f003d' },
                { token: 'entity.name.type', foreground: '8f003d' },
                { token: 'entity.name.class', foreground: '8f003d' },
                { token: 'support.class', foreground: '8f003d' },
                { token: 'support.type', foreground: '8f003d' },
                { token: 'class', foreground: '8f003d' },
                { token: 'interface', foreground: '8f003d' },
                { token: 'namespace', foreground: '8f003d' },

                // Variables & parameters
                { token: 'variable', foreground: 'a1627f' },
                { token: 'variable.language', foreground: '7a0033' },
                { token: 'variable.parameter', foreground: '990047' },
                { token: 'parameter', foreground: '990047' },

                // Properties & attributes
                { token: 'property', foreground: 'a1627f' },
                { token: 'entity.other.attribute-name', foreground: 'a00e3f', fontStyle: 'italic' },

                // Operators & punctuation
                { token: 'operator', foreground: '5c002e' },
                { token: 'delimiter', foreground: '9e7b8e' },
                { token: 'punctuation', foreground: '9e7b8e' },

                // HTML / XML
                { token: 'tag', foreground: 'b57f9b' },
                { token: 'tag.id', foreground: 'b57f9b' },
                { token: 'tag.class', foreground: 'b57f9b' },
                { token: 'metatag', foreground: 'b57f9b' },
                { token: 'metatag.content', foreground: '4c002e' },
                { token: 'attribute.name', foreground: 'a00e3f' },
                { token: 'attribute.value', foreground: '4c002e' },
                { token: 'attribute.value.number', foreground: '660029' },
                { token: 'delimiter.html', foreground: '9e7b8e' },

                // CSS
                { token: 'attribute.name.css', foreground: '8f003d' },
                { token: 'attribute.value.css', foreground: '4c002e' },
                { token: 'number.css', foreground: '660029' },
                { token: 'unit.css', foreground: '660029' },
                { token: 'selector', foreground: '94264f' },
                { token: 'key.css', foreground: '8f003d' },

                // Markdown
                { token: 'emphasis', fontStyle: 'italic' },
                { token: 'strong', fontStyle: 'bold' },
                { token: 'keyword.md', foreground: 'c280a2', fontStyle: 'bold' },
                { token: 'string.link.md', foreground: '94264f' },
            ],
            colors: {
                'editor.background': '#faf5f9',
                'editor.foreground': '#75083c',
                'editor.lineHighlightBackground': '#f2e7ee',
                'editor.lineHighlightBorder': '#00000000',
                'editor.selectionBackground': '#d27bb177',
                'editor.inactiveSelectionBackground': '#d27bb133',
                'editor.selectionHighlightBackground': '#d27bb133',
                'editorCursor.foreground': '#7a0033',
                'editorLineNumber.foreground': '#e1c7d7',
                'editorLineNumber.activeForeground': '#d299be',
                'editorIndentGuide.background1': '#e2d9de',
                'editorIndentGuide.activeBackground1': '#7a003371',
                'editorWhitespace.foreground': '#e1c7d7',
                'editorBracketMatch.background': '#faf5f900',
                'editorBracketMatch.border': '#d2b8c8',
                'editorGutter.background': '#faf5f9',
            },
        },
    },
    {
        id: 'tlapalli-fire-opal',
        label: 'Tlapalli Fire Opal',
        isDark: true,
        preview: {
            bg: '#0c0707',
            keyword: '#c94d5a',
            string: '#ffb3b8',
            comment: '#6d4a4a',
            text: '#e85d7a',
        },
        definition: {
            base: 'vs-dark',
            inherit: false,
            rules: [
                { token: '', foreground: 'e85d7a', background: '0c0707' },

                // Comments
                { token: 'comment', foreground: '6d4a4a', fontStyle: 'italic' },

                // Keywords & storage
                { token: 'keyword', foreground: 'c94d5a', fontStyle: 'italic' },
                { token: 'keyword.control', foreground: 'c94d5a', fontStyle: 'italic' },
                { token: 'keyword.operator', foreground: 'ff8599' },
                { token: 'storage', foreground: 'c94d5a' },
                { token: 'storage.type', foreground: 'c94d5a' },
                { token: 'storage.modifier', foreground: 'c94d5a', fontStyle: 'italic' },

                // Strings
                { token: 'string', foreground: 'ffb3b8' },
                { token: 'string.escape', foreground: 'c94d5a' },
                { token: 'string.regexp', foreground: 'c94d5a' },

                // Numbers & constants
                { token: 'number', foreground: 'ff9199' },
                { token: 'constant', foreground: 'ff9199' },
                { token: 'constant.numeric', foreground: 'ff9199' },
                { token: 'constant.language', foreground: 'ff9199' },
                { token: 'constant.character.escape', foreground: 'c94d5a' },

                // Functions & methods
                { token: 'entity.name.function', foreground: 'df4c4c', fontStyle: 'italic' },
                { token: 'support.function', foreground: 'c94d5a' },
                { token: 'function', foreground: 'df4c4c' },
                { token: 'member', foreground: 'c94d5a' },

                // Types & classes
                { token: 'type', foreground: 'ff7070', fontStyle: 'italic' },
                { token: 'type.identifier', foreground: 'ff7070', fontStyle: 'italic' },
                { token: 'entity.name.type', foreground: 'ff7070', fontStyle: 'italic' },
                { token: 'entity.name.class', foreground: 'ff7070', fontStyle: 'italic' },
                { token: 'support.class', foreground: 'ff7070', fontStyle: 'italic' },
                { token: 'support.type', foreground: 'ff7070', fontStyle: 'italic' },
                { token: 'class', foreground: 'ff7070', fontStyle: 'italic' },
                { token: 'interface', foreground: 'ff7070', fontStyle: 'italic' },
                { token: 'namespace', foreground: 'ff7070', fontStyle: 'italic' },

                // Variables & parameters
                { token: 'variable', foreground: 'ea8e97' },
                { token: 'variable.language', foreground: 'e85d7a' },
                { token: 'variable.parameter', foreground: 'ff5d6a' },
                { token: 'parameter', foreground: 'ff5d6a' },

                // Properties & attributes
                { token: 'property', foreground: 'ea8e97' },
                { token: 'entity.other.attribute-name', foreground: 'df4c4c' },

                // Operators & punctuation
                { token: 'operator', foreground: 'ff8599' },
                { token: 'delimiter', foreground: 'ffb3b8' },
                { token: 'punctuation', foreground: 'ffb3b8' },

                // HTML / XML
                { token: 'tag', foreground: '804a4a' },
                { token: 'tag.id', foreground: '804a4a' },
                { token: 'tag.class', foreground: '804a4a' },
                { token: 'metatag', foreground: '804a4a' },
                { token: 'metatag.content', foreground: 'ffb3b8' },
                { token: 'attribute.name', foreground: 'df4c4c' },
                { token: 'attribute.value', foreground: 'ffb3b8' },
                { token: 'attribute.value.number', foreground: 'ff9199' },
                { token: 'delimiter.html', foreground: 'ffb3b8' },

                // CSS
                { token: 'attribute.name.css', foreground: 'ff7070' },
                { token: 'attribute.value.css', foreground: 'ffb3b8' },
                { token: 'number.css', foreground: 'ff9199' },
                { token: 'unit.css', foreground: 'ff9199' },
                { token: 'selector', foreground: 'c94d5a' },
                { token: 'key.css', foreground: 'ff7070' },

                // Markdown
                { token: 'emphasis', fontStyle: 'italic' },
                { token: 'strong', fontStyle: 'bold' },
                { token: 'keyword.md', foreground: '7f3d3d', fontStyle: 'bold' },
                { token: 'string.link.md', foreground: 'c94d5a' },
            ],
            colors: {
                'editor.background': '#0c0707',
                'editor.foreground': '#d96670',
                'editor.lineHighlightBackground': '#180d0d',
                'editor.lineHighlightBorder': '#00000000',
                'editor.selectionBackground': '#842d2d77',
                'editor.inactiveSelectionBackground': '#842d2d33',
                'editor.selectionHighlightBackground': '#842d2d33',
                'editorCursor.foreground': '#e85d7a',
                'editorLineNumber.foreground': '#381e1e',
                'editorLineNumber.activeForeground': '#662d2d',
                'editorIndentGuide.background1': '#261d1d',
                'editorIndentGuide.activeBackground1': '#7f3d3d',
                'editorWhitespace.foreground': '#381e1e',
                'editorBracketMatch.background': '#0c070700',
                'editorBracketMatch.border': '#472d2d',
                'editorGutter.background': '#0c0707',
            },
        },
    },
];

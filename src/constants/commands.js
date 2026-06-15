import { UI_THEMES, MONACO_THEMES } from '@/constants/themes';
import { LANGUAGE_LIST } from '@/constants/languages';

export const createCommands = ({ emit }) => [
    {
        group: 'Navigation',
        items: [
            {
                id: 'go-home',
                label: 'Go to Home',
                icon: 'house',
                scope: '*',
                keywords: ['home', 'dashboard', 'start'],
                action: () => emit('app:navigate', { to: '/' }),
            },
            {
                id: 'new-bin',
                label: 'New Bin',
                icon: 'plus',
                scope: '*',
                shortcutId: 'new_bin',
                keywords: ['create', 'new', 'bin', 'file'],
                action: () => emit('app:navigate', { to: '/new' }),
            },
            {
                id: 'go-settings',
                label: 'Settings',
                icon: 'settings',
                scope: '*',
                shortcutId: 'settings',
                keywords: ['config', 'preferences', 'settings'],
                action: () => emit('app:navigate', { to: '/settings' }),
            },
            {
                id: 'go-profile',
                label: 'My Profile',
                icon: 'user',
                scope: '*',
                keywords: ['profile', 'user', 'me'],
                action: () => emit('app:navigate', { to: '/profile' }),
            },
        ],
    },
    {
        group: 'App',
        items: [
            {
                id: 'app-reload',
                label: 'Reload page',
                icon: 'refresh-cw',
                scope: '*',
                keywords: ['reload', 'refresh', 'restart'],
                action: () => emit('app:reload'),
            },
        ],
    },
    {
        group: 'Theme',
        items: [
            {
                id: 'change-theme',
                label: 'Change UI theme…',
                icon: 'palette',
                scope: '*',
                keywords: ['dark', 'light', 'theme', 'dracula', 'color'],
                page: 'theme',
            },
            {
                id: 'change-monaco-theme',
                label: 'Change editor theme…',
                icon: 'monitor',
                scope: ['/editor'],
                keywords: ['monaco', 'editor', 'theme', 'dark', 'light'],
                page: 'monaco-theme',
            },
        ],
    },
    {
        group: 'Bin',
        items: [
            {
                id: 'bin-share',
                label: 'Copy link',
                icon: 'link',
                scope: ['/editor', '/embed'],
                keywords: ['share', 'copy', 'link', 'url'],
                action: () => emit('bin:share'),
            },
            {
                id: 'bin-fork',
                label: 'Fork bin',
                icon: 'git-fork',
                scope: ['/editor'],
                keywords: ['fork', 'duplicate', 'clone'],
                action: () => emit('bin:fork'),
            },
            {
                id: 'bin-visibility',
                label: 'Toggle read-only',
                icon: 'lock',
                scope: ['/editor'],
                keywords: ['lock', 'unlock', 'readonly', 'read-only', 'edit', 'visibility'],
                action: () => emit('bin:change-visibility'),
            },
        ],
    },
    {
        group: 'Editor',
        items: [
            {
                id: 'editor-language',
                label: 'Change language…',
                icon: 'code',
                scope: ['/editor'],
                keywords: ['language', 'syntax', 'mode'],
                page: 'language',
            },
            {
                id: 'editor-format',
                label: 'Format code',
                icon: 'wand-sparkles',
                scope: ['/editor'],
                shortcutId: 'format_code',
                keywords: ['format', 'prettier', 'indent', 'beautify'],
                action: () => emit('editor:format'),
            },
            {
                id: 'editor-indentation-type',
                label: 'Indentation: Tabs / Spaces…',
                icon: 'between-horizontal-start',
                scope: ['/editor'],
                keywords: ['tabs', 'spaces', 'indent', 'indentation'],
                page: 'indentation-type',
            },
            {
                id: 'editor-tab-size',
                label: 'Tab size…',
                icon: 'ruler',
                scope: ['/editor'],
                keywords: ['tab', 'size', 'width', 'indent'],
                page: 'tab-size',
            },
            {
                id: 'editor-word-wrap',
                label: 'Toggle word wrap',
                icon: 'wrap-text',
                scope: ['/editor'],
                keywords: ['wrap', 'word wrap'],
                action: () => emit('editor:toggle-word-wrap'),
            },
            {
                id: 'editor-minimap',
                label: 'Toggle minimap',
                icon: 'map',
                scope: ['/editor'],
                keywords: ['minimap', 'map'],
                action: () => emit('editor:toggle-minimap'),
            },
            {
                id: 'editor-runner',
                label: 'Toggle runner',
                icon: 'play',
                scope: ['/editor'],
                keywords: ['runner', 'run', 'execute', 'preview'],
                action: () => emit('editor:toggle-runner'),
            },
        ],
    },
];

export const createPages = ({ emit }) => ({
    theme: {
        title: 'UI Theme',
        items: UI_THEMES.map(t => ({
            id: `theme-${t.id}`,
            label: t.label,
            icon: t.isDark ? 'moon' : 'sun',
            action: () => emit('command:setting', { path: 'uiTheme', value: t.id }),
        })),
    },
    'monaco-theme': {
        title: 'Editor Theme',
        items: MONACO_THEMES.map(t => ({
            id: `monaco-theme-${t.id}`,
            label: t.label,
            icon: t.isDark ? 'moon' : 'sun',
            action: () => emit('command:setting', { path: 'monacoTheme', value: t.id }),
        })),
    },
    language: {
        title: 'Language',
        items: LANGUAGE_LIST.map(l => ({
            id: `lang-${l.id}`,
            label: l.label,
            icon: 'code',
            action: () => emit('editor:set-language', { language: l.id }),
        })),
    },
    'indentation-type': {
        title: 'Indentation',
        items: [
            { id: 'indent-spaces', label: 'Spaces', icon: 'space', action: () => emit('command:setting', { path: 'prettier.useTabs', value: false }) },
            { id: 'indent-tabs', label: 'Tabs', icon: 'between-horizontal-start', action: () => emit('command:setting', { path: 'prettier.useTabs', value: true }) },
        ],
    },
    'tab-size': {
        title: 'Tab Size',
        items: [2, 4, 8].map(n => ({
            id: `tab-size-${n}`,
            label: `${n} spaces`,
            icon: 'ruler',
            action: () => emit('command:setting', { path: 'prettier.tabWidth', value: n }),
        })),
    },
});

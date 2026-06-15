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
        preview: { bg: '#ffffff', keyword: '#0000ff', string: '#a31515', comment: '#008000', text: '#000000' },
    },
    {
        id: 'dark',
        label: 'Dark',
        isDark: true,
        preview: { bg: '#1e1e1e', keyword: '#569cd6', string: '#ce9178', comment: '#6a9955', text: '#d4d4d4' },
    },
    {
        id: 'dracula',
        label: 'Dracula',
        isDark: true,
        preview: { bg: '#282a36', keyword: '#ff79c6', string: '#f1fa8c', comment: '#6272a4', text: '#f8f8f2' },
    },
];

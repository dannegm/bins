import { useSettings } from '@/hooks/use-settings';
import { MONACO_THEMES } from '@/constants/themes';
import { ScrambleText } from '@/components/system/scramble-text';

const LINES = [
    [0, "import { createClient } from '@supabase/supabase-js';"],
    [0, "import { debounce, omit } from 'lodash-es';"],
    [0, ''],
    [0, 'const DEFAULT_CONFIG = {'],
    [1, 'baseUrl: process.env.API_URL,'],
    [1, 'timeout: 5000,'],
    [1, 'retries: 3,'],
    [0, '};'],
    [0, ''],
    [0, 'export const fetchItems = async (params, options = {}) => {'],
    [1, 'const config = { ...DEFAULT_CONFIG, ...options };'],
    [1, 'const url = buildUrl(config.baseUrl, params);'],
    [0, ''],
    [1, 'if (!url) {'],
    [2, "throw new Error('Missing endpoint configuration');"],
    [1, '}'],
    [0, ''],
    [1, 'for (let attempt = 0; attempt < config.retries; attempt++) {'],
    [2, 'try {'],
    [3, 'const res = await fetch(url, {'],
    [4, "headers: { 'Content-Type': 'application/json' },"],
    [4, 'signal: AbortSignal.timeout(config.timeout),'],
    [3, '});'],
    [0, ''],
    [3, 'if (!res.ok) throw new Error(`HTTP ${res.status}`);'],
    [3, 'return await res.json();'],
    [2, '} catch (err) {'],
    [3, 'if (attempt === config.retries - 1) throw err;'],
    [2, '}'],
    [1, '}'],
    [0, '};'],
];

export const EditorSkeleton = () => {
    const [fontSize] = useSettings('fontSize');
    const [lineNumbers] = useSettings('lineNumbers');
    const [prettier] = useSettings('prettier');
    const [monacoTheme] = useSettings('monacoTheme');

    const theme = MONACO_THEMES.find(t => t.id === monacoTheme) ?? MONACO_THEMES[0];
    const bg = theme.preview.bg;
    const text = theme.preview.text;
    const indent = ' '.repeat(prettier?.tabWidth ?? 4);

    return (
        <div
            className='relative h-full w-full overflow-hidden bg-(--skeleton-bg) pt-4 font-code text-(length:--skeleton-size) leading-(--skeleton-lh)'
            style={{
                '--skeleton-bg': bg,
                '--skeleton-text': text,
                '--skeleton-size': `${fontSize}px`,
                '--skeleton-lh': `${fontSize * 1.5}px`,
            }}
        >
            {LINES.map(([depth, line], i) => (
                <div key={i} className='flex'>
                    {lineNumbers && (
                        <span className='w-14.5 shrink-0 select-none pr-4 text-right text-(--skeleton-text)/20'>
                            {i + 1}
                        </span>
                    )}
                    <span className='ml-2 whitespace-pre text-(--skeleton-text)/35'>
                        {line === '' ? (
                            ' '
                        ) : (
                            <ScrambleText>{indent.repeat(depth) + line}</ScrambleText>
                        )}
                    </span>
                </div>
            ))}
            <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-linear-to-t from-(--skeleton-bg) to-transparent' />
        </div>
    );
};

import { useMemo } from 'react';
import { useTheme } from '@/providers/theme-provider';

const ParseError = ({ message }) => (
    <div className='flex gap-2 px-3 py-2 font-mono text-xs text-destructive'>
        <span className='shrink-0 select-none'>✕</span>
        <span className='min-w-0 whitespace-pre-wrap break-all'>{message}</span>
    </div>
);

export const SvgRunner = ({ content }) => {
    const { isDark } = useTheme();

    const { src, error } = useMemo(() => {
        if (!content?.trim()) return { src: null, error: null };
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'image/svg+xml');
        const parseError = doc.querySelector('parsererror');
        if (parseError) return { src: null, error: parseError.textContent.trim() };
        return {
            src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(content)}`,
            error: null,
        };
    }, [content]);

    if (error) return <ParseError message={error} />;
    if (!src) return null;

    return (
        <div
            className='flex h-full items-center justify-center p-8'
            style={{
                '--ck-a': isDark ? '#1a1a1a' : '#e8e8e8',
                '--ck-b': isDark ? '#262626' : '#f8f8f8',
                backgroundImage: 'repeating-conic-gradient(var(--ck-a) 0% 25%, var(--ck-b) 0% 50%)',
                backgroundSize: '1rem 1rem',
            }}
        >
            <img src={src} className='max-w-full max-h-full object-contain' alt='' />
        </div>
    );
};

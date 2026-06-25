import { useMemo } from 'react';
import { parse } from 'smol-toml';
import { ThemedJsonView } from '@/ui/themed-json-view';

const ParseError = ({ message }) => (
    <div className='flex gap-2 px-3 py-2 font-mono text-xs text-destructive'>
        <span className='shrink-0 select-none'>✕</span>
        <span className='min-w-0 whitespace-pre-wrap break-all'>{message}</span>
    </div>
);

export const TomlRunner = ({ content }) => {
    const { src, error } = useMemo(() => {
        try {
            return { src: parse(content ?? ''), error: null };
        } catch (e) {
            return { src: null, error: e.message };
        }
    }, [content]);

    if (error) return <ParseError message={error} />;

    return (
        <ThemedJsonView
            className='px-4 py-4'
            src={src}
            name={false}
            collapsed={2}
            iconStyle='square'
        />
    );
};

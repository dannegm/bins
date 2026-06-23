import { useMemo } from 'react';
import { ThemedJsonView } from '@/components/ui/themed-json-view';

const nodeToObj = node => {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        return text || undefined;
    }

    const obj = {};

    if (node.attributes?.length) {
        obj['@'] = {};
        for (const attr of node.attributes) {
            obj['@'][attr.name] = attr.value;
        }
    }

    for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
            const text = child.textContent.trim();
            if (!text) continue;
            obj['#text'] = text;
            continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;

        const key = child.tagName;
        const value = nodeToObj(child);

        if (key in obj) {
            if (!Array.isArray(obj[key])) obj[key] = [obj[key]];
            obj[key].push(value);
        } else {
            obj[key] = value;
        }
    }

    return obj;
};

const ParseError = ({ message }) => (
    <div className='flex gap-2 px-3 py-2 font-mono text-xs text-destructive'>
        <span className='shrink-0 select-none'>✕</span>
        <span className='min-w-0 whitespace-pre-wrap break-all'>{message}</span>
    </div>
);

export const XmlRunner = ({ content }) => {
    const { src, error } = useMemo(() => {
        try {
            const doc = new DOMParser().parseFromString(content ?? '', 'application/xml');
            const parseErr = doc.querySelector('parsererror');
            if (parseErr) return { src: null, error: parseErr.textContent.trim() };
            return { src: { [doc.documentElement.tagName]: nodeToObj(doc.documentElement) }, error: null };
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

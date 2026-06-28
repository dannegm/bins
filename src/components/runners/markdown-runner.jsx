import { useEffect, useRef, useId } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkDirective from 'remark-directive';
import rehypeKatex from 'rehype-katex';
import { visit } from 'unist-util-visit';
import mermaid from 'mermaid';
import 'katex/dist/katex.min.css';
import { cn } from '@/helpers/utils';
import { useTheme } from '@/providers/theme-provider';

const slugify = text =>
    String(text).toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

const extractText = node => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (node?.props?.children) return extractText(node.props.children);
    return '';
};

const remarkCallout = () => tree => {
    visit(tree, 'containerDirective', node => {
        const data = node.data || (node.data = {});
        data.hName = 'div';
        data.hProperties = { className: `callout callout-${node.name}` };
    });
};

const CALLOUT_STYLES = {
    info:    { '--cb-border': '#3b82f6', '--cb-bg': 'rgb(59 130 246 / 0.08)' },
    warning: { '--cb-border': '#f59e0b', '--cb-bg': 'rgb(245 158 11 / 0.08)' },
    tip:     { '--cb-border': '#22c55e', '--cb-bg': 'rgb(34 197 94 / 0.08)' },
    danger:  { '--cb-border': '#ef4444', '--cb-bg': 'rgb(239 68 68 / 0.08)' },
};

const Callout = ({ type, children }) => (
    <div
        className='my-4 rounded-r-lg border-l-4 px-4 py-3 border-(--cb-border) bg-(--cb-bg)'
        style={CALLOUT_STYLES[type] ?? CALLOUT_STYLES.info}
    >
        {children}
    </div>
);

const MermaidBlock = ({ code }) => {
    const { isDark } = useTheme();
    const $el = useRef(null);
    const uid = useId();

    useEffect(() => {
        const el = $el.current;
        if (!el) return;

        let cancelled = false;
        const id = `mermaid${uid.replace(/:/g, '')}`;

        mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default' });
        mermaid
            .render(id, code)
            .then(({ svg }) => { if (!cancelled && el) el.innerHTML = svg; })
            .catch(() => { if (!cancelled && el) el.textContent = code; });

        return () => { cancelled = true; };
    }, [code, isDark, uid]);

    return <div ref={$el} className='my-4 overflow-x-auto' />;
};

const Heading = ({ level, children }) => {
    const base = 'font-bold text-foreground';
    const sizes = {
        1: 'mt-6 mb-4 text-2xl border-b border-border pb-2 first:mt-0',
        2: 'mt-6 mb-3 text-xl border-b border-border pb-1',
        3: 'mt-5 mb-2 text-lg',
        4: 'mt-4 mb-2 text-base',
        5: 'mt-3 mb-1 text-sm',
        6: 'mt-3 mb-1 text-xs text-muted-foreground',
    };
    const Tag = `h${level}`;
    const id = slugify(extractText(children));
    return <Tag id={id} className={cn(base, sizes[level])}>{children}</Tag>;
};

const components = {
    h1: ({ children }) => <Heading level={1}>{children}</Heading>,
    h2: ({ children }) => <Heading level={2}>{children}</Heading>,
    h3: ({ children }) => <Heading level={3}>{children}</Heading>,
    h4: ({ children }) => <Heading level={4}>{children}</Heading>,
    h5: ({ children }) => <Heading level={5}>{children}</Heading>,
    h6: ({ children }) => <Heading level={6}>{children}</Heading>,

    p: ({ children }) => <p className='mb-4 leading-7 text-foreground last:mb-0'>{children}</p>,

    ul: ({ children }) => (
        <ul className='mb-4 ml-5 list-disc space-y-1 text-foreground'>{children}</ul>
    ),
    ol: ({ children }) => (
        <ol className='mb-4 ml-5 list-decimal space-y-1 text-foreground'>{children}</ol>
    ),
    li: ({ children }) => <li className='leading-7'>{children}</li>,

    blockquote: ({ children }) => (
        <blockquote className='mb-4 border-l-4 border-accent pl-4 italic text-muted-foreground'>
            {children}
        </blockquote>
    ),

    pre: ({ children }) => {
        const code = Array.isArray(children) ? children[0] : children;
        const lang = code?.props?.className?.replace('language-', '');
        if (lang === 'mermaid') {
            return <MermaidBlock code={String(code.props.children).trim()} />;
        }
        return (
            <pre className='mb-4 overflow-x-auto rounded-lg bg-surface-raised p-4 text-sm font-mono text-foreground'>
                {children}
            </pre>
        );
    },

    code: ({ children, className }) => {
        if (className?.startsWith('language-')) {
            return <code className={cn('font-mono text-sm', className)}>{children}</code>;
        }
        return (
            <code className='rounded bg-surface-raised px-1.5 py-0.5 font-mono text-xs text-accent'>
                {children}
            </code>
        );
    },

    div: ({ className, children }) => {
        if (className?.startsWith('callout callout-')) {
            const type = className.split('callout-')[1];
            return <Callout type={type}>{children}</Callout>;
        }
        return <div className={className}>{children}</div>;
    },

    table: ({ children }) => (
        <div className='mb-4 overflow-x-auto rounded-lg border border-border'>
            <table className='w-full border-collapse text-sm'>{children}</table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className='border-b border-border bg-surface'>{children}</thead>
    ),
    tbody: ({ children }) => <tbody className='divide-y divide-border'>{children}</tbody>,
    tr: ({ children }) => (
        <tr className='transition-colors hover:bg-surface-raised/50'>{children}</tr>
    ),
    th: ({ children }) => (
        <th className='px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground'>
            {children}
        </th>
    ),
    td: ({ children }) => <td className='px-4 py-2.5 text-foreground'>{children}</td>,

    a: ({ children, href }) => {
        if (href?.startsWith('#')) {
            return (
                <a
                    href={href}
                    onClick={e => {
                        e.preventDefault();
                        document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className='text-brand underline underline-offset-2 transition-opacity hover:opacity-70'
                >
                    {children}
                </a>
            );
        }
        return (
            <a
                href={href}
                target='_blank'
                rel='noopener noreferrer'
                className='text-brand underline underline-offset-2 transition-opacity hover:opacity-70'
            >
                {children}
            </a>
        );
    },
    strong: ({ children }) => <strong className='font-semibold text-foreground'>{children}</strong>,
    em: ({ children }) => <em className='italic'>{children}</em>,
    del: ({ children }) => <del className='line-through text-muted-foreground'>{children}</del>,
    hr: () => <hr className='my-6 border-border' />,
    img: ({ src, alt }) => <img src={src} alt={alt ?? ''} className='my-4 max-w-full rounded-lg' />,
};

export const MarkdownRunner = ({ content }) => (
    <div className='px-4 py-4 sm:px-6 sm:py-6 text-sm'>
        <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath, remarkDirective, remarkCallout]}
            rehypePlugins={[rehypeKatex]}
            components={components}
        >
            {content ?? ''}
        </ReactMarkdown>
    </div>
);

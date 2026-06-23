import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/helpers/utils';

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
    return <Tag className={cn(base, sizes[level])}>{children}</Tag>;
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

    pre: ({ children }) => (
        <pre className='mb-4 overflow-x-auto rounded-lg bg-surface-raised p-4 text-sm font-mono text-foreground'>
            {children}
        </pre>
    ),
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

    a: ({ children, href }) => (
        <a
            href={href}
            target='_blank'
            rel='noopener noreferrer'
            className='text-brand underline underline-offset-2 transition-opacity hover:opacity-70'
        >
            {children}
        </a>
    ),
    strong: ({ children }) => <strong className='font-semibold text-foreground'>{children}</strong>,
    em: ({ children }) => <em className='italic'>{children}</em>,
    del: ({ children }) => <del className='line-through text-muted-foreground'>{children}</del>,
    hr: () => <hr className='my-6 border-border' />,
    img: ({ src, alt }) => <img src={src} alt={alt ?? ''} className='my-4 max-w-full rounded-lg' />,
};

export const MarkdownRunner = ({ content }) => (
    <div className='px-4 py-4 sm:px-6 sm:py-6 text-sm'>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
            {content ?? ''}
        </ReactMarkdown>
    </div>
);

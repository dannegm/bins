import { useState, useEffect, useRef, useMemo } from 'react';
import { transform } from 'sucrase';
import { cn } from '@/helpers/utils';

const REACT_SHIM = `var React = {
    createElement: function(type, props) {
        return { type: type, props: props || {}, children: Array.prototype.slice.call(arguments, 2) };
    },
    Fragment: 'Fragment',
};`;

const CONSOLE_SHIM = `(function () {
    var send = function (method, args) {
        window.parent.postMessage({ type: 'bins:console', method: method, args: args }, '*');
    };
    var serialize = function (v) {
        if (v === null) return 'null';
        if (v === undefined) return 'undefined';
        if (typeof v === 'function') return '[Function: ' + (v.name || 'anonymous') + ']';
        if (v instanceof Error) return v.name + ': ' + v.message;
        if (typeof v === 'object') {
            try { return JSON.stringify(v, null, 2); } catch (e) { return String(v); }
        }
        return String(v);
    };
    ['log', 'warn', 'error', 'info'].forEach(function (method) {
        var orig = console[method];
        console[method] = function () {
            send(method, Array.prototype.map.call(arguments, serialize));
            orig.apply(console, arguments);
        };
    });
    window.addEventListener('error', function (e) {
        send('error', [e.message]);
    });
    window.addEventListener('unhandledrejection', function (e) {
        var msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
        send('error', ['UnhandledPromiseRejection: ' + msg]);
    });
})();`;

const stripExports = code => code
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+((?:async\s+)?(?:const|let|var|function|class))\s+/gm, '$1 ')
    .replace(/^export\s*\{[^}]*\};?/gm, '');

const makeDoc = (code, isJsx) => `<!DOCTYPE html><html><body>
<script>${CONSOLE_SHIM}${isJsx ? REACT_SHIM : ''}</script>
<script>try{${stripExports(code)}}catch(e){console.error(e instanceof Error?e.name+': '+e.message:String(e));}</script>
</body></html>`;

const transpile = (code, language) => {
    try {
        const transforms = [];
        if (language === 'jsx' || language === 'tsx') transforms.push('jsx');
        if (language === 'typescript' || language === 'tsx') transforms.push('typescript');
        const result = transform(code, { transforms });
        return { code: result.code, error: null };
    } catch (e) {
        return { code: null, error: e.message };
    }
};

const LEVELS = {
    log:   { prefix: '▸', className: 'text-foreground' },
    info:  { prefix: 'ℹ', className: 'text-muted-foreground' },
    warn:  { prefix: '⚠', className: 'text-warning' },
    error: { prefix: '✕', className: 'text-destructive' },
};

const ConsoleEntry = ({ entry }) => {
    const { prefix, className } = LEVELS[entry.method] ?? LEVELS.log;
    return (
        <div className={cn('flex gap-2 border-b border-border px-3 py-1.5 font-mono text-xs last:border-b-0', className)}>
            <span className='shrink-0 select-none opacity-50'>{prefix}</span>
            <span className='min-w-0 whitespace-pre-wrap break-all'>{entry.args.join(' ')}</span>
        </div>
    );
};

const TranspileError = ({ message }) => (
    <div className='flex gap-2 px-3 py-2 font-mono text-xs text-destructive'>
        <span className='shrink-0 select-none'>✕</span>
        <span className='min-w-0 whitespace-pre-wrap break-all'>{message}</span>
    </div>
);

const EmptyState = () => (
    <div className='flex h-full items-center justify-center font-mono text-xs text-muted-foreground'>
        {'// run some code'}
    </div>
);

export const JsRunner = ({ content, language }) => {
    const [entries, setEntries] = useState([]);
    const [runKey, setRunKey] = useState(0);

    const { code, error } = useMemo(
        () => transpile(content ?? '', language ?? 'javascript'),
        [content, language],
    );

    const srcDoc = useMemo(
        () => code ? makeDoc(code, language === 'jsx' || language === 'tsx') : '',
        [code, language],
    );

    useEffect(() => {
        setEntries([]);
        setRunKey(k => k + 1);
    }, [srcDoc]);

    // Run on mount in case srcDoc is already set (no content change will fire)
    useEffect(() => {
        if (srcDoc) setRunKey(k => k + 1);
    }, []);

    useEffect(() => {
        const handler = e => {
            if (e.data?.type === 'bins:console') {
                setEntries(prev => [...prev, { method: e.data.method, args: e.data.args }]);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    if (error) return <TranspileError message={error} />;

    return (
        <div className='flex h-full flex-col'>
            <iframe
                key={runKey}
                className='hidden'
                sandbox='allow-scripts'
                srcDoc={srcDoc}
            />
            {entries.length === 0 ? (
                <EmptyState />
            ) : (
                <div className='min-h-0 flex-1 overflow-y-auto'>
                    {entries.map((entry, i) => <ConsoleEntry key={i} entry={entry} />)}
                </div>
            )}
        </div>
    );
};

import { useState, useEffect, useMemo } from 'react';
import { transform } from 'sucrase';
import JsonView from '@microlink/react-json-view';
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
        var loc = e.lineno ? ' (line ' + e.lineno + ')' : '';
        send('error', [e.message + loc]);
    });
    window.addEventListener('unhandledrejection', function (e) {
        var msg = e.reason instanceof Error ? e.reason.message : String(e.reason);
        send('error', ['UnhandledPromiseRejection: ' + msg]);
    });
    window.__r__ = function (v, line, src) {
        if (v !== undefined) {
            var json = null;
            var isJson = false;
            try {
                var s = JSON.stringify(v);
                if (s !== undefined) { isJson = true; json = s; }
            } catch (e) {}
            window.parent.postMessage({
                type: 'bins:result',
                value: isJson ? json : serialize(v),
                isJson: isJson,
                line: line,
                source: src,
            }, '*');
        }
        return v;
    };
})();`;

const SKIP_START_RE =
    /^\s*(const\b|let\b|var\b|function\b|class\b|if\b|else\b|for\b|while\b|do\b|switch\b|try\b|catch\b|finally\b|throw\b|return\b|break\b|continue\b|import\b|export\b|\/\/|\/\*)/;
const CHAIN_RE = /^\s*\??\./;

const instrumentExpressions = (code, originalCode) => {
    const lines = code.split('\n');
    const srcLines = originalCode.split('\n');
    return lines
        .map((line, i) => {
            const t = line.trim();
            if (!t) return line;
            if (t[0] === '}' || t[0] === '{' || t[0] === ']' || t[0] === ')') return line;
            if (t.endsWith(',') || t.endsWith('{') || t.endsWith('(') || t.endsWith('['))
                return line;
            if (SKIP_START_RE.test(t) || CHAIN_RE.test(t)) return line;
            const next = lines.slice(i + 1).find(l => l.trim());
            if (next && CHAIN_RE.test(next)) return line;
            const expr = t.replace(/;$/, '');
            const srcRaw = (srcLines[i] ?? t).trim().replace(/;$/, '');
            const src = srcRaw.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
            return `__r__(${expr}, ${i + 1}, '${src}');`;
        })
        .join('\n');
};

const stripExports = code =>
    code
        .replace(/^export\s+default\s+/gm, '')
        .replace(/^export\s+((?:async\s+)?(?:const|let|var|function|class))\s+/gm, '$1 ')
        .replace(/^export\s*\{[^}]*\};?/gm, '');

const makeDoc = (code, originalCode, isJsx) => {
    const instrumented = instrumentExpressions(stripExports(code), originalCode);
    const catchBlock = `catch(e){var m=e instanceof Error?e.name+': '+e.message:String(e);if(e&&e.stack){var s=e.stack.match(/:(\\d+):(\\d+)/);if(s)m+=' (line '+s[1]+')';}console.error(m);}`;
    return `<!DOCTYPE html><html><body>
<script>${CONSOLE_SHIM}${isJsx ? REACT_SHIM : ''}</script>
<script>try{${instrumented}}${catchBlock}</script>
</body></html>`;
};

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
    log: { prefix: '▸', className: 'text-foreground' },
    info: { prefix: 'ℹ', className: 'text-muted-foreground' },
    warn: { prefix: '⚠', className: 'text-warning' },
    error: { prefix: '✕', className: 'text-destructive' },
};

const ConsoleEntry = ({ entry }) => {
    const { prefix, className } = LEVELS[entry.method] ?? LEVELS.log;
    return (
        <div
            className={cn(
                'flex gap-2 border-b border-border px-3 py-1.5 font-mono text-xs last:border-b-0',
                className,
            )}
        >
            <span className='shrink-0 select-none text-muted-foreground'>{prefix}</span>
            <span className='min-w-0 whitespace-pre-wrap break-all'>{entry.args.join(' ')}</span>
        </div>
    );
};

const toJsonSrc = v => (v !== null && typeof v === 'object' ? v : [v]);

const ResultEntry = ({ entry }) => (
    <div className='flex gap-2 border-b border-border font-mono last:border-b-0'>
        <span className='shrink-0 pl-4 pr-2 py-6 text-sm select-none text-muted-foreground'>
            {entry.line}
        </span>
        <div className='min-w-0'>
            {entry.isJson ? (
                <JsonView
                    src={toJsonSrc(entry.value)}
                    name={false}
                    collapsed={3}
                    iconStyle='square'
                    style={{ background: 'transparent', fontSize: '14px', fontFamily: 'inherit' }}
                    displayArrayKey={false}
                    displayObjectSize={false}
                />
            ) : (
                <pre className='text-foreground'>{entry.value}</pre>
            )}
        </div>
    </div>
);

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
        () => (code ? makeDoc(code, content ?? '', language === 'jsx' || language === 'tsx') : ''),
        [code, content, language],
    );

    useEffect(() => {
        setEntries([]);
        setRunKey(k => k + 1);
    }, [srcDoc]);

    useEffect(() => {
        if (srcDoc) setRunKey(k => k + 1);
    }, []);

    useEffect(() => {
        const handler = e => {
            if (e.data?.type === 'bins:console') {
                setEntries(prev => [
                    ...prev,
                    { type: 'console', method: e.data.method, args: e.data.args },
                ]);
            }
            if (e.data?.type === 'bins:result') {
                const value = e.data.isJson ? JSON.parse(e.data.value) : e.data.value;
                setEntries(prev => [
                    ...prev,
                    {
                        type: 'result',
                        value,
                        isJson: e.data.isJson,
                        source: e.data.source,
                        line: e.data.line,
                    },
                ]);
            }
        };
        window.addEventListener('message', handler);
        return () => window.removeEventListener('message', handler);
    }, []);

    if (error) return <TranspileError message={error} />;

    return (
        <div className='flex h-full flex-col select-text'>
            <iframe key={runKey} className='hidden' sandbox='allow-scripts' srcDoc={srcDoc} />
            {entries.length === 0 ? (
                <EmptyState />
            ) : (
                <div className='min-h-0 flex-1 overflow-y-auto'>
                    {entries.map((entry, i) =>
                        entry.type === 'result' ? (
                            <ResultEntry key={i} entry={entry} />
                        ) : (
                            <ConsoleEntry key={i} entry={entry} />
                        ),
                    )}
                </div>
            )}
        </div>
    );
};

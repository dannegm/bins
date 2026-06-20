import { useState, useEffect, useMemo } from 'react';
import { transform } from 'sucrase';
import { ThemedJsonView } from '@/components/ui/themed-json-view';
import { InlineValue } from '@/components/ui/inline-value';
import { ScrambleText } from '@/components/system/scramble-text';
import { cn } from '@/helpers/utils';
import { useEvents } from '@/providers/bus-provider';

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
        window.parent.postMessage({ type: 'bins:console', method: 'error', args: [e.message], line: e.lineno || null }, '*');
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

const injectLoopChecks = code => {
    const check = `if(++__lc__>1e5)throw new Error('Possible infinite loop: exceeded 100,000 iterations');`;
    return code
        .replace(/\b(for|while)\s*\([\s\S]*?\)\s*\{/g, m => m + check)
        .replace(/\bdo\s*\{/g, m => m + check);
};

const makeDoc = (code, originalCode, isJsx) => {
    const instrumented = instrumentExpressions(stripExports(code), originalCode);
    const guarded = injectLoopChecks(instrumented);
    const catchBlock = `catch(e){var m=e instanceof Error?e.name+': '+e.message:String(e);var ln=null;if(e&&e.stack){var s=e.stack.match(/:(\\d+):(\\d+)/);if(s)ln=parseInt(s[1]);}window.parent.postMessage({type:'bins:console',method:'error',args:[m],line:ln},'*');}`;
    const doneBlock = `finally{window.parent.postMessage({type:'bins:done'},'*');}`;
    return `<!DOCTYPE html><html><body>
<script>${CONSOLE_SHIM}${isJsx ? REACT_SHIM : ''}</script>
<script>try{var __lc__=0;${guarded}}${catchBlock}${doneBlock}</script>
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

const ConsoleEntry = ({ entry, onLineClick }) => {
    const { prefix, className } = LEVELS[entry.method] ?? LEVELS.log;
    return (
        <div className={cn('flex gap-2 border-b border-border font-mono items-start text-xs last:border-b-0', className)}>
            {entry.line ? (
                <button
                    className='shrink-0 w-12 text-right pl-4 pr-2 py-1.5 select-none text-muted-foreground hover:text-foreground transition-colors'
                    onClick={() => onLineClick(entry.line)}
                >
                    {entry.line}
                </button>
            ) : (
                <span className='shrink-0 w-12 pl-4 pr-2 py-1.5' />
            )}
            <span className='shrink-0 select-none text-muted-foreground py-1.5'>{prefix}</span>
            <span className='min-w-0 whitespace-pre-wrap break-all py-1.5'>{entry.args.join(' ')}</span>
        </div>
    );
};

const isJsonObject = v => v !== null && typeof v === 'object';

const ResultEntry = ({ entry, onLineClick }) => (
    <div className='flex gap-2 border-b border-border font-mono items-start last:border-b-0'>
        <button
            className='shrink-0 w-12 text-right pl-4 pr-2 py-2.5 text-sm select-none text-muted-foreground cursor-pointer hover:text-foreground transition-colors'
            onClick={() => onLineClick(entry.line)}
        >
            {entry.line}
        </button>
        <div className='min-w-0'>
            {entry.isJson && isJsonObject(entry.value) ? (
                <ThemedJsonView
                    className='py-3.25'
                    src={entry.value}
                    name={false}
                    collapsed={3}
                    iconStyle='square'
                />
            ) : entry.isJson ? (
                <InlineValue value={entry.value} className='py-3' />
            ) : (
                <InlineValue value={entry.value} className='py-3 text-foreground text-xs' />
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

const SKELETON_ENTRIES = [
    { type: 'result', line: 1,  value: '42',                     valueType: 'number'  },
    { type: 'result', line: 2,  value: '"hello world"',          valueType: 'string'  },
    { type: 'log',    text: 'Rendering component tree'                                 },
    { type: 'result', line: 5,  value: 'true',                   valueType: 'boolean' },
    { type: 'result', line: 7,  value: '{ id: 1, label: "x" }', valueType: 'object'  },
    { type: 'result', line: 9,  value: '[1, 2, 3]',              valueType: 'array'   },
    { type: 'warn',   text: 'Deprecated API called'                                    },
    { type: 'result', line: 12, value: '"process complete"',     valueType: 'string'  },
];

const VALUE_CLASS = {
    number:  'text-warning',
    string:  'text-success',
    boolean: 'text-brand',
    object:  'text-foreground',
    array:   'text-foreground',
};

const RunnerSkeleton = () => (
    <div className='relative h-full overflow-hidden'>
        {SKELETON_ENTRIES.map((entry, i) => {
            const isResult = entry.type === 'result';
            const { prefix, className: lvlClass } = LEVELS[entry.type] ?? LEVELS.log;
            return (
                <div key={i} className='flex gap-2 border-b border-border font-mono items-start last:border-b-0'>
                    <span className={cn('shrink-0 w-12 text-right pl-4 pr-2 select-none text-muted-foreground', isResult ? 'py-2.5 text-sm' : 'py-1.5 text-xs')}>
                        {entry.line ?? ''}
                    </span>
                    {isResult ? (
                        <span className='inline-flex items-baseline gap-1.5 font-mono text-xs py-3'>
                            <span className={VALUE_CLASS[entry.valueType] ?? 'text-foreground'}>
                                <ScrambleText>{entry.value}</ScrambleText>
                            </span>
                            <span className='text-[10px] text-muted-foreground'>{entry.valueType}</span>
                        </span>
                    ) : (
                        <>
                            <span className={cn('shrink-0 select-none py-1.5 text-xs', lvlClass)}>{prefix}</span>
                            <span className={cn('min-w-0 py-1.5 text-xs', lvlClass)}>
                                <ScrambleText>{entry.text}</ScrambleText>
                            </span>
                        </>
                    )}
                </div>
            );
        })}
        <div className='pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent' />
    </div>
);

export const JsRunner = ({ content, language }) => {
    const { emit } = useEvents();
    const [entries, setEntries] = useState([]);
    const [runKey, setRunKey] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

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
        setIsLoading(Boolean(srcDoc));
        setRunKey(k => k + 1);
    }, [srcDoc]);

    useEffect(() => {
        const handler = e => {
            if (e.data?.type === 'bins:done') {
                setIsLoading(false);
                return;
            }
            if (e.data?.type === 'bins:console') {
                const { method, args, line } = e.data;
                setEntries(prev => [...prev, { type: 'console', method, args, line: line ?? null }]);
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
            {isLoading && entries.length === 0 ? (
                <RunnerSkeleton />
            ) : entries.length === 0 ? (
                <EmptyState />
            ) : (
                <div className='min-h-0 flex-1 overflow-y-auto'>
                    {entries.map((entry, i) =>
                        entry.type === 'result' ? (
                            <ResultEntry
                                key={i}
                                entry={entry}
                                onLineClick={line => emit('editor:goto-line', { line })}
                            />
                        ) : (
                            <ConsoleEntry
                                key={i}
                                entry={entry}
                                onLineClick={line => emit('editor:goto-line', { line })}
                            />
                        ),
                    )}
                </div>
            )}
        </div>
    );
};

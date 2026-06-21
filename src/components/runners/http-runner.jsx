import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Play, Loader2, AlertCircle, Search, X } from 'lucide-react';
import Fuse from 'fuse.js';
import { cn } from '@/helpers/utils';
import { ThemedJsonView } from '@/components/ui/themed-json-view';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/ui/collapsible';
import { Input } from '@/ui/input';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useTheme } from '@/providers/theme-provider';

const PROXY_URL = import.meta.env.VITE_PROXY_URL;

const METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT']);

const METHOD_COLORS = {
    GET:     { dark: '#60a5fa', light: '#2563eb' },
    POST:    { dark: '#4ade80', light: '#16a34a' },
    PUT:     { dark: '#facc15', light: '#ca8a04' },
    PATCH:   { dark: '#fb923c', light: '#ea580c' },
    DELETE:  { dark: '#f87171', light: '#dc2626' },
    HEAD:    { dark: '#c084fc', light: '#9333ea' },
    OPTIONS: { dark: '#67e8f9', light: '#0891b2' },
};

const statusColors = status => {
    if (status < 200) return { dark: '#94a3b8', light: '#64748b' };
    if (status < 300) return { dark: '#4ade80', light: '#16a34a' };
    if (status < 400) return { dark: '#60a5fa', light: '#2563eb' };
    if (status < 500) return { dark: '#facc15', light: '#ca8a04' };
    return { dark: '#f87171', light: '#dc2626' };
};

// ─── Parser ───────────────────────────────────────────────────────────────────

const extractDotenvVars = content => {
    const names = new Set();
    for (const m of content.matchAll(/\{\{\$(?:dotenv|env)\s+(\S+?)\}\}/g)) names.add(m[1]);
    return [...names];
};

const resolveVars = (str, variables, envValues, depth = 0) => {
    if (depth > 10) return str;
    return str.replace(/\{\{(.+?)\}\}/g, (full, expr) => {
        const trimmed = expr.trim();
        const m = trimmed.match(/^\$(?:dotenv|env)\s+(\S+)$/);
        if (m) return envValues[m[1]] ?? full;
        const val = variables[trimmed];
        if (val === undefined) return full;
        return resolveVars(val, variables, envValues, depth + 1);
    });
};

const extractLocalVars = (reqContent, variables, dotenvVarSet) => {
    const locals = new Set();
    for (const m of reqContent.matchAll(/\{\{(.+?)\}\}/g)) {
        const expr = m[1].trim();
        if (/^\$(?:dotenv|env)\s+/.test(expr)) continue;
        if (!(expr in variables) && !dotenvVarSet.has(expr)) locals.add(expr);
    }
    return [...locals];
};

const isSeparatorLine = line => !/[a-zA-Z0-9]/.test(line);

const parseHttpFile = content => {
    const lines = content.split('\n');
    const variables = {};
    for (const line of lines) {
        const m = line.match(/^@(\w+)\s*=\s*(.+)$/);
        if (m) variables[m[1]] = m[2].trim();
    }

    const dotenvVars = extractDotenvVars(content);
    const dotenvVarSet = new Set(dotenvVars);

    const blocks = [];
    let current = null;
    for (const line of lines) {
        if (line.startsWith('###')) {
            if (current) blocks.push(current);
            current = { name: line.slice(3).trim(), lines: [] };
        } else if (current) {
            current.lines.push(line);
        }
    }
    if (current) blocks.push(current);

    const header = { title: null, baseUrl: null };
    const items = [];
    let reqId = 0;

    for (const block of blocks) {
        let methodLineIdx = -1;
        for (let i = 0; i < block.lines.length; i++) {
            const t = block.lines[i].trim();
            if (!t || t.startsWith('#') || t.startsWith('@')) continue;
            if (METHODS.has(t.split(/\s+/)[0].toUpperCase())) { methodLineIdx = i; break; }
        }

        if (methodLineIdx === -1) {
            // Header info from first non-request blocks
            if (!header.title && block.name && !/^[A-Za-z\w]+\s*:/.test(block.name)) {
                header.title = block.name;
            }
            const baseMatch = block.name.match(/^Base:\s*(.+)/i);
            if (baseMatch && !header.baseUrl) header.baseUrl = baseMatch[1].trim();

            // Section separator from comment lines
            const labelLines = block.lines
                .map(l => l.trim())
                .filter(l => l.startsWith('#'))
                .map(l => l.slice(1).trim())
                .filter(l => l && !isSeparatorLine(l));

            if (labelLines.length > 0 && labelLines.length <= 2) {
                items.push({ type: 'separator', label: labelLines[0] });
            }
            continue;
        }

        const methodLine = block.lines[methodLineIdx].trim();
        const sp = methodLine.indexOf(' ');
        const method = methodLine.slice(0, sp).toUpperCase();
        const rawUrl = methodLine.slice(sp + 1).trim();

        const rawHeaders = {};
        let bodyStart = block.lines.length;
        for (let i = methodLineIdx + 1; i < block.lines.length; i++) {
            const t = block.lines[i].trim();
            if (!t) { bodyStart = i + 1; break; }
            if (t.startsWith('#')) continue;
            const ci = t.indexOf(':');
            if (ci !== -1) rawHeaders[t.slice(0, ci).trim()] = t.slice(ci + 1).trim();
        }
        // Reset bodyStart properly: find blank line after headers
        bodyStart = block.lines.length;
        let inHeaders = true;
        for (let i = methodLineIdx + 1; i < block.lines.length; i++) {
            const t = block.lines[i].trim();
            if (inHeaders && !t) { bodyStart = i + 1; inHeaders = false; break; }
            if (!t.startsWith('#') && t) inHeaders = true;
        }

        const rawBody = block.lines.slice(bodyStart).join('\n').trim() || null;

        const reqContent = [rawUrl, ...Object.entries(rawHeaders).map(([k, v]) => `${k}: ${v}`), rawBody ?? ''].join(' ');
        const localVars = extractLocalVars(reqContent, variables, dotenvVarSet);

        items.push({ type: 'request', id: reqId++, name: block.name || `${method} ${rawUrl}`, method, rawUrl, rawHeaders, rawBody, localVars });
    }

    return { variables, dotenvVars, header, items };
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

const executeRequest = async (request, variables, envValues) => {
    const url = resolveVars(request.rawUrl, variables, envValues);
    const headers = Object.fromEntries(
        Object.entries(request.rawHeaders).map(([k, v]) => [k, resolveVars(v, variables, envValues)]),
    );
    const body = request.rawBody ? resolveVars(request.rawBody, variables, envValues) : undefined;

    const start = performance.now();
    const res = await fetch(PROXY_URL, {
        method: request.method,
        headers: { ...headers, 'x-proxy-target': url },
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : body,
    });
    const elapsed = Math.round(performance.now() - start);

    const contentType = res.headers.get('content-type') ?? '';
    const responseHeaders = Object.fromEntries(res.headers.entries());

    let responseBody, bodyType;
    if (contentType.includes('application/json')) {
        const text = await res.text();
        try { responseBody = JSON.parse(text); bodyType = 'json'; }
        catch { responseBody = text; bodyType = 'text'; }
    } else if (contentType.startsWith('text/html')) {
        responseBody = await res.text();
        bodyType = 'html';
    } else if (contentType.startsWith('text/')) {
        responseBody = await res.text();
        bodyType = 'text';
    } else if (contentType.startsWith('image/')) {
        responseBody = URL.createObjectURL(await res.blob());
        bodyType = 'image';
    } else {
        responseBody = URL.createObjectURL(await res.blob());
        bodyType = 'blob';
    }

    return { status: res.status, statusText: res.statusText, elapsed, headers: responseHeaders, contentType, body: responseBody, bodyType };
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const NoProxy = ({ t }) => (
    <div className='flex flex-col items-center justify-center gap-2 px-6 py-10 text-center'>
        <AlertCircle className='size-4 text-destructive' />
        <p className='text-xs text-muted-foreground'>{t('editor.runner_panel.http.no_proxy')}</p>
    </div>
);

const EmptyState = ({ t }) => (
    <div className='flex h-32 items-center justify-center text-xs text-muted-foreground'>
        {t('editor.runner_panel.http.empty')}
    </div>
);

const MethodBadge = ({ method }) => {
    const colors = METHOD_COLORS[method] ?? { dark: '#94a3b8', light: '#64748b' };
    return (
        <span
            className='shrink-0 font-mono font-bold text-[10px] rounded-sm px-1.5 py-0.5 bg-(--mc-light) text-white dark:bg-(--mc-dark)'
            style={{ '--mc-dark': colors.dark, '--mc-light': colors.light }}
        >
            {method}
        </span>
    );
};

const StatusBadge = ({ status, statusText, elapsed }) => {
    const colors = statusColors(status);
    return (
        <div className='flex items-center gap-2 px-3 py-2 text-xs border-b border-border'>
            <span
                className='font-mono font-bold text-(--sc-light) dark:text-(--sc-dark)'
                style={{ '--sc-dark': colors.dark, '--sc-light': colors.light }}
            >
                {status}
            </span>
            <span className='text-muted-foreground'>{statusText}</span>
            <span className='ml-auto tabular-nums text-muted-foreground'>{elapsed}ms</span>
        </div>
    );
};

const ResponseBody = ({ result }) => {
    const { isDark } = useTheme();

    if (result.bodyType === 'json') {
        return (
            <div className='px-3 py-2'>
                <ThemedJsonView src={result.body} name={false} collapsed={2} iconStyle='square' />
            </div>
        );
    }

    if (result.bodyType === 'text') {
        return (
            <pre className='px-3 py-2 font-mono text-xs text-foreground whitespace-pre-wrap break-all'>
                {result.body}
            </pre>
        );
    }

    const checkerStyle = {
        '--ck-a': isDark ? '#1a1a1a' : '#e8e8e8',
        '--ck-b': isDark ? '#262626' : '#f8f8f8',
        backgroundImage: 'repeating-conic-gradient(var(--ck-a) 0% 25%, var(--ck-b) 0% 50%)',
        backgroundSize: '1rem 1rem',
    };

    if (result.bodyType === 'image') {
        return (
            <div className='flex items-center justify-center p-4' style={checkerStyle}>
                <img src={result.body} className='max-w-full max-h-64 object-contain' alt='' />
            </div>
        );
    }

    if (result.bodyType === 'html') {
        return (
            <iframe className='w-full min-h-48 bg-white' sandbox='allow-scripts' srcDoc={result.body} />
        );
    }

    return (
        <div className='px-3 py-2 font-mono text-xs text-muted-foreground'>
            {result.contentType || 'binary'}
        </div>
    );
};

const ResponseHeaders = ({ headers, t }) => {
    const [open, setOpen] = useState(false);
    const entries = Object.entries(headers);
    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className='flex w-full items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-border'>
                <ChevronDown className={cn('size-3 transition-transform', { 'rotate-180': open })} />
                {t('editor.runner_panel.http.headers')} ({entries.length})
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className='px-3 py-2 border-b border-border'>
                    {entries.map(([k, v]) => (
                        <div key={k} className='flex gap-2 py-0.5 font-mono text-xs'>
                            <span className='text-muted-foreground shrink-0'>{k}:</span>
                            <span className='text-foreground break-all'>{v}</span>
                        </div>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

const SectionSeparator = ({ label }) => (
    <div className='flex items-center gap-3 px-3 py-2.5'>
        <div className='h-px flex-1 bg-border' />
        <span className='text-[10px] font-semibold tracking-widest text-muted-foreground uppercase'>{label}</span>
        <div className='h-px flex-1 bg-border' />
    </div>
);

const LocalVarsPanel = ({ localVars, values, onChange, t }) => {
    if (localVars.length === 0) return null;
    return (
        <div className='border-b border-border px-3 py-2'>
            <p className='mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>
                {t('editor.runner_panel.http.local_vars')}
            </p>
            <div className='flex flex-col gap-1'>
                {localVars.map(varName => (
                    <div key={varName} className='flex items-center gap-2'>
                        <span className='w-32 shrink-0 truncate font-mono text-xs text-muted-foreground'>{varName}</span>
                        <Input
                            className='h-6 text-xs font-mono'
                            placeholder={t('editor.runner_panel.http.env_placeholder')}
                            value={values[varName] ?? ''}
                            onChange={e => onChange(varName, e.target.value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

const RequestCard = ({ request, result, loading, localVarValues, onLocalVarChange, onRun, t }) => {
    const [open, setOpen] = useState(true);

    return (
        <Collapsible open={open} onOpenChange={setOpen} className='border-b border-border'>
            <div className='flex items-center gap-2 px-3 py-2'>
                <CollapsibleTrigger className='flex min-w-0 flex-1 items-center gap-2 text-left'>
                    <ChevronDown className={cn('size-3 shrink-0 text-muted-foreground transition-transform', { 'rotate-180': open })} />
                    <MethodBadge method={request.method} />
                    <span className='min-w-0 truncate text-xs text-foreground'>{request.name}</span>
                </CollapsibleTrigger>
                <button
                    onClick={onRun}
                    disabled={loading}
                    className='shrink-0 flex items-center gap-1 rounded px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors disabled:opacity-50'
                >
                    {loading ? <Loader2 className='size-3 animate-spin' /> : <Play className='size-3' />}
                    {t('editor.runner_panel.http.run')}
                </button>
            </div>

            <CollapsibleContent>
                <div className='mx-3 mb-3 rounded-lg border border-border overflow-hidden'>
                    <div className='px-3 py-2 font-mono text-xs text-muted-foreground border-b border-border truncate bg-surface-raised/40'>
                        {request.rawUrl}
                    </div>

                    <LocalVarsPanel
                        localVars={request.localVars}
                        values={localVarValues}
                        onChange={onLocalVarChange}
                        t={t}
                    />

                    {result?.error && (
                        <div className='flex items-center gap-2 px-3 py-2 text-xs text-destructive bg-destructive/5'>
                            <AlertCircle className='size-3 shrink-0' />
                            {result.error}
                        </div>
                    )}

                    {result && !result.error && (
                        <>
                            <StatusBadge status={result.status} statusText={result.statusText} elapsed={result.elapsed} />
                            <ResponseHeaders headers={result.headers} t={t} />
                            <ResponseBody result={result} />
                        </>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

const EnvPanel = ({ dotenvVars, envValues, onChange, t }) => {
    const unresolved = dotenvVars.filter(v => !envValues[v]);
    const [open, setOpen] = useState(true);

    return (
        <Collapsible open={open} onOpenChange={setOpen} className='border-b border-border'>
            <CollapsibleTrigger className='flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-surface-raised/30 transition-colors'>
                <ChevronDown className={cn('size-3 shrink-0 text-muted-foreground transition-transform', { 'rotate-180': open })} />
                <span className='flex-1 text-left font-medium text-foreground'>
                    {t('editor.runner_panel.http.env_vars')}
                </span>
                {unresolved.length > 0 && (
                    <span className='rounded-full bg-destructive/15 px-1.5 py-0.5 text-xs text-destructive'>
                        {unresolved.length}
                    </span>
                )}
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className='mx-3 mb-3 rounded-lg border border-border overflow-hidden'>
                    <div className='flex flex-col gap-0 divide-y divide-border'>
                        {dotenvVars.map(varName => (
                            <div key={varName} className='flex items-center gap-2 px-3 py-1.5'>
                                <span className='w-40 shrink-0 truncate font-mono text-xs text-muted-foreground'>
                                    {varName}
                                </span>
                                <Input
                                    className='h-6 text-xs font-mono'
                                    placeholder={t('editor.runner_panel.http.env_placeholder')}
                                    value={envValues[varName] ?? ''}
                                    onChange={e => onChange(prev => ({ ...prev, [varName]: e.target.value }))}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </CollapsibleContent>
        </Collapsible>
    );
};

const FileHeader = ({ header }) => {
    if (!header?.title) return null;
    return (
        <div className='flex items-baseline gap-2 border-b border-border px-3 py-2.5'>
            <span className='font-semibold text-sm text-foreground'>{header.title}</span>
            {header.baseUrl && (
                <span className='font-mono text-xs text-muted-foreground truncate'>{header.baseUrl}</span>
            )}
        </div>
    );
};

const FilterBar = ({ requests, query, onQueryChange, methodFilter, onMethodFilter, t }) => {
    const methods = useMemo(() => [...new Set(requests.map(r => r.method))].sort(), [requests]);

    return (
        <div className='flex flex-col gap-1.5 border-b border-border px-3 py-2'>
            <div className='relative'>
                <Search className='absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground' />
                <input
                    className='w-full rounded border border-border bg-surface py-1 pl-6 pr-6 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-brand'
                    placeholder={t('editor.runner_panel.http.search')}
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                />
                {query && (
                    <button
                        className='absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground'
                        onClick={() => onQueryChange('')}
                    >
                        <X className='size-3' />
                    </button>
                )}
            </div>
            {methods.length > 1 && (
                <div className='flex flex-wrap gap-1'>
                    <button
                        onClick={() => onMethodFilter(null)}
                        className={cn(
                            'rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors',
                            { 'bg-surface-raised text-foreground': !methodFilter, 'text-muted-foreground hover:text-foreground': methodFilter },
                        )}
                    >
                        ALL
                    </button>
                    {methods.map(method => {
                        const colors = METHOD_COLORS[method] ?? { dark: '#94a3b8', light: '#64748b' };
                        const active = methodFilter === method;
                        return (
                            <button
                                key={method}
                                onClick={() => onMethodFilter(active ? null : method)}
                                className={cn(
                                    'rounded px-1.5 py-0.5 font-mono font-bold text-[10px] transition-colors',
                                    { 'text-white': active },
                                )}
                                style={active
                                    ? { backgroundColor: colors.dark }
                                    : { '--mc-dark': colors.dark, '--mc-light': colors.light }
                                }
                            >
                                <span className={cn({ 'text-(--mc-light) dark:text-(--mc-dark)': !active })}>
                                    {method}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const HttpRunner = ({ content, fileId }) => {
    const { t } = useTranslation();
    const [envValues, setEnvValues] = useLocalStorage(`http-env:${fileId}`, {});
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState({});
    const [localVarValues, setLocalVarValues] = useState({});
    const [query, setQuery] = useState('');
    const [methodFilter, setMethodFilter] = useState(null);

    const { variables, dotenvVars, header, items } = useMemo(
        () => parseHttpFile(content ?? ''),
        [content],
    );

    const requests = useMemo(() => items.filter(i => i.type === 'request'), [items]);

    const fuse = useMemo(
        () => new Fuse(requests, { keys: ['name', 'rawUrl'], threshold: 0.4 }),
        [requests],
    );

    const visibleIds = useMemo(() => {
        const isFiltering = query || methodFilter;
        if (!isFiltering) return null;
        let candidates = query ? fuse.search(query).map(r => r.item) : requests;
        if (methodFilter) candidates = candidates.filter(r => r.method === methodFilter);
        return new Set(candidates.map(r => r.id));
    }, [query, methodFilter, requests, fuse]);

    const setLocalVar = useCallback((reqId, varName, value) => {
        setLocalVarValues(prev => ({
            ...prev,
            [reqId]: { ...(prev[reqId] ?? {}), [varName]: value },
        }));
    }, []);

    const runRequest = useCallback(
        async reqId => {
            if (!PROXY_URL) return;
            const request = requests.find(r => r.id === reqId);
            const mergedVars = { ...variables, ...(localVarValues[reqId] ?? {}) };
            setLoading(prev => ({ ...prev, [reqId]: true }));
            setResults(prev => ({ ...prev, [reqId]: null }));
            try {
                const result = await executeRequest(request, mergedVars, envValues);
                setResults(prev => ({ ...prev, [reqId]: result }));
            } catch (e) {
                setResults(prev => ({ ...prev, [reqId]: { error: e.message } }));
            } finally {
                setLoading(prev => ({ ...prev, [reqId]: false }));
            }
        },
        [requests, variables, localVarValues, envValues],
    );

    if (!PROXY_URL) return <NoProxy t={t} />;
    if (requests.length === 0) return <EmptyState t={t} />;

    const isFiltering = query || methodFilter;

    return (
        <div className='flex flex-col'>
            <FileHeader header={header} />

            {dotenvVars.length > 0 && (
                <EnvPanel dotenvVars={dotenvVars} envValues={envValues} onChange={setEnvValues} t={t} />
            )}

            <FilterBar
                requests={requests}
                query={query}
                onQueryChange={setQuery}
                methodFilter={methodFilter}
                onMethodFilter={setMethodFilter}
                t={t}
            />

            {items.map((item, i) => {
                if (item.type === 'separator') {
                    if (isFiltering) return null;
                    return <SectionSeparator key={i} label={item.label} />;
                }
                if (visibleIds && !visibleIds.has(item.id)) return null;
                return (
                    <RequestCard
                        key={item.id}
                        request={item}
                        result={results[item.id]}
                        loading={loading[item.id] ?? false}
                        localVarValues={localVarValues[item.id] ?? {}}
                        onLocalVarChange={(varName, value) => setLocalVar(item.id, varName, value)}
                        onRun={() => runRequest(item.id)}
                        t={t}
                    />
                );
            })}
        </div>
    );
};

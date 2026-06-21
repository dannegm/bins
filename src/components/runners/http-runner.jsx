import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Play, Loader2, AlertCircle } from 'lucide-react';
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
    for (const m of content.matchAll(/\{\{\$dotenv\s+(\S+?)\}\}/g)) names.add(m[1]);
    return [...names];
};

const resolveVars = (str, variables, envValues) =>
    str.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
        const trimmed = expr.trim();
        const m = trimmed.match(/^\$dotenv\s+(\S+)$/);
        if (m) return envValues[m[1]] ?? '';
        return variables[trimmed] ?? '';
    });

const parseHttpFile = content => {
    const lines = content.split('\n');
    const variables = {};
    for (const line of lines) {
        const m = line.match(/^@(\w+)\s*=\s*(.+)$/);
        if (m) variables[m[1]] = m[2].trim();
    }

    const dotenvVars = extractDotenvVars(content);
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

    const requests = [];
    for (const block of blocks) {
        let methodLineIdx = -1;
        for (let i = 0; i < block.lines.length; i++) {
            const t = block.lines[i].trim();
            if (!t || t.startsWith('#') || t.startsWith('@')) continue;
            if (METHODS.has(t.split(/\s+/)[0].toUpperCase())) { methodLineIdx = i; break; }
        }
        if (methodLineIdx === -1) continue;

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
            bodyStart = i + 1;
        }

        const rawBody = block.lines.slice(bodyStart).join('\n').trim() || null;
        requests.push({ name: block.name || `${method} ${rawUrl}`, method, rawUrl, rawHeaders, rawBody });
    }

    return { variables, requests, dotenvVars };
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
            className='shrink-0 font-mono font-bold text-[10px] rounded-xs px-1 py-0.5 bg-(--mc-light) text-white dark:bg-(--mc-dark)'
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
            <span className='ml-auto text-muted-foreground'>{elapsed}ms</span>
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

    if (result.bodyType === 'image') {
        return (
            <div
                className='flex items-center justify-center p-4'
                style={{
                    '--ck-a': isDark ? '#1a1a1a' : '#e8e8e8',
                    '--ck-b': isDark ? '#262626' : '#f8f8f8',
                    backgroundImage: 'repeating-conic-gradient(var(--ck-a) 0% 25%, var(--ck-b) 0% 50%)',
                    backgroundSize: '1rem 1rem',
                }}
            >
                <img src={result.body} className='max-w-full max-h-64 object-contain' alt='' />
            </div>
        );
    }

    if (result.bodyType === 'html') {
        return (
            <div
                className='relative'
                style={{
                    '--ck-a': isDark ? '#1a1a1a' : '#e8e8e8',
                    '--ck-b': isDark ? '#262626' : '#f8f8f8',
                    backgroundImage: 'repeating-conic-gradient(var(--ck-a) 0% 25%, var(--ck-b) 0% 50%)',
                    backgroundSize: '1rem 1rem',
                }}
            >
                <iframe
                    className='w-full min-h-48'
                    sandbox='allow-scripts'
                    srcDoc={result.body}
                />
            </div>
        );
    }

    return (
        <div className='px-3 py-2 text-xs text-muted-foreground font-mono'>
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

const RequestCard = ({ request, result, loading, onRun, t }) => {
    const [open, setOpen] = useState(true);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className='border-b-2 border-border hover:bg-surface-raised/30 transition-colors'
        >
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
                    {loading
                        ? <Loader2 className='size-3 animate-spin' />
                        : <Play className='size-3' />
                    }
                    {t('editor.runner_panel.http.run')}
                </button>
            </div>

            <CollapsibleContent>
                <div className='px-3 pb-2 font-mono text-xs text-muted-foreground truncate'>
                    {request.rawUrl}
                </div>

                {result?.error && (
                    <div className='flex items-center gap-2 mx-3 mb-2 rounded px-2 py-1.5 text-xs text-destructive border border-destructive/30 bg-destructive/5'>
                        <AlertCircle className='size-3 shrink-0' />
                        {result.error}
                    </div>
                )}

                {result && !result.error && (
                    <div className='border-t border-border'>
                        <StatusBadge status={result.status} statusText={result.statusText} elapsed={result.elapsed} />
                        <ResponseHeaders headers={result.headers} t={t} />
                        <ResponseBody result={result} />
                    </div>
                )}
            </CollapsibleContent>
        </Collapsible>
    );
};

const EnvPanel = ({ dotenvVars, envValues, onChange, t }) => {
    const unresolved = dotenvVars.filter(v => !envValues[v]);
    const [open, setOpen] = useState(true);

    return (
        <Collapsible
            open={open}
            onOpenChange={setOpen}
            className='border-b border-border bg-surface-raised/30'
        >
            <CollapsibleTrigger className='flex w-full items-center gap-2 px-3 py-2 text-xs'>
                <ChevronDown className={cn('size-3 shrink-0 text-muted-foreground transition-transform', { 'rotate-180': open })} />
                <span className='flex-1 text-left text-foreground font-medium'>
                    {t('editor.runner_panel.http.env_vars')}
                </span>
                {unresolved.length > 0 && (
                    <span className='rounded-full bg-destructive/15 px-1.5 py-0.5 text-xs text-destructive'>
                        {unresolved.length}
                    </span>
                )}
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className='flex flex-col gap-1.5 px-3 pb-3'>
                    {dotenvVars.map(varName => (
                        <div key={varName} className='flex items-center gap-2'>
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
            </CollapsibleContent>
        </Collapsible>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export const HttpRunner = ({ content, fileId }) => {
    const { t } = useTranslation();
    const [envValues, setEnvValues] = useLocalStorage(`http-env:${fileId}`, {});
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState({});

    const { variables, requests, dotenvVars } = useMemo(
        () => parseHttpFile(content ?? ''),
        [content],
    );

    const runRequest = useCallback(
        async index => {
            if (!PROXY_URL) return;
            const request = requests[index];
            setLoading(prev => ({ ...prev, [index]: true }));
            setResults(prev => ({ ...prev, [index]: null }));
            try {
                const result = await executeRequest(request, variables, envValues);
                setResults(prev => ({ ...prev, [index]: result }));
            } catch (e) {
                setResults(prev => ({ ...prev, [index]: { error: e.message } }));
            } finally {
                setLoading(prev => ({ ...prev, [index]: false }));
            }
        },
        [requests, variables, envValues],
    );

    if (!PROXY_URL) return <NoProxy t={t} />;
    if (requests.length === 0) return <EmptyState t={t} />;

    return (
        <div className='flex flex-col'>
            {dotenvVars.length > 0 && (
                <EnvPanel
                    dotenvVars={dotenvVars}
                    envValues={envValues}
                    onChange={setEnvValues}
                    t={t}
                />
            )}
            {requests.map((request, i) => (
                <RequestCard
                    key={i}
                    request={request}
                    result={results[i]}
                    loading={loading[i] ?? false}
                    onRun={() => runRequest(i)}
                    t={t}
                />
            ))}
        </div>
    );
};

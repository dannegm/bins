const METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS', 'TRACE', 'CONNECT']);

export const id = 'http';
export const extensions = ['.http', '.rest', '.api'];
export const mimetypes = ['text/x-http'];

const scanInterpolations = (line, start, baseScope) => {
    const tokens = [];
    let i = start;
    let segStart = i;

    while (i < line.length) {
        if (line[i] === '{' && line[i + 1] === '{') {
            if (i > segStart) tokens.push({ startIndex: segStart, scopes: baseScope });
            tokens.push({ startIndex: i, scopes: 'variable.parameter' });
            i += 2;
            while (i < line.length && !(line[i] === '}' && line[i + 1] === '}')) i++;
            if (i < line.length) i += 2;
            segStart = i;
        } else {
            i++;
        }
    }
    if (segStart < line.length) tokens.push({ startIndex: segStart, scopes: baseScope });
    return tokens;
};

export const tokenize = line => {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (trimmed.startsWith('###')) return [{ startIndex: 0, scopes: 'comment' }];
    if (trimmed.startsWith('#')) return [{ startIndex: 0, scopes: 'comment' }];
    if (!trimmed) return [];

    if (trimmed.startsWith('@')) {
        const eqIdx = line.indexOf('=');
        if (eqIdx !== -1) {
            return [
                { startIndex: indent, scopes: 'variable.parameter' },
                { startIndex: eqIdx, scopes: 'operator' },
                ...scanInterpolations(line, eqIdx + 1, 'string'),
            ];
        }
        return [{ startIndex: indent, scopes: 'variable.parameter' }];
    }

    const spIdx = trimmed.indexOf(' ');
    if (spIdx !== -1 && METHODS.has(trimmed.slice(0, spIdx).toUpperCase())) {
        return [
            { startIndex: indent, scopes: 'keyword' },
            ...scanInterpolations(line, indent + spIdx + 1, 'string'),
        ];
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1 && /^[\w-]+\s*:/.test(trimmed)) {
        return [
            { startIndex: indent, scopes: 'variable' },
            { startIndex: colonIdx, scopes: 'operator' },
            ...scanInterpolations(line, colonIdx + 1, 'type'),
        ];
    }

    return scanInterpolations(line, 0, 'identifier');
};

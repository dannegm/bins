export const id = 'mermaid';
export const extensions = ['.mmd', '.mermaid'];
export const mimetypes = ['text/x-mermaid'];

const DIAGRAM_TYPES = new Set([
    'graph',
    'flowchart',
    'sequencediagram',
    'classdiagram',
    'statediagram',
    'statediagram-v2',
    'erdiagram',
    'gantt',
    'pie',
    'gitgraph',
    'mindmap',
    'timeline',
    'journey',
    'quadrantchart',
    'requirementdiagram',
    'c4context',
    'c4container',
    'c4component',
    'c4dynamic',
    'block-beta',
    'architecture-beta',
    'xychart-beta',
    'sankey-beta',
    'packet-beta',
]);

const KEYWORDS = new Set([
    'subgraph',
    'end',
    'loop',
    'alt',
    'else',
    'opt',
    'par',
    'critical',
    'break',
    'rect',
    'note',
    'over',
    'left',
    'right',
    'of',
    'participant',
    'actor',
    'activate',
    'deactivate',
    'create',
    'destroy',
    'autonumber',
    'title',
    'accTitle',
    'accDescr',
    'section',
    'classDef',
    'class',
    'style',
    'linkStyle',
    'click',
    'callback',
    'href',
    'direction',
    'namespace',
    'state',
    'note',
    'as',
    'link',
]);

const DIRECTIONS = new Set(['TD', 'TB', 'LR', 'RL', 'BT']);

const ARROW_RE =
    /(-{1,2}(?:>>?|>|o|x|\.){0,2}->?|={1,2}>?|~{2}|\.{1,2}>?|-{1,3}|>{1,2}|<{1,2}|\|>?|\|\||\|\]|\[\/|\/\|)/;

export const tokenize = line => {
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;

    if (!trimmed) return [];

    // Comments
    if (trimmed.startsWith('%%')) return [{ startIndex: 0, scopes: 'comment' }];

    // Diagram type (first word of line with no indent, known diagram)
    const firstWord = trimmed.split(/\s+/)[0].toLowerCase();
    if (indent === 0 && DIAGRAM_TYPES.has(firstWord)) {
        const tokens = [{ startIndex: 0, scopes: 'keyword' }];
        const rest = trimmed.slice(firstWord.length).trimStart();
        const restStart = line.indexOf(rest);
        if (rest && DIRECTIONS.has(rest.split(/\s+/)[0])) {
            tokens.push({ startIndex: restStart, scopes: 'variable' });
        }
        return tokens;
    }

    const tokens = [];
    let i = indent;

    // Keyword at line start
    if (KEYWORDS.has(firstWord)) {
        tokens.push({ startIndex: indent, scopes: 'keyword' });
        i = indent + firstWord.length;
        // Skip whitespace
        while (i < line.length && line[i] === ' ') i++;
    }

    // Scan rest of line for strings, arrows, identifiers
    let segStart = i;
    while (i < line.length) {
        // String literal
        if (line[i] === '"') {
            if (i > segStart) tokens.push({ startIndex: segStart, scopes: 'identifier' });
            tokens.push({ startIndex: i, scopes: 'string' });
            i++;
            while (i < line.length && line[i] !== '"') i++;
            if (i < line.length) i++;
            segStart = i;
            continue;
        }

        // Arrow connectors: try to match at current position
        const slice = line.slice(i);
        const arrowMatch = slice.match(ARROW_RE);
        if (arrowMatch && arrowMatch.index === 0) {
            if (i > segStart) tokens.push({ startIndex: segStart, scopes: 'identifier' });
            tokens.push({ startIndex: i, scopes: 'operator' });
            i += arrowMatch[0].length;
            segStart = i;
            continue;
        }

        i++;
    }

    if (segStart < line.length) tokens.push({ startIndex: segStart, scopes: 'identifier' });

    return tokens.length ? tokens : [{ startIndex: 0, scopes: 'identifier' }];
};

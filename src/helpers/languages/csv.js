const COL_TOKENS = [
    'keyword',
    'string',
    'number',
    'entity.name.function',
    'type',
    'variable.parameter',
    'comment',
    'variable',
    'operator',
    'selector',
];

export const id = 'csv';
export const extensions = ['.csv'];
export const mimetypes = ['text/csv'];

export const tokenize = line => {
    const tokens = [];
    let col = 0;
    let i = 0;

    while (i < line.length) {
        if (line[i] === ',') {
            tokens.push({ startIndex: i, scopes: 'delimiter' });
            i++;
            col++;
            continue;
        }

        tokens.push({ startIndex: i, scopes: COL_TOKENS[col % COL_TOKENS.length] });

        if (line[i] === '"') {
            i++;
            while (i < line.length) {
                if (line[i] === '"') {
                    i++;
                    if (line[i] !== '"') break;
                    i++;
                } else {
                    i++;
                }
            }
        } else {
            while (i < line.length && line[i] !== ',') i++;
        }
    }

    return tokens;
};

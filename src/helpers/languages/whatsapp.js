const COL_TOKENS = [
    'keyword',
    'string',
    'number',
    'entity.name.function',
    'type',
    'variable.parameter',
    'variable',
    'operator',
    'selector',
];

const URL_RE = /https?:\/\/[^\s]+/g;

const hashSender = name => {
    let h = 5381;
    for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) & 0xffff;
    return Math.abs(h) % COL_TOKENS.length;
};

const tokenizeBody = (line, offset, senderToken) => {
    const tokens = [];
    URL_RE.lastIndex = 0;
    let last = 0;
    let match;
    while ((match = URL_RE.exec(line)) !== null) {
        if (match.index > last) tokens.push({ startIndex: offset + last, scopes: senderToken });
        tokens.push({ startIndex: offset + match.index, scopes: 'markup.underline.link' });
        last = match.index + match[0].length;
    }
    tokens.push({ startIndex: offset + last, scopes: senderToken });
    return tokens;
};

const parseLine = line => {
    // Bracket format: [date, time] Name: message
    if (line[0] === '[') {
        const closeIdx = line.indexOf(']');
        if (closeIdx === -1) return null;
        let nameStart = closeIdx + 1;
        while (nameStart < line.length && line[nameStart] === ' ') nameStart++;
        const colonIdx = line.indexOf(':', nameStart);
        if (colonIdx === -1 || colonIdx === nameStart) return null;
        return { tsEnd: closeIdx + 1, nameStart, colonIdx };
    }

    // Dash format: dd/mm/yyyy, hh:mm - Name: message
    const dashIdx = line.indexOf(' - ');
    if (dashIdx !== -1 && /^\d/.test(line)) {
        const nameStart = dashIdx + 3;
        const colonIdx = line.indexOf(':', nameStart);
        if (colonIdx === -1 || colonIdx === nameStart) return null;
        return { tsEnd: dashIdx + 3, nameStart, colonIdx };
    }

    return null;
};

export const id = 'whatsapp';
export const extensions = ['.wachat'];
export const mimetypes = ['text/x-whatsapp'];

export const tokenize = line => {
    // U+200E (LTR mark) or empty → comment
    if (!line || line.charCodeAt(0) === 0x200e) return [{ startIndex: 0, scopes: 'comment' }];

    const parsed = parseLine(line);

    if (!parsed) return [];

    const { tsEnd, nameStart, colonIdx } = parsed;
    const name = line.slice(nameStart, colonIdx);
    const senderToken = COL_TOKENS[hashSender(name)];
    const msgStart = colonIdx + 2;

    const tokens = [
        { startIndex: 0, scopes: 'comment' },
        { startIndex: nameStart, scopes: senderToken },
        { startIndex: colonIdx, scopes: 'delimiter' },
    ];

    if (msgStart < line.length) {
        tokens.push(...tokenizeBody(line, msgStart, senderToken));
    }

    return tokens;
};

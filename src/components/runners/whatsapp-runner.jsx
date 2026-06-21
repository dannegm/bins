import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';

const URL_RE = /https?:\/\/[^\s]+/g;

const hashSender = name => {
    let h = 5381;
    for (let i = 0; i < name.length; i++) h = ((h << 5) + h + name.charCodeAt(i)) & 0xffff;
    return Math.abs(h);
};

const senderColor = name => {
    const hue = (hashSender(name) * 137) % 360;
    return `hsl(${hue}, 65%, 62%)`;
};

const extractTime = timestamp => {
    const match = timestamp.match(/(\d{1,2}:\d{2})(?::\d{2})?(?:\s*([AaPp][Mm]))?/);
    if (!match) return timestamp;
    return match[2] ? `${match[1]} ${match[2].toUpperCase()}` : match[1];
};

const extractDate = timestamp => timestamp.split(',')[0].trim();

const parseDate = str => {
    const parts = str.split(/[\/\-\.]/).map(Number);
    if (parts.length !== 3 || parts.some(isNaN)) return null;
    const [a, b, c] = parts;
    let day, month, year;
    if (a > 1000) {
        [year, month, day] = [a, b - 1, c];
    } else if (c > 1000) {
        year = c;
        if (a > 12) {
            day = a;
            month = b - 1;
        } else if (b > 12) {
            month = a - 1;
            day = b;
        } else {
            day = a;
            month = b - 1;
        }
    } else {
        year = c + 2000;
        if (a > 12) {
            day = a;
            month = b - 1;
        } else if (b > 12) {
            month = a - 1;
            day = b;
        } else {
            day = a;
            month = b - 1;
        }
    }
    return new Date(year, month, day);
};

const formatDate = str => {
    const date = parseDate(str);
    if (!date || isNaN(date.getTime())) return str;
    return new Intl.DateTimeFormat(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
};

const withDateSeparators = messages => {
    const result = [];
    let lastDate = null;
    for (const msg of messages) {
        if (msg.date && msg.date !== lastDate) {
            result.push({ isSeparator: true, date: msg.date });
            lastDate = msg.date;
        }
        result.push(msg);
    }
    return result;
};

const parseChat = raw => {
    if (!raw?.trim()) return [];
    const messages = [];

    for (const rawLine of raw.split('\n')) {
        const isMarked = rawLine.charCodeAt(0) === 0x200e;
        const line = isMarked ? rawLine.slice(1) : rawLine;
        if (!line) continue;

        if (line[0] === '[') {
            const closeIdx = line.indexOf(']');
            if (closeIdx !== -1) {
                const timestamp = line.slice(1, closeIdx);
                let nameStart = closeIdx + 1;
                while (nameStart < line.length && line[nameStart] === ' ') nameStart++;
                const colonIdx = line.indexOf(':', nameStart);
                const text =
                    colonIdx !== -1 && colonIdx > nameStart
                        ? line.slice(colonIdx + 2).replace(/^‎/, '')
                        : line.slice(nameStart).replace(/^‎/, '');
                const sender =
                    colonIdx !== -1 && colonIdx > nameStart
                        ? line.slice(nameStart, colonIdx)
                        : null;
                if (isMarked) {
                    messages.push({
                        isNote: true,
                        sender,
                        time: extractTime(timestamp),
                        date: extractDate(timestamp),
                        text,
                    });
                } else if (colonIdx !== -1 && colonIdx > nameStart) {
                    messages.push({
                        sender: line.slice(nameStart, colonIdx),
                        time: extractTime(timestamp),
                        date: extractDate(timestamp),
                        text,
                        isSystem: false,
                    });
                } else {
                    messages.push({ sender: null, time: '', date: null, text, isSystem: true });
                }
                continue;
            }
        }

        const dashIdx = line.indexOf(' - ');
        if (dashIdx !== -1 && /^\d/.test(line)) {
            const timestamp = line.slice(0, dashIdx);
            const nameStart = dashIdx + 3;
            const colonIdx = line.indexOf(':', nameStart);
            const text =
                colonIdx !== -1 && colonIdx > nameStart
                    ? line.slice(colonIdx + 2).replace(/^‎/, '')
                    : line.slice(nameStart).replace(/^‎/, '');
            const sender =
                colonIdx !== -1 && colonIdx > nameStart ? line.slice(nameStart, colonIdx) : null;
            if (isMarked) {
                messages.push({
                    isNote: true,
                    sender,
                    time: extractTime(timestamp),
                    date: extractDate(timestamp),
                    text,
                });
            } else if (colonIdx !== -1 && colonIdx > nameStart) {
                messages.push({
                    sender: line.slice(nameStart, colonIdx),
                    time: extractTime(timestamp),
                    date: extractDate(timestamp),
                    text,
                    isSystem: false,
                });
            } else {
                messages.push({ sender: null, time: '', date: null, text, isSystem: true });
            }
            continue;
        }

        if (isMarked) {
            messages.push({ isNote: true, time: '', date: null, text: line });
        } else if (messages.length > 0 && !messages[messages.length - 1].isSystem) {
            messages[messages.length - 1].text += '\n' + line;
        }
    }

    return messages;
};

const renderText = text => {
    URL_RE.lastIndex = 0;
    const parts = [];
    let last = 0;
    let match;
    while ((match = URL_RE.exec(text)) !== null) {
        if (match.index > last) parts.push(text.slice(last, match.index));
        parts.push(
            <a
                key={match.index}
                href={match[0]}
                target='_blank'
                rel='noreferrer'
                className='break-all underline'
            >
                {match[0]}
            </a>,
        );
        last = match.index + match[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
};

const DateSeparator = ({ date }) => (
    <div className='sticky top-0 z-10 flex justify-center py-2'>
        <span className='rounded-full bg-surface-raised px-3 py-1 text-[11px] text-muted-foreground'>
            {formatDate(date)}
        </span>
    </div>
);

const Note = ({ text, time, isMe }) => (
    <div className={cn('flex', { 'justify-end': isMe, 'justify-start': !isMe })}>
        <div
            className={cn(
                'max-w-[75%] rounded-2xl px-3 py-2',
                isMe ? 'rounded-tr-xs bg-brand/10' : 'rounded-tl-xs bg-surface-raised/50',
            )}
        >
            <p className='text-sm italic text-muted-foreground text-pretty'>{text}</p>
            {time && (
                <div
                    className={cn(
                        'text-[10px] text-muted-foreground',
                        isMe ? 'text-right' : 'text-left',
                    )}
                >
                    {time}
                </div>
            )}
        </div>
    </div>
);

const SystemMessage = ({ text }) => (
    <div className='flex justify-center py-1'>
        <span className='rounded-full bg-surface-raised px-3 py-1 text-xs text-muted-foreground'>
            {text}
        </span>
    </div>
);

const Bubble = ({ message, isMe, showName, color }) => (
    <div className={cn('flex', { 'justify-end': isMe, 'justify-start': !isMe })}>
        <div
            className={cn(
                'max-w-[75%] rounded-2xl px-3 py-2',
                isMe ? 'rounded-tr-xs bg-brand/20' : 'rounded-tl-xs bg-surface-raised',
            )}
        >
            {showName && !isMe && (
                <div className='mb-0.5 text-xs font-semibold' style={{ '--sender-color': color }}>
                    <span className='text-(--sender-color)'>{message.sender}</span>
                </div>
            )}
            <p className='whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-foreground text-pretty'>
                {renderText(message.text)}
            </p>
            <div
                className={cn(
                    'text-[10px] text-muted-foreground',
                    isMe ? 'text-right' : 'text-left',
                )}
            >
                {message.time}
            </div>
        </div>
    </div>
);

const EmptyState = ({ label }) => (
    <div className='flex h-full items-center justify-center text-xs text-muted-foreground'>
        {label}
    </div>
);

const ChatView = ({ messages, firstSender, isGroup }) => {
    const items = useMemo(() => withDateSeparators(messages), [messages]);

    return (
        <div className='h-full overflow-y-auto'>
            <div className='flex flex-col gap-1.5 p-4'>
                {items.map((item, i) => {
                    if (item.isSeparator)
                        return <DateSeparator key={`sep-${i}`} date={item.date} />;
                    if (item.isNote)
                        return (
                            <Note
                                key={i}
                                text={item.text}
                                time={item.time}
                                isMe={item.sender === firstSender}
                            />
                        );
                    if (item.isSystem) return <SystemMessage key={i} text={item.text} />;
                    return (
                        <Bubble
                            key={i}
                            message={item}
                            isMe={item.sender === firstSender}
                            showName={isGroup}
                            color={senderColor(item.sender)}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export const WhatsAppRunner = ({ content }) => {
    const { t } = useTranslation();
    const messages = useMemo(() => parseChat(content ?? ''), [content]);

    if (messages.length === 0)
        return <EmptyState label={t('editor.runner_panel.whatsapp.empty')} />;

    const firstSender = messages.find(m => !m.isSystem && !m.isNote)?.sender;
    const senders = [...new Set(messages.filter(m => !m.isSystem && !m.isNote).map(m => m.sender))];

    return <ChatView messages={messages} firstSender={firstSender} isGroup={senders.length > 2} />;
};

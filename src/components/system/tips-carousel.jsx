import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { ChevronLeft, ChevronRight, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TIPS } from '@/constants/tips';
import { Checkbox } from '@/ui/checkbox';
import { Kbd, KbdGroup } from '@/ui/kbd';
import { useSettings } from '@/hooks/use-settings';
import { getLanguage } from '@/constants/languages';
import { cn } from '@/helpers/utils';

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent);

const KEY_LABELS = { mod: isMac ? '⌘' : 'Ctrl', shift: isMac ? '⇧' : 'Shift', alt: isMac ? '⌥' : 'Alt', ctrl: 'Ctrl', meta: '⌘' };
const formatKey = k => KEY_LABELS[k] ?? k.toUpperCase();

const KBD_CLASS = 'bg-(--tip-color-light)/15 dark:bg-(--tip-color-dark)/15 text-(--tip-color-light) dark:text-(--tip-color-dark) border-(--tip-color-light)/30 dark:border-(--tip-color-dark)/30';

const RULES = [
    {
        pattern: /\*\*(.+?)\*\*/,
        render: (match, i) => <strong key={i}>{match[1]}</strong>,
    },
    {
        pattern: /\*(.+?)\*|_(.+?)_/,
        render: (match, i) => <em key={i}>{match[1] ?? match[2]}</em>,
    },
    {
        pattern: /\{\{icon:([a-z0-9-]+)\}\}/,
        render: (match, i) => (
            <span key={i} className='inline-flex align-middle mx-0.5 [&>svg]:size-3'>
                <DynamicIcon name={match[1]} />
            </span>
        ),
    },
    {
        pattern: /\{\{kbd:([^}]+)\}\}/,
        render: (match, i) => (
            <Kbd key={i} className={cn('mx-0.5 align-middle', KBD_CLASS)}>
                {match[1]}
            </Kbd>
        ),
    },
    {
        pattern: /\{\{shortcut:([a-z_]+)\}\}/,
        render: (match, i, ctx) => {
            const binding = ctx?.appKeybindings?.[match[1]] ?? match[1];
            const keys = binding.split('+').map(formatKey);
            return (
                <KbdGroup key={i} className='mx-0.5 align-middle'>
                    {keys.map((k, j) => <Kbd key={j} className={KBD_CLASS}>{k}</Kbd>)}
                </KbdGroup>
            );
        },
    },
    {
        pattern: /\{\{color:([^}]+)\}\}/,
        render: (match, i) => (
            <span
                key={i}
                className='inline-block size-2.5 rounded-full mx-0.5 align-middle bg-(--swatch)'
                style={{ '--swatch': match[1] }}
            />
        ),
    },
    {
        pattern: /\{\{lang:([a-z0-9]+)\}\}/,
        render: (match, i) => {
            const lang = getLanguage(match[1]);
            if (lang.icon)
                return <i key={i} className={cn(lang.icon, 'colored mx-0.5 align-middle text-sm leading-none')} style={{ color: lang.color }} />;
            return <span key={i} className='inline-block size-2 rounded-full mx-0.5 align-middle bg-(--dot)' style={{ '--dot': lang.color }} />;
        },
    },
    {
        pattern: /\{\{link:([^|]+)\|([^}]+)\}\}/,
        render: (match, i) => (
            <a
                key={i}
                href={match[2]}
                className='underline decoration-dotted underline-offset-2 transition-opacity hover:opacity-70 text-(--tip-color-light) dark:text-(--tip-color-dark)'
            >
                {match[1]}
            </a>
        ),
    },
];

const parseInline = text => {
    const parts = [];
    let remaining = text;

    while (remaining.length > 0) {
        let earliest = null;
        let matchedRule = null;

        for (const rule of RULES) {
            const match = rule.pattern.exec(remaining);
            if (match && (!earliest || match.index < earliest.index)) {
                earliest = match;
                matchedRule = rule;
            }
        }

        if (!earliest) {
            parts.push({ type: 'text', content: remaining });
            break;
        }

        if (earliest.index > 0) parts.push({ type: 'text', content: remaining.slice(0, earliest.index) });
        parts.push({ type: 'match', rule: matchedRule, match: earliest });
        remaining = remaining.slice(earliest.index + earliest[0].length);
    }

    return parts;
};

const RichText = ({ text, className, context }) => (
    <span className={className}>
        {parseInline(text).map((part, i) =>
            part.type === 'text' ? part.content : part.rule.render(part.match, i, context),
        )}
    </span>
);

const TIPS_PER_SESSION = 5;
const INTERVAL = 10000;

const COLORS = [
    '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899',
    '#8b5cf6', '#14b8a6', '#f97316', '#ef4444', '#84cc16',
    '#06b6d4', '#a855f7', '#f43f5e', '#22c55e', '#eab308',
    '#3b82f6', '#d946ef', '#fb923c', '#34d399', '#818cf8',
];

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

const pickTips = (exclude = []) => {
    const excludeIds = new Set(exclude.map(t => t.id));
    const pool = TIPS.filter(t => !excludeIds.has(t.id));
    const selected = shuffle(pool.length >= TIPS_PER_SESSION ? pool : TIPS).slice(0, TIPS_PER_SESSION);
    const colors = shuffle(COLORS).slice(0, selected.length);
    return selected.map((tip, i) => ({ ...tip, color: colors[i] }));
};

export const TipsCarousel = ({ onClose }) => {
    const { t } = useTranslation();
    const [tipsEnabled, setTipsEnabled] = useSettings('tipsEnabled');
    const [appKeybindings] = useSettings('appKeybindings');
    const [tips, setTips] = useState(() => pickTips());
    const [active, setActive] = useState(0);
    const [epoch, setEpoch] = useState(0);

    const isWidget = !!onClose;
    const tip = tips[active];
    const tipTitle = t(`editor.tips.${tip.id}.title`);
    const tipBody = t(`editor.tips.${tip.id}.body`);

    useEffect(() => {
        const id = setInterval(() => setActive(i => (i + 1) % tips.length), INTERVAL);
        return () => clearInterval(id);
    }, [epoch, tips]);

    const go = index => {
        setActive((index + tips.length) % tips.length);
        setEpoch(e => e + 1);
    };

    const refresh = () => {
        setTips(prev => pickTips(prev));
        setActive(0);
        setEpoch(e => e + 1);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'relative flex flex-col rounded-xl transition-colors duration-700',
                'bg-(--tip-bg-light) dark:bg-(--tip-bg-dark)',
                isWidget
                    ? 'absolute bottom-3 left-3 right-3 z-10 gap-2 p-4 shadow-lg shadow-black/30 ring-1 ring-(--tip-color-light)/30 dark:ring-(--tip-color-dark)/30 sm:left-auto sm:w-104 sm:gap-4 sm:p-6'
                    : 'gap-4 p-6',
            )}
            style={{
                '--tip-color-dark': tip.color,
                '--tip-color-light': `color-mix(in srgb, ${tip.color} 80%, white)`,
                '--tip-bg-dark': `color-mix(in srgb, ${tip.color} 15%, #27272a)`,
                '--tip-bg-light': `color-mix(in srgb, ${tip.color} 20%, white)`,
                '--tip-icon-bg-dark': `color-mix(in srgb, ${tip.color} 25%, #27272a)`,
                '--tip-icon-bg-light': `color-mix(in srgb, ${tip.color} 30%, white)`,
            }}
        >
            {isWidget && (
                <button
                    onClick={onClose}
                    className='absolute top-3 right-3 rounded p-1 transition-opacity hover:opacity-70 text-(--tip-color-light) dark:text-(--tip-color-dark)'
                >
                    <X className='size-3.5' />
                </button>
            )}

            <AnimatePresence mode='wait'>
                <motion.div
                    key={`${epoch}-${active}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className='flex items-start gap-3 sm:gap-4'
                >
                    <div className='flex size-8 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4 sm:size-10 sm:[&>svg]:size-5 bg-(--tip-icon-bg-light) dark:bg-(--tip-icon-bg-dark) text-(--tip-color-light) dark:text-(--tip-color-dark)'>
                        <DynamicIcon name={tip.icon} />
                    </div>
                    <div className='flex flex-col gap-0.5 sm:gap-1 pr-4'>
                        <RichText
                            text={tipTitle}
                            className='text-xs font-semibold sm:text-sm text-(--tip-color-light) dark:text-(--tip-color-dark)'
                            context={{ appKeybindings }}
                        />
                        <RichText
                            text={tipBody}
                            className='text-xs sm:text-sm text-(--tip-color-light) dark:text-(--tip-color-dark)'
                            context={{ appKeybindings }}
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className='flex items-center gap-2'>
                <button
                    onClick={refresh}
                    className='transition-opacity hover:opacity-70 text-(--tip-color-light) dark:text-(--tip-color-dark)'
                >
                    <RefreshCw className='size-4 sm:size-3.5' />
                </button>

                <div className='flex items-center'>
                    <button
                        onClick={() => go(active - 1)}
                        className='transition-opacity hover:opacity-70 text-(--tip-color-light) dark:text-(--tip-color-dark)'
                    >
                        <ChevronLeft className='size-5 sm:size-4' />
                    </button>
                    <button
                        onClick={() => go(active + 1)}
                        className='transition-opacity hover:opacity-70 text-(--tip-color-light) dark:text-(--tip-color-dark)'
                    >
                        <ChevronRight className='size-5 sm:size-4' />
                    </button>
                </div>

                <div className='flex flex-1 items-center gap-1.5'>
                    {tips.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => go(i)}
                            className={cn(
                                'h-1 rounded-full transition-all duration-300 bg-(--tip-color-light) dark:bg-(--tip-color-dark)',
                                { 'w-4': i === active, 'w-1 opacity-30': i !== active },
                            )}
                        />
                    ))}
                </div>
            </div>

            {isWidget && (
                <div className='flex items-center gap-2.5 mt-1 sm:-mt-1 opacity-70'>
                    <Checkbox
                        checked={tipsEnabled ?? true}
                        onCheckedChange={checked => setTipsEnabled(checked)}
                        id='tips-show-again'
                        className='border-[1.5px] border-(--tip-color-light) dark:border-(--tip-color-dark)'
                    />
                    <label
                        htmlFor='tips-show-again'
                        className='cursor-pointer select-none text-xs text-(--tip-color-light) dark:text-(--tip-color-dark)'
                    >
                        {t('editor.tips_widget.show_again')}
                    </label>
                </div>
            )}
        </motion.div>
    );
};

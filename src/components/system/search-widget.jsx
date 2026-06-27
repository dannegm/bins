import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { X, ChevronUp, ChevronDown, CaseSensitive, Regex, WholeWord, Replace } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useHotkeys } from 'react-hotkeys-hook';
import { cn } from '@/helpers/utils';
import { settings } from '@/services/settings';

const PADDING = 12;
const SNAP_ZONE = 40 + PADDING;
const WORD_SEPS = '`~!@#$%^&*()-=+[{}]\\|;:\'",.<>/?';

const injectStyles = () => {
    if (document.getElementById('search-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'search-widget-styles';
    style.textContent = `
        .sw-match { background-color: rgba(234,179,8,0.28) !important; }
        .sw-match-active { background-color: rgba(234,179,8,0.55) !important; outline: 1px solid rgba(234,179,8,0.9); outline-offset: -1px; }
    `;
    document.head.appendChild(style);
};

const FlagButton = ({ active, onClick, title, children }) => (
    <button
        type='button'
        title={title}
        onClick={onClick}
        className={cn(
            'flex size-6 shrink-0 items-center justify-center rounded transition-colors',
            {
                'bg-brand text-brand-foreground': active,
                'text-muted-foreground hover:bg-surface-raised hover:text-foreground': !active,
            },
        )}
    >
        {children}
    </button>
);

const NavButton = ({ onClick, disabled, title, children }) => (
    <button
        type='button'
        title={title}
        onClick={onClick}
        disabled={disabled}
        className='flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground disabled:pointer-events-none disabled:opacity-40'
    >
        {children}
    </button>
);

export const SearchWidget = ({ editorRef, onClose }) => {
    const { t } = useTranslation();
    const $widget = useRef(null);
    const $queryInput = useRef(null);
    const $decs = useRef(null);

    const [pos, setPos] = useState(() => settings.get('searchWidget', { x: 0, y: 0 }));
    const [isDragging, setIsDragging] = useState(false);

    const [query, setQuery] = useState('');
    const [replace, setReplace] = useState('');
    const [showReplace, setShowReplace] = useState(false);
    const [matchCase, setMatchCase] = useState(false);
    const [useRegex, setUseRegex] = useState(false);
    const [wholeWord, setWholeWord] = useState(false);
    const [matches, setMatches] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        injectStyles();
        const editor = editorRef.current;
        if (!editor) return;
        $decs.current = editor.createDecorationsCollection([]);

        return () => {
            $decs.current?.clear();
            $decs.current = null;
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => $queryInput.current?.focus(), 50);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!$widget.current) return;
        const saved = settings.get('searchWidget', null);
        if (saved?.x || saved?.y) return;
        const container = $widget.current.parentElement;
        if (!container) return;
        const x = container.clientWidth - $widget.current.offsetWidth - PADDING;
        const y = PADDING;
        setPos({ x, y });
        settings.set('searchWidget', { x, y });
    }, []);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        if (!query) {
            $decs.current?.clear();
            setMatches([]);
            setActiveIdx(0);
            setHasError(false);
            return;
        }
        try {
            const found = editor.getModel().findMatches(
                query, false, useRegex, matchCase, wholeWord ? WORD_SEPS : null, false,
            );
            setMatches(found);
            setActiveIdx(0);
            setHasError(false);
        } catch {
            setHasError(true);
            $decs.current?.clear();
            setMatches([]);
        }
    }, [query, matchCase, useRegex, wholeWord]);

    useEffect(() => {
        if (!$decs.current) return;
        $decs.current.set(
            matches.map((m, i) => ({
                range: m.range,
                options: {
                    inlineClassName: i === activeIdx ? 'sw-match-active' : 'sw-match',
                    overviewRuler: { color: i === activeIdx ? '#eab308' : '#eab30880', position: 4 },
                },
            })),
        );
        if (matches[activeIdx]) {
            editorRef.current?.revealRangeInCenter(matches[activeIdx].range, 1);
        }
    }, [matches, activeIdx]);

    const goNext = useCallback(() => {
        if (!matches.length) return;
        setActiveIdx(i => (i + 1) % matches.length);
    }, [matches.length]);

    const goPrev = useCallback(() => {
        if (!matches.length) return;
        setActiveIdx(i => (i - 1 + matches.length) % matches.length);
    }, [matches.length]);

    const doReplace = useCallback(() => {
        const editor = editorRef.current;
        const match = matches[activeIdx];
        if (!editor || !match) return;
        editor.executeEdits('search-widget', [{ range: match.range, text: replace }]);
    }, [matches, activeIdx, replace]);

    const doReplaceAll = useCallback(() => {
        const editor = editorRef.current;
        if (!editor || !matches.length) return;
        editor.executeEdits(
            'search-widget',
            [...matches].reverse().map(m => ({ range: m.range, text: replace })),
        );
    }, [matches, replace]);

    useHotkeys('escape', () => onClose(), { enableOnFormTags: true });
    useHotkeys('enter', () => goNext(), { enableOnFormTags: true });
    useHotkeys('shift+enter', e => { e.preventDefault(); goPrev(); }, { enableOnFormTags: true });

    const snapToCorner = useCallback(() => {
        const container = $widget.current?.parentElement;
        const widget = $widget.current;
        if (!container || !widget) return;
        setPos(cur => {
            const maxX = container.clientWidth - widget.offsetWidth;
            const maxY = container.clientHeight - widget.offsetHeight;
            const snapX = cur.x < SNAP_ZONE ? PADDING : cur.x > maxX - SNAP_ZONE ? maxX - PADDING : cur.x;
            const snapY = cur.y < SNAP_ZONE ? PADDING : cur.y > maxY - SNAP_ZONE ? maxY - PADDING : cur.y;
            settings.set('searchWidget', { x: snapX, y: snapY });
            return { x: snapX, y: snapY };
        });
        setIsDragging(false);
    }, []);

    const handlePointerDown = useCallback(e => {
        if (e.button !== 0) return;
        e.preventDefault();
        const widget = $widget.current;
        const container = widget?.parentElement;
        if (!widget || !container) return;

        const widgetRect = widget.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const offsetX = e.clientX - widgetRect.left;
        const offsetY = e.clientY - widgetRect.top;

        setIsDragging(true);

        const onMove = e => {
            const x = Math.max(0, Math.min(
                container.clientWidth - widget.offsetWidth,
                e.clientX - containerRect.left - offsetX,
            ));
            const y = Math.max(0, Math.min(
                container.clientHeight - widget.offsetHeight,
                e.clientY - containerRect.top - offsetY,
            ));
            setPos({ x, y });
        };

        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            snapToCorner();
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }, [snapToCorner]);

    const matchLabel = query
        ? matches.length === 0
            ? t('editor.search_widget.no_results')
            : `${activeIdx + 1} / ${matches.length}`
        : '';

    return (
        <motion.div
            ref={$widget}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.1 }}
            style={{
                left: pos.x,
                top: pos.y,
                transition: isDragging ? 'none' : 'left 0.2s cubic-bezier(0.4,0,0.2,1), top 0.2s cubic-bezier(0.4,0,0.2,1)',
            }}
            className='absolute z-50 w-80 overflow-hidden rounded-lg border border-border bg-surface shadow-lg shadow-black/30'
        >
            {/* Drag handle */}
            <div
                onPointerDown={handlePointerDown}
                className='flex h-7 cursor-grab items-center gap-1 border-b border-border px-2 active:cursor-grabbing'
            >
                <span className='flex-1 select-none text-xs font-medium text-muted-foreground'>
                    {t('editor.search_widget.title')}
                </span>
                <button
                    type='button'
                    onClick={() => setShowReplace(v => !v)}
                    title={t('editor.search_widget.toggle_replace')}
                    className={cn(
                        'flex size-5 items-center justify-center rounded transition-colors',
                        {
                            'text-brand': showReplace,
                            'text-muted-foreground hover:text-foreground': !showReplace,
                        },
                    )}
                >
                    <Replace className='size-3' />
                </button>
                <button
                    type='button'
                    onClick={onClose}
                    title={t('editor.search_widget.close')}
                    className='flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground'
                >
                    <X className='size-3' />
                </button>
            </div>

            <div className='flex flex-col gap-1 p-2'>
                {/* Search row */}
                <div className='flex items-center gap-1'>
                    <div className='relative flex flex-1 items-center'>
                        <input
                            ref={$queryInput}
                            type='text'
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder={t('editor.search_widget.placeholder')}
                            className={cn(
                                'h-7 w-full rounded border bg-surface-raised px-2 pr-16 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand',
                                {
                                    'border-destructive': hasError,
                                    'border-border': !hasError,
                                },
                            )}
                        />
                        <span className='pointer-events-none absolute right-2 text-[10px] text-muted-foreground'>
                            {matchLabel}
                        </span>
                    </div>
                    <NavButton onClick={goPrev} disabled={!matches.length} title={t('editor.search_widget.prev_match')}>
                        <ChevronUp className='size-3.5' />
                    </NavButton>
                    <NavButton onClick={goNext} disabled={!matches.length} title={t('editor.search_widget.next_match')}>
                        <ChevronDown className='size-3.5' />
                    </NavButton>
                </div>

                {/* Replace row */}
                {showReplace && (
                    <div className='flex items-center gap-1'>
                        <input
                            type='text'
                            value={replace}
                            onChange={e => setReplace(e.target.value)}
                            placeholder={t('editor.search_widget.replace_placeholder')}
                            className='h-7 flex-1 rounded border border-border bg-surface-raised px-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-brand'
                        />
                        <NavButton onClick={doReplace} disabled={!matches.length} title={t('editor.search_widget.replace')}>
                            <Replace className='size-3.5' />
                        </NavButton>
                        <NavButton onClick={doReplaceAll} disabled={!matches.length} title={t('editor.search_widget.replace_all')}>
                            <span className='text-[10px] font-semibold leading-none'>A→</span>
                        </NavButton>
                    </div>
                )}

                {/* Flags row */}
                <div className='flex items-center gap-1 pt-0.5'>
                    <FlagButton active={matchCase} onClick={() => setMatchCase(v => !v)} title={t('editor.search_widget.match_case')}>
                        <CaseSensitive className='size-3.5' />
                    </FlagButton>
                    <FlagButton active={wholeWord} onClick={() => setWholeWord(v => !v)} title={t('editor.search_widget.whole_word')}>
                        <WholeWord className='size-3.5' />
                    </FlagButton>
                    <FlagButton active={useRegex} onClick={() => setUseRegex(v => !v)} title={t('editor.search_widget.use_regex')}>
                        <Regex className='size-3.5' />
                    </FlagButton>
                </div>
            </div>
        </motion.div>
    );
};

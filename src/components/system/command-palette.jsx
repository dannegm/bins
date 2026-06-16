import { useState, useCallback, useRef, useEffect } from 'react';
import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'motion/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { ChevronRight, X } from 'lucide-react';
import { useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Kbd, KbdGroup } from '@/ui/kbd';
import { useEvents } from '@/providers/bus-provider';
import { useCommandPalette } from '@/providers/command-palette-provider';
import { useSettings } from '@/hooks/use-settings';
import { defaultSettings } from '@/constants/default-settings';
import { formatBinding } from '@/hooks/use-hotkey';
import { createCommands, createPages } from '@/constants/commands';

const matchesScope = (scope, pathname) => scope === '*' || scope.some(s => pathname.startsWith(s));

export const CommandPalette = () => {
    const { t } = useTranslation();
    const { isOpen, close } = useCommandPalette();
    const { emit } = useEvents();
    const pathname = useRouterState({ select: s => s.location.pathname });
    const [appKeybindings] = useSettings('appKeybindings', defaultSettings.appKeybindings);
    const [pages, setPages] = useState([]);
    const [search, setSearch] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [quickMap, setQuickMap] = useState({});
    const $list = useRef(null);

    useEffect(() => {
        if (!search) {
            setIsTyping(false);
            return;
        }
        setIsTyping(true);
        const id = setTimeout(() => setIsTyping(false), 500);
        return () => clearTimeout(id);
    }, [search]);

    const currentPage = pages[pages.length - 1] ?? 'root';
    const pages_map = createPages({ emit });

    const shortcut = id => {
        const raw = id && (appKeybindings[id] ?? defaultSettings.appKeybindings[id]);
        return raw ? formatBinding(raw) : null;
    };

    const commands = createCommands({ emit })
        .map(group => ({
            ...group,
            items: group.items.filter(item => matchesScope(item.scope, pathname)),
        }))
        .filter(group => group.items.length > 0);

    const navigate = useCallback(page => {
        setPages(prev => [...prev, page]);
        setSearch('');
    }, []);

    const goBack = useCallback(() => {
        setPages(prev => prev.slice(0, -1));
        setSearch('');
    }, []);

    const handleClose = useCallback(() => {
        close();
        setPages([]);
        setSearch('');
    }, [close]);

    const run = useCallback(
        action => {
            action();
            handleClose();
        },
        [handleClose],
    );

    const handleKeyDown = useCallback(
        e => {
            const digit = parseInt(e.key);
            if (digit >= 1 && digit <= 9 && !isTyping && !e.metaKey && !e.ctrlKey && !e.altKey) {
                e.preventDefault();
                const items = [...($list.current?.querySelectorAll('[cmdk-item]') ?? [])].filter(
                    el => el.offsetParent !== null,
                );
                items[digit - 1]?.click();
                return;
            }
            if (e.key === 'Escape') {
                if (pages.length > 0) goBack();
                else handleClose();
            }
            if (e.key === 'Backspace' && !search && pages.length > 0) goBack();
        },
        [pages, search, isTyping, goBack, handleClose],
    );

    const pageData = currentPage !== 'root' ? pages_map[currentPage] : null;

    useEffect(() => {
        const id = setTimeout(() => {
            const visible = [...($list.current?.querySelectorAll('[cmdk-item]') ?? [])].filter(
                el => el.offsetParent !== null,
            );
            const map = {};
            visible.slice(0, 9).forEach((el, i) => {
                const val = el.getAttribute('data-value');
                if (val) map[val] = i + 1;
            });
            setQuickMap(map);
        }, 0);
        return () => clearTimeout(id);
    }, [search, isTyping, currentPage, isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className='fixed inset-0 z-50 flex items-start justify-center pt-[20vh]'
                    onClick={handleClose}
                >
                    <div className='absolute inset-0 bg-overlay backdrop-blur-xs' />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className='relative z-10 w-full max-w-lg'
                        onClick={e => e.stopPropagation()}
                    >
                        <Command
                            className='overflow-hidden rounded-xl border border-border bg-popover shadow-2xl shadow-black/50'
                            onKeyDown={handleKeyDown}
                            loop
                        >
                            <div className='flex items-center border-b border-border'>
                                {pages.length > 0 && (
                                    <div className='flex shrink-0 items-center gap-1 pl-4'>
                                        {pages.map((p, i) => (
                                            <div key={p} className='flex items-center gap-1'>
                                                {i > 0 && (
                                                    <ChevronRight className='size-3 text-muted-foreground' />
                                                )}
                                                <button
                                                    onClick={
                                                        i < pages.length - 1
                                                            ? () =>
                                                                  setPages(prev =>
                                                                      prev.slice(0, i + 1),
                                                                  )
                                                            : undefined
                                                    }
                                                    className='flex items-center gap-1 rounded bg-accent px-2 py-0.5 text-xs text-accent-foreground'
                                                >
                                                    {pages_map[p]?.title ?? p}
                                                    {i === pages.length - 1 && (
                                                        <X
                                                            className='size-3 opacity-60 hover:opacity-100'
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                goBack();
                                                            }}
                                                        />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <Command.Input
                                    value={search}
                                    onValueChange={setSearch}
                                    autoFocus
                                    placeholder={
                                        pageData
                                            ? `Filter ${pageData.title}…`
                                            : t('command_palette.placeholder')
                                    }
                                    className='min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none'
                                />
                            </div>

                            <Command.List ref={$list} className='max-h-80 overflow-y-auto p-2'>
                                <Command.Empty className='py-8 text-center text-sm text-muted-foreground'>
                                    {t('command_palette.empty')}
                                </Command.Empty>

                                {currentPage === 'root' &&
                                    commands.map(({ group, items }) => (
                                        <Command.Group
                                            key={group}
                                            heading={group}
                                            className='**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:pt-3 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:text-muted-foreground'
                                        >
                                            {items.map(
                                                ({ id, label, icon, shortcutId, action, page }) => {
                                                    const keys = shortcut(shortcutId);
                                                    const num = quickMap[id] ?? null;
                                                    return (
                                                        <Command.Item
                                                            key={id}
                                                            value={id}
                                                            keywords={[label]}
                                                            onSelect={() =>
                                                                page ? navigate(page) : run(action)
                                                            }
                                                            className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors aria-selected:bg-accent aria-selected:text-accent-foreground [&>svg]:size-4'
                                                        >
                                                            <div className='text-muted-foreground [&>svg]:size-4'>
                                                                <DynamicIcon name={icon} />
                                                            </div>
                                                            <span className='flex-1'>{label}</span>
                                                            {page && (
                                                                <ChevronRight className='size-3.5 opacity-40' />
                                                            )}
                                                            {keys && (
                                                                <KbdGroup>
                                                                    {keys.map((k, i) => (
                                                                        <Kbd key={i}>{k}</Kbd>
                                                                    ))}
                                                                </KbdGroup>
                                                            )}
                                                            {num && (
                                                                <Kbd
                                                                    className={
                                                                        isTyping
                                                                            ? ''
                                                                            : 'bg-brand/15 text-brand'
                                                                    }
                                                                >
                                                                    {num}
                                                                </Kbd>
                                                            )}
                                                        </Command.Item>
                                                    );
                                                },
                                            )}
                                        </Command.Group>
                                    ))}

                                {currentPage !== 'root' && pageData && (
                                    <Command.Group>
                                        {pageData.items.map(({ id, label, icon, action }) => {
                                            const num = quickMap[id] ?? null;
                                            return (
                                                <Command.Item
                                                    key={id}
                                                    value={id}
                                                    keywords={[label]}
                                                    onSelect={() => run(action)}
                                                    className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors aria-selected:bg-accent aria-selected:text-accent-foreground [&>svg]:size-4'
                                                >
                                                    <div className='text-muted-foreground [&>svg]:size-4'>
                                                        <DynamicIcon name={icon} />
                                                    </div>
                                                    <span className='flex-1'>{label}</span>
                                                    {num && (
                                                        <Kbd
                                                            className={
                                                                isTyping
                                                                    ? ''
                                                                    : 'bg-brand/15 text-brand'
                                                            }
                                                        >
                                                            {num}
                                                        </Kbd>
                                                    )}
                                                </Command.Item>
                                            );
                                        })}
                                    </Command.Group>
                                )}
                            </Command.List>

                            <div className='flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground'>
                                <KbdGroup>
                                    <Kbd>↑</Kbd>
                                    <Kbd>↓</Kbd> {t('command_palette.hint_navigate')}
                                </KbdGroup>
                                <KbdGroup>
                                    <Kbd>↵</Kbd> {t('command_palette.hint_select')}
                                </KbdGroup>
                                <KbdGroup>
                                    <Kbd>1</Kbd>
                                    <Kbd>9</Kbd> {t('command_palette.hint_pick')}
                                </KbdGroup>
                                {pages.length > 0 ? (
                                    <KbdGroup>
                                        <Kbd>⌫</Kbd> {t('command_palette.hint_back')}
                                    </KbdGroup>
                                ) : (
                                    <KbdGroup>
                                        <Kbd>esc</Kbd> {t('command_palette.hint_close')}
                                    </KbdGroup>
                                )}
                            </div>
                        </Command>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

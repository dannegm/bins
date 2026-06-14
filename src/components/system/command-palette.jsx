import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'motion/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Kbd, KbdGroup } from '@/ui/kbd';
import { useEvents } from '@/providers/bus-provider';
import { useCommandPalette } from '@/providers/command-palette-provider';
import { useSettings } from '@/hooks/use-settings';
import { defaultSettings } from '@/constants/default-settings';
import { formatBinding } from '@/hooks/use-hotkey';
import { createCommands } from '@/constants/commands';

const matchesScope = (scope, pathname) =>
    scope === '*' || scope.some(s => pathname.startsWith(s));

export const CommandPalette = () => {
    const { t } = useTranslation();
    const { isOpen, close } = useCommandPalette();
    const { emit } = useEvents();
    const pathname = useRouterState({ select: s => s.location.pathname });
    const [appKeybindings] = useSettings('appKeybindings', defaultSettings.appKeybindings);

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

    const run = action => {
        action();
        close();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className='fixed inset-0 z-50 flex items-start justify-center pt-[20vh]'
                    onClick={close}
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
                            onKeyDown={e => { if (e.key === 'Escape') close(); }}
                            loop
                        >
                            <Command.Input
                                autoFocus
                                placeholder={t('command_palette.placeholder')}
                                className='w-full border-b border-border bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none'
                            />

                            <Command.List className='max-h-80 overflow-y-auto p-2'>
                                <Command.Empty className='py-8 text-center text-sm text-muted-foreground'>
                                    {t('command_palette.empty')}
                                </Command.Empty>

                                {commands.map(({ group, items }) => (
                                    <Command.Group
                                        key={group}
                                        heading={group}
                                        className='**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:pt-3 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:text-muted-foreground'
                                    >
                                        {items.map(({ id, label, icon, shortcutId, action }) => {
                                            const keys = shortcut(shortcutId);
                                            return (
                                                <Command.Item
                                                    key={id}
                                                    value={id}
                                                    keywords={[label]}
                                                    onSelect={() => run(action)}
                                                    className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors aria-selected:bg-accent aria-selected:text-accent-foreground [&>svg]:size-4'
                                                >
                                                    <div className='[&>svg]:size-4 text-muted-foreground'>
                                                        <DynamicIcon name={icon} />
                                                    </div>
                                                    <span className='flex-1'>{label}</span>
                                                    {keys && (
                                                        <KbdGroup>
                                                            {keys.map((k, i) => <Kbd key={i}>{k}</Kbd>)}
                                                        </KbdGroup>
                                                    )}
                                                </Command.Item>
                                            );
                                        })}
                                    </Command.Group>
                                ))}
                            </Command.List>

                            <div className='flex items-center gap-4 border-t border-border px-4 py-2.5 text-[11px] text-muted-foreground'>
                                <KbdGroup><Kbd>↑</Kbd><Kbd>↓</Kbd> {t('command_palette.hint_navigate')}</KbdGroup>
                                <KbdGroup><Kbd>↵</Kbd> {t('command_palette.hint_select')}</KbdGroup>
                                <KbdGroup><Kbd>esc</Kbd> {t('command_palette.hint_close')}</KbdGroup>
                            </div>
                        </Command>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

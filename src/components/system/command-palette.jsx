import { Command } from 'cmdk';
import { AnimatePresence, motion } from 'motion/react';
import { DynamicIcon } from 'lucide-react/dynamic';
import { useRouterState } from '@tanstack/react-router';
import { useEvents } from '@/providers/bus-provider';
import { useCommandPalette } from '@/providers/command-palette-provider';
import { createCommands } from '@/constants/commands';

const matchesScope = (scope, pathname) =>
    scope === '*' || scope.some(s => pathname.startsWith(s));

export const CommandPalette = () => {
    const { isOpen, close } = useCommandPalette();
    const { emit } = useEvents();
    const pathname = useRouterState({ select: s => s.location.pathname });

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
                    <div className='absolute inset-0 bg-black/60 backdrop-blur-sm' />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.15 }}
                        className='relative z-10 w-full max-w-lg'
                        onClick={e => e.stopPropagation()}
                    >
                        <Command
                            className='overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-2xl shadow-black/50'
                            onKeyDown={e => { if (e.key === 'Escape') close(); }}
                            loop
                        >
                            <Command.Input
                                autoFocus
                                placeholder='Type a command or search…'
                                className='w-full border-b border-white/10 bg-transparent px-4 py-3.5 text-sm text-white/90 placeholder:text-zinc-500 focus:outline-none'
                            />

                            <Command.List className='max-h-80 overflow-y-auto p-2'>
                                <Command.Empty className='py-8 text-center text-sm text-zinc-500'>
                                    No commands found.
                                </Command.Empty>

                                {commands.map(({ group, items }) => (
                                    <Command.Group
                                        key={group}
                                        heading={group}
                                        className='**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:pb-1.5 **:[[cmdk-group-heading]]:pt-3 **:[[cmdk-group-heading]]:text-[11px] **:[[cmdk-group-heading]]:font-semibold **:[[cmdk-group-heading]]:uppercase **:[[cmdk-group-heading]]:tracking-widest **:[[cmdk-group-heading]]:text-zinc-500'
                                    >
                                        {items.map(({ id, label, icon, action }) => (
                                            <Command.Item
                                                key={id}
                                                value={id}
                                                keywords={[label]}
                                                onSelect={() => run(action)}
                                                className='flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/70 transition-colors aria-selected:bg-white/10 aria-selected:text-white/90 [&>svg]:size-4'
                                            >
                                                <div className='[&>svg]:size-4 text-zinc-500 aria-selected:text-white/70'>
                                                    <DynamicIcon name={icon} />
                                                </div>
                                                {label}
                                            </Command.Item>
                                        ))}
                                    </Command.Group>
                                ))}
                            </Command.List>

                            <div className='flex items-center gap-4 border-t border-white/5 px-4 py-2.5 text-[11px] text-zinc-600'>
                                <span><kbd className='font-mono'>↑↓</kbd> navigate</span>
                                <span><kbd className='font-mono'>↵</kbd> select</span>
                                <span><kbd className='font-mono'>esc</kbd> close</span>
                            </div>
                        </Command>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

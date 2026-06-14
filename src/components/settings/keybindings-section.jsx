import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Pencil, RotateCcw, X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { useSettings } from '@/hooks/use-settings';
import { defaultSettings } from '@/constants/default-settings';
import { Button } from '@/ui/button';
import { Kbd, KbdGroup } from '@/ui/kbd';
import { cn } from '@/helpers/utils';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

const KEYBINDING_GROUPS = [
    { group: 'general', items: ['command_palette', 'settings', 'new_bin'] },
    { group: 'tabs', items: ['new_file', 'prev_tab', 'next_tab'] },
    { group: 'bin', items: ['copy_link'] },
    { group: 'editor', items: ['toggle_runner', 'format_code', 'word_wrap', 'redo'] },
];

const BROWSER_CONFLICTS = new Map([
    ['cmd+t', 'New tab'],
    ['cmd+w', 'Close tab'],
    ['cmd+r', 'Reload page'],
    ['cmd+shift+r', 'Hard reload'],
    ['cmd+l', 'Address bar'],
    ['cmd+d', 'Bookmark page'],
    ['cmd+p', 'Print'],
    ['cmd+f', 'Find in page'],
    ['cmd+g', 'Find next'],
    ['cmd+shift+g', 'Find previous'],
    ['cmd+shift+i', 'Developer tools'],
    ['cmd+shift+j', 'Developer tools'],
    ['cmd+shift+n', 'New incognito window'],
    ['cmd+shift+t', 'Reopen closed tab'],
    ['cmd+shift+b', 'Bookmarks bar'],
    ['cmd+opt+i', 'Developer tools'],
    ['cmd+opt+j', 'Console'],
]);

const MAC_CONFLICTS = new Map([
    ['cmd+space', 'Spotlight'],
    ['cmd+tab', 'App switcher'],
    ['cmd+q', 'Quit app'],
    ['cmd+h', 'Hide app'],
    ['cmd+opt+h', 'Hide other apps'],
    ['cmd+m', 'Minimize window'],
    ['cmd+`', 'Next window'],
    ['cmd+shift+3', 'Screenshot'],
    ['cmd+shift+4', 'Screenshot selection'],
    ['cmd+shift+5', 'Screenshot options'],
]);

const WIN_CONFLICTS = new Map([
    ['ctrl+alt+delete', 'Task Manager'],
    ['ctrl+shift+escape', 'Task Manager'],
]);

const getConflict = (combo, excludeId, keybindings) => {
    const appDefaults = defaultSettings.keybindings;
    for (const [id, value] of Object.entries({ ...appDefaults, ...keybindings })) {
        if (id !== excludeId && value === combo) {
            return { type: 'app', label: id };
        }
    }
    if (isMac && MAC_CONFLICTS.has(combo)) return { type: 'os', label: MAC_CONFLICTS.get(combo) };
    if (!isMac && WIN_CONFLICTS.has(combo)) return { type: 'os', label: WIN_CONFLICTS.get(combo) };
    if (BROWSER_CONFLICTS.has(combo)) return { type: 'browser', label: BROWSER_CONFLICTS.get(combo) };
    return null;
};

const formatBinding = raw => {
    if (!raw) return [];
    return raw.split('+').map(part => {
        if (part === 'cmd') return isMac ? '⌘' : 'Ctrl';
        if (part === 'ctrl') return 'Ctrl';
        if (part === 'opt') return isMac ? '⌥' : 'Alt';
        if (part === 'shift') return '⇧';
        return part.toUpperCase();
    });
};

const KeybindingDisplay = ({ raw, muted }) => (
    <KbdGroup>
        {formatBinding(raw).map((k, i) => (
            <Kbd key={i} className={cn({ 'opacity-40': muted })}>
                {k}
            </Kbd>
        ))}
    </KbdGroup>
);

const CaptureZone = ({ onCapture, excludeId, keybindings }) => {
    const { t } = useTranslation();
    const [pending, setPending] = useState(null);
    const [conflict, setConflict] = useState(null);

    useEffect(() => {
        const onKey = e => {
            if (e.key === 'Escape') return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) return;

            const parts = [];
            if (e.metaKey) parts.push('cmd');
            else if (e.ctrlKey) parts.push('ctrl');
            if (e.altKey) parts.push('opt');
            if (e.shiftKey) parts.push('shift');
            parts.push(e.key.toLowerCase());

            if (parts.length >= 2) {
                const combo = parts.join('+');
                const c = getConflict(combo, excludeId, keybindings);
                setPending(combo);
                setConflict(c);
                onCapture(combo, c);
            }
        };
        window.addEventListener('keydown', onKey, { capture: true });
        return () => window.removeEventListener('keydown', onKey, { capture: true });
    }, [onCapture, excludeId, keybindings]);

    const keys = pending ? formatBinding(pending) : [];
    const hasConflict = !!conflict;

    return (
        <div
            className={cn(
                'flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all',
                {
                    'border-destructive bg-destructive/5': hasConflict,
                    'border-brand bg-brand/5': pending && !hasConflict,
                    'border-border bg-muted/30': !pending,
                },
            )}
        >
            {pending ? (
                <>
                    <div className='flex items-center gap-2'>
                        {keys.map((k, i) => (
                            <kbd
                                key={i}
                                className={cn(
                                    'inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 font-mono text-base font-semibold shadow-sm transition-colors',
                                    {
                                        'border-destructive/50 bg-destructive/10 text-destructive': hasConflict,
                                        'border-brand/40 bg-brand/10 text-foreground': !hasConflict,
                                    },
                                )}
                            >
                                {k}
                            </kbd>
                        ))}
                    </div>
                    {hasConflict ? (
                        <div className='flex items-center gap-1.5 text-xs text-destructive'>
                            <AlertTriangle className='size-3 shrink-0' />
                            <span>
                                {t(`settings.keybindings.conflict_${conflict.type}`)}{': '}
                                {conflict.type === 'app'
                                    ? t(`settings.keybindings.${conflict.label}`)
                                    : conflict.label}
                            </span>
                        </div>
                    ) : (
                        <p className='text-xs text-muted-foreground'>{t('settings.keybindings.capture_change_hint')}</p>
                    )}
                </>
            ) : (
                <p className='text-sm text-muted-foreground'>{t('settings.keybindings.press_key')}</p>
            )}
        </div>
    );
};

const KeybindingModal = ({ shortcutId, actionLabel, currentValue, keybindings, onSave, t }) => {
    const [open, setOpen] = useState(false);
    const [captured, setCaptured] = useState(null);
    const [conflict, setConflict] = useState(null);

    const handleOpen = () => {
        setCaptured(null);
        setConflict(null);
        setOpen(true);
    };

    const handleSave = () => {
        if (captured) onSave(captured);
        setOpen(false);
    };

    const handleCapture = (combo, c) => {
        setCaptured(combo);
        setConflict(c);
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger
                render={
                    <Button
                        variant='ghost'
                        size='icon-xs'
                        title={t('settings.keybindings.edit')}
                        onClick={handleOpen}
                    />
                }
            >
                <Pencil />
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0' />
                <Dialog.Popup className='fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-0 shadow-xl shadow-black/30 transition-all duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0'>
                    <div className='flex items-start justify-between border-b border-border px-5 py-4'>
                        <div>
                            <Dialog.Title className='text-sm font-semibold text-foreground'>
                                {t('settings.keybindings.modal_title')}
                            </Dialog.Title>
                            <Dialog.Description className='mt-0.5 text-xs text-muted-foreground'>
                                {actionLabel}
                            </Dialog.Description>
                        </div>
                        <Dialog.Close render={<Button variant='ghost' size='icon-xs' className='shrink-0' />}>
                            <X />
                        </Dialog.Close>
                    </div>

                    <div className='flex flex-col gap-4 p-5'>
                        <CaptureZone
                            onCapture={handleCapture}
                            excludeId={shortcutId}
                            keybindings={keybindings}
                        />
                        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                            <span>{t('settings.keybindings.current_label')}</span>
                            <KeybindingDisplay raw={currentValue} />
                        </div>
                    </div>

                    <div className='flex items-center justify-end gap-2 border-t border-border px-5 py-3'>
                        <Dialog.Close render={<Button variant='ghost' size='sm' />}>
                            {t('settings.keybindings.cancel')}
                        </Dialog.Close>
                        <Button
                            size='sm'
                            onClick={handleSave}
                            disabled={!captured}
                            className={cn({ 'bg-destructive/80 hover:bg-destructive/70': conflict })}
                        >
                            {conflict ? t('settings.keybindings.save_anyway') : t('settings.keybindings.save')}
                        </Button>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

const GroupLabel = ({ label }) => (
    <div className='pb-1 pt-4 first:pt-3'>
        <span className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>{label}</span>
    </div>
);

export const KeybindingsSection = () => {
    const { t } = useTranslation();
    const [keybindings, setKeybindings] = useSettings('keybindings', defaultSettings.keybindings);

    const set = (id, val) => setKeybindings(prev => ({ ...prev, [id]: val }));
    const reset = id => setKeybindings(prev => ({ ...prev, [id]: defaultSettings.keybindings[id] }));
    const isCustom = id => keybindings[id] !== defaultSettings.keybindings[id];

    return (
        <section id='settings-keybindings'>
            <SectionHeading title={t('settings.keybindings.title')} />
            <SettingGroup>
                {KEYBINDING_GROUPS.map(({ group, items }) => (
                    <>
                        <GroupLabel key={`label-${group}`} label={t(`settings.keybindings.group_${group}`)} />
                        {items.map(id => {
                            const current = keybindings[id] ?? defaultSettings.keybindings[id];
                            const custom = isCustom(id);
                            return (
                                <SettingRow key={id} label={t(`settings.keybindings.${id}`)}>
                                    <div className='flex items-center gap-2'>
                                        <KeybindingDisplay raw={current} />
                                        {custom && (
                                            <span className='rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand'>
                                                {t('settings.keybindings.custom')}
                                            </span>
                                        )}
                                        <KeybindingModal
                                            shortcutId={id}
                                            actionLabel={t(`settings.keybindings.${id}`)}
                                            currentValue={current}
                                            keybindings={keybindings}
                                            onSave={val => set(id, val)}
                                            t={t}
                                        />
                                        <Button
                                            variant='ghost'
                                            size='icon-xs'
                                            onClick={() => reset(id)}
                                            disabled={!custom}
                                            title={t('settings.keybindings.reset')}
                                        >
                                            <RotateCcw />
                                        </Button>
                                    </div>
                                </SettingRow>
                            );
                        })}
                    </>
                ))}
            </SettingGroup>
        </section>
    );
};

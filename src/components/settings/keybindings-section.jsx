import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Pencil, RotateCcw, X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { useSettings } from '@/hooks/use-settings';
import { defaultSettings } from '@/constants/default-settings';
import { normalizeEvent, formatBinding } from '@/hooks/use-hotkey';
import { Button } from '@/ui/button';
import { Kbd, KbdGroup } from '@/ui/kbd';
import { cn } from '@/helpers/utils';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

// type: 'app' | 'monaco'
const KEYBINDING_GROUPS = [
    { group: 'general', type: 'app', items: ['command_palette', 'settings', 'new_bin'] },
    { group: 'tabs', type: 'app', items: ['new_file', 'prev_tab', 'next_tab'] },
    { group: 'bin', type: 'app', items: ['copy_link'] },
    { group: 'editor', type: 'app', items: ['toggle_runner', 'format_code'] },
    { group: 'monaco', type: 'monaco', items: ['redo'] },
];

const BROWSER_CONFLICTS = new Map([
    ['mod+t', 'New tab'],
    ['mod+n', 'New window'],
    ['mod+w', 'Close tab'],
    ['mod+shift+w', 'Close all tabs'],
    ['mod+shift+n', 'New incognito window'],
    ['mod+shift+t', 'Reopen closed tab'],
    ['mod+r', 'Reload page'],
    ['mod+shift+r', 'Hard reload'],
    ['mod+l', 'Address bar'],
    ['mod+d', 'Bookmark page'],
    ['mod+p', 'Print'],
    ['mod+f', 'Find in page'],
    ['mod+g', 'Find next'],
    ['mod+shift+g', 'Find previous'],
    ['mod+shift+i', 'Developer tools'],
    ['mod+shift+j', 'Developer tools'],
    ['mod+shift+b', 'Bookmarks bar'],
    ['mod+alt+i', 'Developer tools'],
    ['mod+alt+j', 'Console'],
    ...Array.from({ length: 9 }, (_, i) => [`mod+${i + 1}`, `Focus tab ${i + 1}`]),
]);

const MAC_CONFLICTS = new Map([
    ['mod+space', 'Spotlight'],
    ['mod+tab', 'App switcher'],
    ['mod+q', 'Quit app'],
    ['mod+h', 'Hide app'],
    ['mod+alt+h', 'Hide other apps'],
    ['mod+m', 'Minimize window'],
    ['mod+`', 'Next window'],
    ['mod+shift+3', 'Screenshot'],
    ['mod+shift+4', 'Screenshot selection'],
    ['mod+shift+5', 'Screenshot options'],
]);

const WIN_CONFLICTS = new Map([
    ['mod+alt+delete', 'Task Manager'],
    ['mod+shift+escape', 'Task Manager'],
]);

const getConflict = (combo, excludeId, allKeybindings) => {
    const allDefaults = {
        ...defaultSettings.appKeybindings,
        ...defaultSettings.monacoKeybindings,
    };
    for (const [id, value] of Object.entries({ ...allDefaults, ...allKeybindings })) {
        if (id !== excludeId && value === combo) {
            return { type: 'app', label: id };
        }
    }
    if (isMac && MAC_CONFLICTS.has(combo)) return { type: 'os', label: MAC_CONFLICTS.get(combo) };
    if (!isMac && WIN_CONFLICTS.has(combo)) return { type: 'os', label: WIN_CONFLICTS.get(combo) };
    if (BROWSER_CONFLICTS.has(combo)) return { type: 'browser', label: BROWSER_CONFLICTS.get(combo) };
    return null;
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

const CaptureZone = ({ onCapture, excludeId, allKeybindings }) => {
    const { t } = useTranslation();
    const [pending, setPending] = useState(null);
    const [conflict, setConflict] = useState(null);

    useEffect(() => {
        const onKey = e => {
            if (e.key === 'Escape') return;
            e.preventDefault();
            e.stopImmediatePropagation();
            if (['Meta', 'Control', 'Alt', 'Shift'].includes(e.key)) return;

            const combo = normalizeEvent(e);
            if (combo.split('+').length >= 2) {
                const c = getConflict(combo, excludeId, allKeybindings);
                setPending(combo);
                setConflict(c);
                onCapture(combo, c);
            }
        };
        window.addEventListener('keydown', onKey, { capture: true });
        return () => window.removeEventListener('keydown', onKey, { capture: true });
    }, [onCapture, excludeId, allKeybindings]);

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

const KeybindingModal = ({ shortcutId, actionLabel, currentValue, allKeybindings, onSave, t }) => {
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
                            allKeybindings={allKeybindings}
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
    const [appKeybindings, setAppKeybindings] = useSettings('appKeybindings', defaultSettings.appKeybindings);
    const [monacoKeybindings, setMonacoKeybindings] = useSettings('monacoKeybindings', defaultSettings.monacoKeybindings);

    const allKeybindings = { ...appKeybindings, ...monacoKeybindings };

    const getKb = type => type === 'app' ? appKeybindings : monacoKeybindings;
    const getDefaults = type => type === 'app' ? defaultSettings.appKeybindings : defaultSettings.monacoKeybindings;
    const setKb = (type, id, val) => {
        if (type === 'app') setAppKeybindings(prev => ({ ...prev, [id]: val }));
        else setMonacoKeybindings(prev => ({ ...prev, [id]: val }));
    };
    const resetKb = (type, id) =>
        setKb(type, id, getDefaults(type)[id]);
    const isCustom = (type, id) =>
        getKb(type)[id] !== getDefaults(type)[id];

    return (
        <section id='settings-keybindings'>
            <SectionHeading title={t('settings.keybindings.title')} />
            <SettingGroup>
                {KEYBINDING_GROUPS.map(({ group, type, items }) => (
                    <>
                        <GroupLabel key={`label-${group}`} label={t(`settings.keybindings.group_${group}`)} />
                        {items.map(id => {
                            const current = getKb(type)[id] ?? getDefaults(type)[id];
                            const custom = isCustom(type, id);
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
                                            allKeybindings={allKeybindings}
                                            onSave={val => setKb(type, id, val)}
                                            t={t}
                                        />
                                        <Button
                                            variant='ghost'
                                            size='icon-xs'
                                            onClick={() => resetKb(type, id)}
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

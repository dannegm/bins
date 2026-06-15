import { useState } from 'react';
import { Users, Check } from 'lucide-react';
import { parseToRgb } from 'polished';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { useSettings } from '@/hooks/use-settings';
import { useTheme } from '@/providers/theme-provider';
import { UserAvatar } from '@/components/system/user-avatar';
import { LANGUAGE_LIST, getLanguage } from '@/constants/languages';
import { Popover, PopoverTrigger, PopoverContent } from '@/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/ui/command';
import { useEvents } from '@/providers/bus-provider';

const contrastColor = color => {
    try {
        const { red, green, blue } = parseToRgb(color);
        return (0.299 * red + 0.587 * green + 0.114 * blue) / 255 > 0.5 ? '#000' : '#fff';
    } catch {
        return '#fff';
    }
};

const LangIcon = ({ lang, color }) => {
    const iconColor = color ?? lang.color;
    if (lang.icon) return <i className={cn(lang.icon, 'colored text-xs leading-none')} style={{ color: iconColor }} />;
    return <span className='size-1.5 rounded-full bg-(--dot)' style={{ '--dot': iconColor }} />;
};

const Divider = () => <span className='text-border'>│</span>;

const SaveIndicator = ({ status, t }) => {
    const config = {
        idle: { dot: 'bg-muted-foreground', label: '' },
        saving: { dot: 'bg-warning animate-pulse', label: t('editor.status_bar.saving') },
        saved: { dot: 'bg-success', label: t('editor.status_bar.saved') },
        unsaved: { dot: 'bg-warning', label: t('editor.status_bar.unsaved') },
    }[status] ?? { dot: 'bg-muted-foreground', label: '' };

    if (!config.label) return null;

    return (
        <>
            <Divider />
            <span className='flex items-center gap-1.5'>
                <span className={cn('size-1.5 rounded-full', config.dot)} />
                <span>{config.label}</span>
            </span>
        </>
    );
};

const LanguagePicker = ({ language, onLanguageChange }) => {
    const [open, setOpen] = useState(false);
    const lang = getLanguage(language);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                className='flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-opacity hover:opacity-80 bg-(--lang-bg) text-(--lang-text)'
                style={{ '--lang-bg': lang.color, '--lang-text': contrastColor(lang.color) }}
            >
                <LangIcon lang={lang} color={contrastColor(lang.color)} />
                {lang.label}
            </PopoverTrigger>
            <PopoverContent side='top' sideOffset={8} align='start' className='w-52 p-0'>
                <Command>
                    <CommandInput placeholder='Filter…' />
                    <CommandList className='max-h-48'>
                        <CommandEmpty>No results.</CommandEmpty>
                        <CommandGroup>
                            {LANGUAGE_LIST.map(l => (
                                <CommandItem
                                    key={l.id}
                                    value={l.label}
                                    data-checked={l.id === language}
                                    onSelect={() => {
                                        onLanguageChange(l.id);
                                        setOpen(false);
                                    }}
                                >
                                    <span className='flex size-3.5 shrink-0 items-center justify-center'>
                                        <LangIcon lang={l} />
                                    </span>
                                    {l.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
};

const PeerList = ({ peers }) => {
    const { isDark } = useTheme();
    const { emit } = useEvents();

    return (
        <Popover>
            <PopoverTrigger className='flex items-center gap-1 rounded-full bg-brand px-2 py-0.5 text-brand-foreground transition-opacity hover:opacity-80'>
                <Users className='size-3' />
                {peers.length}
            </PopoverTrigger>
            <PopoverContent side='top' sideOffset={16} align='end' className='w-auto min-w-44 p-0'>
                {peers.map(peer => {
                    const color = isDark ? peer.colorDark : peer.colorLight;
                    return (
                        <button
                            key={peer.uuid}
                            onClick={() =>
                                peer.activeFileId &&
                                emit('peer:focus', {
                                    fileId: peer.activeFileId,
                                    cursor: peer.cursor,
                                })
                            }
                            className='flex w-full items-center gap-2.5 px-3 py-2 transition-colors hover:bg-muted'
                        >
                            <UserAvatar profileId={peer.uuid} className='size-5 shrink-0' />
                            <span className='flex-1 truncate text-xs text-foreground'>
                                {peer.name}
                            </span>
                            <span
                                className='size-2 shrink-0 rounded-full bg-(--peer-color)'
                                style={{ '--peer-color': color }}
                            />
                        </button>
                    );
                })}
            </PopoverContent>
        </Popover>
    );
};

const TAB_SIZES = [2, 4, 8];

const IndentationPicker = ({ t }) => {
    const [prettier, setPrettier] = useSettings('prettier');
    const tabWidth = prettier?.tabWidth ?? 4;
    const useTabs = prettier?.useTabs ?? false;

    const set = (key, val) => setPrettier(prev => ({ ...prev, [key]: val }));

    const label = useTabs
        ? t('editor.status_bar.tabs', { count: tabWidth })
        : t('editor.status_bar.spaces', { count: tabWidth });

    return (
        <Popover>
            <PopoverTrigger className='rounded px-1 py-0.5 transition-colors hover:bg-surface-raised hover:text-foreground'>
                {label}
            </PopoverTrigger>
            <PopoverContent side='top' sideOffset={8} align='start' className='w-40 p-1'>
                <div className='px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
                    {t('editor.status_bar.indentation')}
                </div>
                {[false, true].map(tabs => (
                    <button
                        key={String(tabs)}
                        onClick={() => set('useTabs', tabs)}
                        className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-muted'
                    >
                        <Check className={cn('size-3', { 'opacity-0': useTabs !== tabs })} />
                        {tabs ? t('editor.status_bar.tabs_label') : t('editor.status_bar.spaces_label')}
                    </button>
                ))}
                <div className='my-1 border-t border-border' />
                <div className='px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground'>
                    {t('editor.status_bar.tab_size')}
                </div>
                {TAB_SIZES.map(n => (
                    <button
                        key={n}
                        onClick={() => set('tabWidth', n)}
                        className='flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-foreground transition-colors hover:bg-muted'
                    >
                        <Check className={cn('size-3', { 'opacity-0': tabWidth !== n })} />
                        {n}
                    </button>
                ))}
            </PopoverContent>
        </Popover>
    );
};

export const StatusBar = ({ language, cursor, lineCount = 1, saveStatus, peers = [], onLanguageChange }) => {
    const { t } = useTranslation();
    return (
        <div className='flex h-8 shrink-0 items-center gap-2 border-t border-border bg-surface px-3 text-xs text-muted-foreground'>
            <LanguagePicker language={language} onLanguageChange={onLanguageChange} />

            <Divider />

            <span>
                {t('editor.status_bar.ln')} {cursor.lineNumber}, {t('editor.status_bar.col')}{' '}
                {cursor.column}
            </span>

            <Divider />

            <span>{t('editor.status_bar.lines', { count: lineCount })}</span>

            <Divider />

            <IndentationPicker t={t} />

            <Divider />

            <span>UTF-8</span>

            <SaveIndicator status={saveStatus} t={t} />

            <span className='flex-1' />

            {peers.length > 0 && <PeerList peers={peers} />}
        </div>
    );
};

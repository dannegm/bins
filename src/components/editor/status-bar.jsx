import { useState } from 'react';
import { Users, Check, Brain } from 'lucide-react';
import { SmileyDead } from '@/ui/icons';
import { parseToRgb } from 'polished';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { useSettings } from '@/hooks/use-settings';
import { useTheme } from '@/providers/theme-provider';
import { UserAvatar } from '@/components/system/user-avatar';
import { ScrambleText } from '@/components/system/scramble-text';
import { LANGUAGE_LIST, getLanguage } from '@/constants/languages';
import { Popover, PopoverTrigger, PopoverContent } from '@/ui/popover';
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/ui/command';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/ui/tooltip';
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
    if (lang.icon)
        return (
            <i
                className={cn(lang.icon, 'colored text-xs leading-none')}
                style={{ color: iconColor }}
            />
        );
    return <span className='size-1.5 rounded-full bg-(--dot)' style={{ '--dot': iconColor }} />;
};

const Divider = ({ className }) => <span className={cn('bg-border h-2/4 w-px', className)} />;

const SaveIndicator = ({ status, t }) => {
    const config = {
        idle: { dot: 'bg-muted-foreground', label: '' },
        saving: { dot: 'bg-warning animate-pulse', label: t('editor.status_bar.saving') },
        saved: { dot: 'bg-success', label: t('editor.status_bar.saved') },
        unsaved: { dot: 'bg-warning', label: t('editor.status_bar.unsaved') },
    }[status] ?? { dot: 'bg-muted-foreground', label: '' };

    if (!config.label) return null;

    return (
        <span className='flex items-center gap-1.5'>
            <span className={cn('size-1.5 rounded-full', config.dot)} />
            <span>{config.label}</span>
        </span>
    );
};

const SyncIndicator = ({ status, t }) => {
    if (status === 'connected') return null;

    return (
        <span className='flex items-center gap-1.5'>
            <span className='size-1.5 animate-pulse rounded-full bg-warning' />
            <span>{t('editor.status_bar.reconnecting')}</span>
        </span>
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
                <span className='hidden sm:inline'>{lang.label}</span>
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

const PROVIDER_BRAND = {
    claude:     { light: '#D97757', dark: '#D97757' },
    openai:     { light: '#1a1a1a', dark: '#1a1a1a' },
    gemini:     { light: '#4285F4', dark: '#5A95F5' },
    openrouter: { light: '#6366F1', dark: '#818CF8' },
    ollama:     { light: '#2D2D2D', dark: '#404040' },
};

const AiChip = ({ t }) => {
    const [aiCompletions, setAiCompletions] = useSettings('aiCompletions');

    const provider = aiCompletions?.provider ?? 'ollama';
    const apiKey = aiCompletions?.apiKey ?? '';
    const enabled = aiCompletions?.enabled ?? false;

    const isConfigured = provider === 'ollama' ? true : !!apiKey;
    if (!isConfigured) return null;

    const toggle = () => setAiCompletions(prev => ({ ...prev, enabled: !prev.enabled }));
    const brand = PROVIDER_BRAND[provider] ?? PROVIDER_BRAND.ollama;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    onClick={toggle}
                    style={enabled ? { '--chip-light': brand.light, '--chip-dark': brand.dark } : {}}
                    className={cn(
                        'flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                        {
                            'border-(--chip-light) bg-(--chip-light) dark:border-(--chip-dark) dark:bg-(--chip-dark) text-white':
                                enabled,
                            'border-border bg-surface-raised text-muted-foreground hover:text-foreground':
                                !enabled,
                        },
                    )}
                >
                    <Brain className='size-3' />
                    <span className='hidden sm:inline'>AI</span>
                </TooltipTrigger>
                <TooltipContent side='top' sideOffset={8}>
                    {t('editor.status_bar.ai_chip_tooltip')}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const NudgeButton = ({ t }) => {
    const { emit } = useEvents();
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger
                    onClick={() => emit('peer:nudge')}
                    className='flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-white transition-opacity hover:opacity-80 dark:bg-rose-400'
                >
                    <SmileyDead className='size-3.5' />
                    <span className='hidden sm:inline'>{t('editor.status_bar.nudge')}</span>
                </TooltipTrigger>
                <TooltipContent side='top' sideOffset={8}>
                    {t('editor.status_bar.nudge_tooltip')}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
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
                            <span className='flex-1 truncate text-left text-xs text-foreground'>
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

const formatSize = bytes => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
                        {tabs
                            ? t('editor.status_bar.tabs_label')
                            : t('editor.status_bar.spaces_label')}
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

export const StatusBar = ({
    language,
    content = '',
    cursor,
    lineCount = 1,
    isLoading = false,
    saveStatus,
    syncStatus = 'connected',
    peers = [],
    onLanguageChange,
}) => {
    const fileSize = formatSize(new TextEncoder().encode(content).length);
    const { t } = useTranslation();
    return (
        <div className='flex h-8 overflow-hidden shrink-0 items-center gap-2 sm:gap-3 border-t border-border bg-surface px-3 text-xs text-muted-foreground'>
            {/* Language */}
            <LanguagePicker language={language} onLanguageChange={onLanguageChange} />

            {/* Cursor position */}
            <Divider className='hidden sm:inline' />
            <span className='hidden sm:inline'>
                {t('editor.status_bar.ln')} {cursor.lineNumber}, {t('editor.status_bar.col')}{' '}
                {cursor.column}
            </span>

            {/* Rows count */}
            <Divider className='hidden sm:inline' />
            <span className='hidden sm:inline'>
                {isLoading ? (
                    <>
                        <ScrambleText chars='@#$%&'>
                            {String(lineCount).padStart(2, '0')}
                        </ScrambleText>{' '}
                        {t('editor.status_bar.lines_label')}
                    </>
                ) : (
                    t('editor.status_bar.lines', { count: lineCount })
                )}
            </span>

            {/* File size */}
            <Divider className='hidden sm:inline' />
            <span className='hidden sm:inline'>{fileSize}</span>

            {/* Indentation */}
            <Divider />
            <IndentationPicker t={t} />

            {/* Save / sync status */}
            <Divider />
            <SaveIndicator status={saveStatus} t={t} />
            <SyncIndicator status={syncStatus} t={t} />

            <span className='flex-1' />

            <AiChip t={t} />
            <NudgeButton t={t} />
            {peers.length > 0 && <PeerList peers={peers} />}
        </div>
    );
};

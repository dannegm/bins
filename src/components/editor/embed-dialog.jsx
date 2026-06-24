import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Code2, Copy, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/helpers/utils';
import { UI_THEMES } from '@/constants/themes';
import { hasRunner } from '@/services/runners';
import { Checkbox } from '@/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/ui/dialog';
import { Popover, PopoverTrigger, PopoverContent } from '@/ui/popover';
import { Command, CommandGroup, CommandItem, CommandList } from '@/ui/command';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/ui/select';

const buildUrl = (binId, { showEditor, showRunner, runnable, theme, fileId }) => {
    const params = new URLSearchParams();
    const views = showEditor && showRunner ? 'editor|runner' : showEditor ? 'editor' : 'runner';
    if (views !== 'editor') params.set('views', views);
    if (runnable) params.set('runnable', '');
    if (theme && theme !== 'auto') params.set('theme', theme);
    if (fileId) params.set('file', fileId);
    const qs = params.toString();
    return `${window.location.origin}/embed/${binId}${qs ? `?${qs}` : ''}`;
};

const buildCode = url =>
    `<iframe\n  src="${url}"\n  width="100%"\n  height="400"\n  style="border:none;border-radius:0.5rem;overflow:hidden;"\n  loading="lazy"\n></iframe>`;

const SettingsCheckbox = ({ checked, onChange, label }) => (
    <label className='flex cursor-pointer items-center gap-2 px-3'>
        <Checkbox checked={checked} onCheckedChange={onChange} />
        <span className='text-xs text-foreground'>{label}</span>
    </label>
);

export const EmbedDialog = ({ binId, files = [], activeFile }) => {
    const { t } = useTranslation();
    const [showEditor, setShowEditor] = useState(true);
    const [showRunner, setShowRunner] = useState(false);
    const [runnable, setRunnable] = useState(false);
    const [theme, setTheme] = useState('auto');
    const [themeOpen, setThemeOpen] = useState(false);
    const [fileId, setFileId] = useState(activeFile?.id ?? null);
    const [copied, setCopied] = useState(false);

    const anyFileHasRunner = useMemo(() => files.some(f => hasRunner(f.language)), [files]);

    const url = buildUrl(binId, { showEditor, showRunner, runnable, theme, fileId });
    const code = buildCode(url);

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleEditor = () => {
        if (showEditor && !showRunner) return;
        setShowEditor(v => !v);
    };

    const toggleRunner = () => {
        if (showRunner && !showEditor) return;
        setShowRunner(v => !v);
    };

    return (
        <Dialog>
            <DialogTrigger className='flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'>
                <Code2 className='size-3' />
                <span>{t('editor.embed_dialog.trigger')}</span>
            </DialogTrigger>
            <DialogContent className='gap-0 p-0 sm:max-w-2xl'>
                {/* Header */}
                <DialogHeader className='border-b border-border px-4 py-3'>
                    <DialogTitle className='text-sm'>{t('editor.embed_dialog.title')}</DialogTitle>
                </DialogHeader>

                {/* Settings row */}
                <div className='flex items-center border-b border-border py-2'>
                    <SettingsCheckbox
                        checked={showEditor}
                        onChange={toggleEditor}
                        label={t('editor.embed_dialog.views_editor')}
                    />
                    <span className='h-4 w-px shrink-0 bg-border' />
                    <SettingsCheckbox
                        checked={showRunner}
                        onChange={toggleRunner}
                        label={t('editor.embed_dialog.views_runner')}
                    />
                    {anyFileHasRunner && (
                        <>
                            <span className='h-4 w-px shrink-0 bg-border' />
                            <SettingsCheckbox
                                checked={runnable}
                                onChange={() => setRunnable(v => !v)}
                                label={t('editor.embed_dialog.runnable_label')}
                            />
                        </>
                    )}
                    {files.length > 1 && (
                        <>
                            <span className='h-4 w-px shrink-0 bg-border' />
                            <div className='px-3'>
                                <Select value={fileId ?? ''} onValueChange={setFileId}>
                                    <SelectTrigger size='sm' className='h-6 border-0 px-1 text-xs shadow-none'>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {files.map(f => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}
                    <span className='flex-1' />
                    <span className='h-4 w-px shrink-0 bg-border' />
                    <Popover open={themeOpen} onOpenChange={setThemeOpen}>
                        <PopoverTrigger className='flex items-center gap-1 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground'>
                            {theme === 'auto'
                                ? t('editor.embed_dialog.theme_auto')
                                : (UI_THEMES.find(th => th.id === theme)?.label ?? theme)}
                            <ChevronDown className='size-3' />
                        </PopoverTrigger>
                        <PopoverContent side='bottom' align='end' sideOffset={8} className='w-44 p-0'>
                            <Command>
                                <CommandList>
                                    <CommandGroup>
                                        <CommandItem
                                            value='auto'
                                            onSelect={() => { setTheme('auto'); setThemeOpen(false); }}
                                        >
                                            <span className='flex size-3.5 shrink-0 items-center justify-center'>
                                                {theme === 'auto' && <Check className='size-3' />}
                                            </span>
                                            {t('editor.embed_dialog.theme_auto')}
                                        </CommandItem>
                                        {UI_THEMES.map(th => (
                                            <CommandItem
                                                key={th.id}
                                                value={th.id}
                                                onSelect={() => { setTheme(th.id); setThemeOpen(false); }}
                                            >
                                                <span className='flex size-3.5 shrink-0 items-center justify-center'>
                                                    {theme === th.id && <Check className='size-3' />}
                                                </span>
                                                {th.label}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>

                {/* Preview */}
                <div className='border-b border-border bg-background'>
                    <iframe
                        key={url}
                        src={url}
                        title='embed-preview'
                        className='h-96 w-full'
                        style={{ border: 'none' }}
                        loading='lazy'
                    />
                </div>

                {/* Code */}
                <div className='relative'>
                    <textarea
                        readOnly
                        value={code}
                        rows={8}
                        className='w-full resize-none rounded-b-xl bg-surface px-4 py-3 font-mono text-xs text-foreground outline-none select-all'
                    />
                    <button
                        onClick={handleCopy}
                        className={cn(
                            'absolute right-3 bottom-3 flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                            {
                                'bg-success/10 text-success': copied,
                                'bg-brand text-brand-foreground hover:opacity-90': !copied,
                            },
                        )}
                    >
                        {copied ? (
                            <>
                                <Check className='size-3' />
                                {t('editor.embed_dialog.copied')}
                            </>
                        ) : (
                            <>
                                <Copy className='size-3' />
                                {t('editor.embed_dialog.copy')}
                            </>
                        )}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

import { useState, useRef, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { useSettings } from '@/hooks/use-settings';
import { LANGUAGE_LIST, getLanguage } from '@/constants/languages';

const Divider = () => <span className='text-border'>│</span>;

const SaveIndicator = ({ status }) => {
    const { t } = useTranslation();

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
    const [search, setSearch] = useState('');
    const $ref = useRef(null);
    const lang = getLanguage(language);

    useEffect(() => {
        if (!open) return;
        const handler = e => {
            if (!$ref.current?.contains(e.target)) {
                setOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const filtered = LANGUAGE_LIST.filter(l =>
        l.label.toLowerCase().includes(search.toLowerCase()),
    );

    return (
        <div ref={$ref} className='relative'>
            <button
                onClick={() => setOpen(o => !o)}
                className='rounded px-1 py-0.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'
            >
                {lang.label}
            </button>

            {open && (
                <div className='absolute bottom-full left-0 z-50 mb-1 flex w-48 flex-col overflow-hidden rounded-lg border border-border bg-popover shadow-lg shadow-black/30'>
                    <div className='border-b border-border px-2 py-1.5'>
                        <input
                            autoFocus
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder='Filter…'
                            className='w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground'
                        />
                    </div>
                    <div className='max-h-48 overflow-y-auto py-1'>
                        {filtered.map(l => (
                            <button
                                key={l.id}
                                onClick={() => {
                                    onLanguageChange(l.id);
                                    setOpen(false);
                                    setSearch('');
                                }}
                                className={cn(
                                    'flex w-full items-center px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted',
                                    {
                                        'text-brand': l.id === language,
                                        'text-foreground': l.id !== language,
                                    },
                                )}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export const StatusBar = ({ language, cursor, saveStatus, peerCount, onLanguageChange }) => {
    const { t } = useTranslation();
    const [tabSize] = useSettings('tabSize');

    return (
        <div className='flex h-8 shrink-0 items-center gap-2 border-t border-border bg-surface px-3 text-xs text-muted-foreground'>
            <LanguagePicker language={language} onLanguageChange={onLanguageChange} />

            <Divider />

            <span>
                {t('editor.status_bar.ln')} {cursor.lineNumber}, {t('editor.status_bar.col')}{' '}
                {cursor.column}
            </span>

            <Divider />

            <span>{t('editor.status_bar.spaces', { count: tabSize })}</span>

            <Divider />

            <span>UTF-8</span>

            <SaveIndicator status={saveStatus} />

            <span className='flex-1' />

            {peerCount > 0 && (
                <>
                    <Divider />
                    <span className='flex items-center gap-1'>
                        <Users className='size-3' />
                        {peerCount}
                    </span>
                </>
            )}
        </div>
    );
};

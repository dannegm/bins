import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { UI_THEMES, MONACO_THEMES } from '@/constants/themes';
import { cn } from '@/helpers/utils';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const UI_THEME_COLORS = {
    light: {
        bg: '#ffffff',
        surface: '#f4f4f5',
        bar: '#e4e4e7',
        accent: '#4f46e5',
        text: '#18181b',
    },
    dark: { bg: '#0a0a0a', surface: '#27272a', bar: '#3f3f46', accent: '#6366f1', text: '#fafafa' },
    dracula: {
        bg: '#282a36',
        surface: '#1e1f29',
        bar: '#44475a',
        accent: '#bd93f9',
        text: '#f8f8f2',
    },
};

const MONACO_THEME_COLORS = {
    light: {
        bg: '#ffffff',
        keyword: '#0000ff',
        string: '#a31515',
        comment: '#008000',
        text: '#000000',
    },
    dark: {
        bg: '#1e1e1e',
        keyword: '#569cd6',
        string: '#ce9178',
        comment: '#6a9955',
        text: '#d4d4d4',
    },
    dracula: {
        bg: '#282a36',
        keyword: '#ff79c6',
        string: '#f1fa8c',
        comment: '#6272a4',
        text: '#f8f8f2',
    },
};

const LANGUAGES = [
    { id: 'en', label: 'English' },
    { id: 'es', label: 'Español' },
];

const UiThemeThumbnail = ({ theme, selected, onSelect, label }) => {
    const colors = UI_THEME_COLORS[theme.id] ?? UI_THEME_COLORS.dark;
    return (
        <button
            type='button'
            onClick={onSelect}
            className={cn(
                'group flex flex-col overflow-hidden rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                {
                    'border-brand': selected,
                    'border-border hover:border-muted-foreground': !selected,
                },
            )}
        >
            <div className='relative h-14 w-full' style={{ backgroundColor: colors.bg }}>
                <div className='h-2.5 w-full' style={{ backgroundColor: colors.surface }}>
                    <div className='flex h-full items-center gap-0.5 px-1.5'>
                        <span className='size-1 rounded-full bg-red-500' />
                        <span className='size-1 rounded-full bg-yellow-500' />
                        <span className='size-1 rounded-full bg-green-500' />
                    </div>
                </div>
                <div className='flex flex-col gap-1 p-1.5 pt-2'>
                    <div
                        className='h-1 w-10 rounded-full'
                        style={{ backgroundColor: colors.accent, opacity: 0.8 }}
                    />
                    <div
                        className='h-1 w-14 rounded-full'
                        style={{ backgroundColor: colors.text, opacity: 0.25 }}
                    />
                    <div
                        className='h-1 w-8 rounded-full'
                        style={{ backgroundColor: colors.text, opacity: 0.15 }}
                    />
                    <div
                        className='h-1 w-12 rounded-full'
                        style={{ backgroundColor: colors.text, opacity: 0.25 }}
                    />
                </div>
                {selected && (
                    <div className='absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-brand'>
                        <Check className='size-2.5 text-brand-foreground' />
                    </div>
                )}
            </div>
            <div
                className='px-2 py-1.5 text-xs font-medium'
                style={{ backgroundColor: colors.surface, color: colors.text }}
            >
                {label}
            </div>
        </button>
    );
};

const MonacoThemeThumbnail = ({ theme, selected, onSelect, label }) => {
    const colors = MONACO_THEME_COLORS[theme.id] ?? MONACO_THEME_COLORS.dark;
    return (
        <button
            type='button'
            onClick={onSelect}
            className={cn(
                'group flex flex-col overflow-hidden rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                {
                    'border-brand': selected,
                    'border-border hover:border-muted-foreground': !selected,
                },
            )}
        >
            <div
                className='relative h-14 w-full px-2 py-3 font-mono text-[8px] leading-tight text-left'
                style={{ backgroundColor: colors.bg }}
            >
                <div>
                    <span style={{ color: colors.keyword }}>{'const '}</span>
                    <span style={{ color: colors.text }}>{'x '}</span>
                    <span style={{ color: colors.text }}>{'= '}</span>
                    <span style={{ color: colors.string }}>{'"hello"'}</span>
                </div>
                <div style={{ color: colors.comment }}>{'// comment'}</div>
                <div>
                    <span style={{ color: colors.keyword }}>{'return '}</span>
                    <span style={{ color: colors.text }}>{'x'}</span>
                </div>
                {selected && (
                    <div className='absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-brand'>
                        <Check className='size-2.5 text-brand-foreground' />
                    </div>
                )}
            </div>
            <div
                className='px-2 py-1.5 text-xs font-medium'
                style={{
                    backgroundColor: colors.bg,
                    color: colors.text,
                    borderTop: `1px solid ${colors.keyword}33`,
                }}
            >
                {label}
            </div>
        </button>
    );
};

export const AppearanceSection = () => {
    const { t } = useTranslation();
    const [uiTheme, setUiTheme] = useSettings('uiTheme', 'dark');
    const [monacoTheme, setMonacoTheme] = useSettings('monacoTheme', 'dark');
    const [language, setLanguage] = useSettings('language', 'en');

    return (
        <section id='settings-appearance'>
            <SectionHeading title={t('settings.appearance.title')} />
            <div className='flex flex-col gap-4'>
                <div>
                    <p className='mb-3 text-sm font-medium text-foreground'>
                        {t('settings.appearance.ui_theme_label')}
                    </p>
                    <div className='grid grid-cols-4 gap-3'>
                        {UI_THEMES.map(theme => (
                            <UiThemeThumbnail
                                key={theme.id}
                                theme={theme}
                                selected={uiTheme === theme.id}
                                onSelect={() => setUiTheme(theme.id)}
                                label={theme.label}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    <p className='mb-3 text-sm font-medium text-foreground'>
                        {t('settings.appearance.monaco_theme_label')}
                    </p>
                    <div className='grid grid-cols-4 gap-3'>
                        {MONACO_THEMES.map(theme => (
                            <MonacoThemeThumbnail
                                key={theme.id}
                                theme={theme}
                                selected={monacoTheme === theme.id}
                                onSelect={() => setMonacoTheme(theme.id)}
                                label={theme.label}
                            />
                        ))}
                    </div>
                </div>

                <SettingGroup>
                    <SettingRow label={t('settings.appearance.language_label')}>
                        <select
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.label}
                                </option>
                            ))}
                        </select>
                    </SettingRow>
                </SettingGroup>
            </div>
        </section>
    );
};

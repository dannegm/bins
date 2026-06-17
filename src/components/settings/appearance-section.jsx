import { useTranslation } from 'react-i18next';
import { Check, ExternalLink } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { UI_THEMES, MONACO_THEMES, THEME_ATTRIBUTIONS } from '@/constants/themes';
import i18n, { SUPPORTED_LANGUAGES } from '@/services/i18n';
import { cn } from '@/helpers/utils';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const UiThemeThumbnail = ({ theme, selected, onSelect, label }) => (
    <button
        type='button'
        data-theme={theme.id}
        onClick={onSelect}
        className={cn(
            'group flex flex-col overflow-hidden rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            {
                'border-brand': selected,
                'border-border hover:border-muted-foreground': !selected,
            },
        )}
    >
        <div className='relative h-14 w-full bg-background'>
            <div className='h-2.5 w-full bg-surface'>
                <div className='flex h-full items-center gap-0.5 px-1.5'>
                    <span className='size-1 rounded-full bg-red-500' />
                    <span className='size-1 rounded-full bg-yellow-500' />
                    <span className='size-1 rounded-full bg-green-500' />
                </div>
            </div>
            <div className='flex flex-col gap-1 p-1.5 pt-2'>
                <div className='h-1 w-10 rounded-full bg-brand opacity-80' />
                <div className='h-1 w-14 rounded-full bg-foreground opacity-25' />
                <div className='h-1 w-8 rounded-full bg-foreground opacity-15' />
                <div className='h-1 w-12 rounded-full bg-foreground opacity-25' />
            </div>
            {selected && (
                <div className='absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-brand'>
                    <Check className='size-2.5 text-brand-foreground' />
                </div>
            )}
        </div>
        <div className='bg-surface px-2 py-1.5 text-xs font-medium text-foreground'>{label}</div>
    </button>
);

const MonacoThemeThumbnail = ({ theme, selected, onSelect, label }) => {
    const { preview } = theme;
    return (
        <button
            type='button'
            onClick={onSelect}
            style={{
                '--thumb-bg': preview.bg,
                '--thumb-keyword': preview.keyword,
                '--thumb-string': preview.string,
                '--thumb-comment': preview.comment,
                '--thumb-text': preview.text,
                '--thumb-border': `${preview.keyword}33`,
            }}
            className={cn(
                'group flex flex-col overflow-hidden rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                {
                    'border-brand': selected,
                    'border-border hover:border-muted-foreground': !selected,
                },
            )}
        >
            <div className='relative h-14 w-full bg-(--thumb-bg) px-2 py-3 text-left font-mono text-[8px] leading-tight'>
                <div>
                    <span className='text-(--thumb-keyword)'>{'const '}</span>
                    <span className='text-(--thumb-text)'>{'x '}</span>
                    <span className='text-(--thumb-text)'>{'= '}</span>
                    <span className='text-(--thumb-string)'>{'"hello"'}</span>
                </div>
                <div className='text-(--thumb-comment)'>{'// comment'}</div>
                <div>
                    <span className='text-(--thumb-keyword)'>{'return '}</span>
                    <span className='text-(--thumb-text)'>{'x'}</span>
                </div>
                {selected && (
                    <div className='absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-brand'>
                        <Check className='size-2.5 text-brand-foreground' />
                    </div>
                )}
            </div>
            <div className='border-t border-(--thumb-border) bg-(--thumb-bg) px-2 py-1.5 text-xs font-medium text-(--thumb-text)'>
                {label}
            </div>
        </button>
    );
};

const formatAuthor = ({ name, nick }) => {
    if (name && nick) return `${name} (@${nick})`;
    if (nick) return `@${nick}`;
    return name ?? '';
};

const ThemeAttribution = ({ themeId, t }) => {
    const attribution = THEME_ATTRIBUTIONS[themeId];
    if (!attribution) return null;
    const { name, nick, license, url } = attribution;
    const author = formatAuthor({ name, nick });
    const displayUrl = url?.replace(/^https?:\/\//, '');

    return (
        <div className='mt-3 flex items-center gap-2.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground'>
            {license && (
                <span className='shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] font-medium text-foreground'>
                    {license}
                </span>
            )}
            <span className='shrink-0'>
                {t('settings.appearance.created_by')}{' '}
                <span className='text-foreground'>{author}</span>
            </span>
            <a
                href={url}
                target='_blank'
                rel='noopener noreferrer'
                className='ml-auto flex min-w-0 items-center gap-1 transition-colors hover:text-foreground [&>svg]:size-3'
            >
                <span className='min-w-0 truncate'>{displayUrl}</span>
                <ExternalLink className='shrink-0' />
            </a>
        </div>
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
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
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
                    <ThemeAttribution themeId={uiTheme} t={t} />
                </div>

                <div>
                    <p className='mb-3 text-sm font-medium text-foreground'>
                        {t('settings.appearance.monaco_theme_label')}
                    </p>
                    <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
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
                    <ThemeAttribution themeId={monacoTheme} t={t} />
                </div>

                <SettingGroup>
                    <SettingRow label={t('settings.appearance.language_label')}>
                        <select
                            value={language}
                            onChange={e => {
                                setLanguage(e.target.value);
                                i18n.changeLanguage(e.target.value);
                            }}
                            className='h-8 rounded-lg accent-amber-300 border border-input bg-transparent px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                        >
                            {SUPPORTED_LANGUAGES.map(l => (
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

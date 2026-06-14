import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { Switch } from '@/ui/switch';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { cn } from '@/helpers/utils';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const PROVIDERS = [
    {
        id: 'claude',
        label: 'Claude',
        models: ['claude-opus-4-8', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
        needsKey: true,
        needsUrl: false,
    },
    {
        id: 'openai',
        label: 'OpenAI',
        models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
        needsKey: true,
        needsUrl: false,
    },
    {
        id: 'gemini',
        label: 'Gemini',
        models: ['gemini-2.0-flash', 'gemini-2.0-pro'],
        needsKey: true,
        needsUrl: false,
    },
    {
        id: 'openrouter',
        label: 'OpenRouter',
        models: [],
        needsKey: true,
        needsUrl: false,
    },
    {
        id: 'ollama',
        label: 'Ollama',
        models: [],
        needsKey: false,
        needsUrl: true,
    },
];

const ProviderTab = ({ provider, active, onClick }) => (
    <button
        type='button'
        onClick={onClick}
        className={cn(
            'rounded-md px-2.5 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            {
                'bg-muted font-medium text-foreground': active,
                'text-muted-foreground hover:text-foreground': !active,
            },
        )}
    >
        {provider.label}
    </button>
);

export const AiCompletionsSection = () => {
    const { t } = useTranslation();
    const [aiCompletions, setAiCompletions] = useSettings('aiCompletions', {});
    const [showKey, setShowKey] = useState(false);

    const set = (key, val) => setAiCompletions(prev => ({ ...prev, [key]: val }));

    const currentProvider = PROVIDERS.find(p => p.id === (aiCompletions.provider ?? 'ollama')) ?? PROVIDERS[4];
    const hasPresetModels = currentProvider.models.length > 0;

    return (
        <section id='settings-ai-completions'>
            <SectionHeading title={t('settings.ai_completions.title')} />
            <div className='flex flex-col gap-4'>
                <SettingGroup>
                    <SettingRow label={t('settings.ai_completions.enabled_label')}>
                        <Switch
                            checked={aiCompletions.enabled ?? false}
                            onCheckedChange={v => set('enabled', v)}
                        />
                    </SettingRow>
                </SettingGroup>

                {(aiCompletions.enabled ?? false) && (
                    <>
                        <div>
                            <p className='mb-2 text-sm font-medium text-foreground'>
                                {t('settings.ai_completions.provider_label')}
                            </p>
                            <div className='flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1'>
                                {PROVIDERS.map(p => (
                                    <ProviderTab
                                        key={p.id}
                                        provider={p}
                                        active={aiCompletions.provider === p.id}
                                        onClick={() => set('provider', p.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        <SettingGroup>
                            <SettingRow label={t('settings.ai_completions.model_label')}>
                                {hasPresetModels ? (
                                    <select
                                        value={aiCompletions.model ?? currentProvider.models[0]}
                                        onChange={e => set('model', e.target.value)}
                                        className='h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                                    >
                                        {currentProvider.models.map(m => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                        <option value='custom'>{t('settings.ai_completions.model_custom')}</option>
                                    </select>
                                ) : (
                                    <Input
                                        value={aiCompletions.model ?? ''}
                                        onChange={e => set('model', e.target.value)}
                                        placeholder={t('settings.ai_completions.model_placeholder')}
                                        className='w-48'
                                    />
                                )}
                            </SettingRow>

                            {currentProvider.needsKey && (
                                <SettingRow label={t('settings.ai_completions.api_key_label')}>
                                    <div className='flex items-center gap-1.5'>
                                        <Input
                                            type={showKey ? 'text' : 'password'}
                                            value={aiCompletions.apiKey ?? ''}
                                            onChange={e => set('apiKey', e.target.value)}
                                            placeholder='sk-...'
                                            className='w-48'
                                        />
                                        <Button
                                            variant='ghost'
                                            size='xs'
                                            onClick={() => setShowKey(s => !s)}
                                        >
                                            {showKey ? t('settings.ai_completions.hide') : t('settings.ai_completions.show')}
                                        </Button>
                                    </div>
                                </SettingRow>
                            )}

                            {currentProvider.needsUrl && (
                                <SettingRow label={t('settings.ai_completions.base_url_label')}>
                                    <Input
                                        value={aiCompletions.baseUrl ?? 'http://localhost:11434'}
                                        onChange={e => set('baseUrl', e.target.value)}
                                        className='w-48'
                                    />
                                </SettingRow>
                            )}
                        </SettingGroup>

                        <div className='flex items-start gap-2 rounded-xl border border-border bg-card p-3'>
                            <AlertCircle className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
                            <p className='text-xs text-muted-foreground'>
                                {t('settings.ai_completions.key_notice')}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

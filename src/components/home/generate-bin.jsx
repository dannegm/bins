import { useState, useRef, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowUp, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { useSettings } from '@/hooks/use-settings';
import { isAiEnabled } from '@/helpers/ai';
import { fetchBinGeneration } from '@/services/ai-completions';
import { createBinWithFiles } from '@/services/bins';

const ALL_SUGGESTIONS = Array.from({ length: 35 }, (_, i) => `home.generate.suggestion_${i + 1}`);

const pickRandom = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

export const GenerateBin = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [aiCompletions] = useSettings('aiCompletions');
    const [prompt, setPrompt] = useState('');
    const [focused, setFocused] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [suggestions] = useState(() => pickRandom(ALL_SUGGESTIONS, 3));
    const $abort = useRef(null);
    const $textarea = useRef(null);

    useEffect(() => {
        const el = $textarea.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${el.scrollHeight}px`;
    }, [prompt]);

    if (!isAiEnabled(aiCompletions)) return null;

    const handleSubmit = async () => {
        if (!prompt.trim() || isGenerating) return;

        $abort.current?.abort();
        $abort.current = new AbortController();

        setIsGenerating(true);
        setError(null);

        try {
            const { provider, model, apiKey, baseUrl } = aiCompletions;
            const result = await fetchBinGeneration({
                provider,
                model,
                apiKey,
                baseUrl,
                prompt: prompt.trim(),
                signal: $abort.current.signal,
            });
            const binId = await createBinWithFiles(result.title, result.files);
            navigate({ to: '/editor/$binId', params: { binId } });
        } catch (err) {
            if (err.name !== 'AbortError') setError(t('home.generate.error'));
            setIsGenerating(false);
        }
    };

    const handleKeyDown = e => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleSuggestion = text => {
        setPrompt(text);
        $textarea.current?.focus();
    };

    const canSubmit = prompt.trim().length > 0 && !isGenerating;

    return (
        <div className='flex flex-col gap-3'>
            <div
                className={cn(
                    'rounded-2xl border bg-card p-4 transition-colors duration-150',
                    {
                        'border-brand/40': focused || prompt.length > 0,
                        'border-border': !focused && prompt.length === 0,
                    },
                )}
            >
                <textarea
                    ref={$textarea}
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={t('home.generate.placeholder')}
                    disabled={isGenerating}
                    rows={1}
                    className='w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50'
                    style={{ maxHeight: '12rem', overflowY: 'auto' }}
                />
                <div className='mt-3 flex items-center justify-between'>
                    <div className='flex items-center gap-1.5'>
                        <Sparkles className='size-3 text-muted-foreground' />
                        <span className='text-xs text-muted-foreground'>{t('home.generate.hint')}</span>
                    </div>
                    <button
                        type='button'
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-xl transition-all',
                            {
                                'bg-brand text-brand-foreground cursor-pointer hover:opacity-90': canSubmit,
                                'bg-muted text-muted-foreground cursor-not-allowed': !canSubmit,
                            },
                        )}
                    >
                        {isGenerating ? (
                            <Loader2 className='size-4 animate-spin' />
                        ) : (
                            <ArrowUp className='size-4' />
                        )}
                    </button>
                </div>
            </div>
            {error && <p className='text-sm text-destructive'>{error}</p>}
            <div className='flex flex-wrap gap-2'>
                {suggestions.map(key => (
                    <button
                        key={key}
                        type='button'
                        onClick={() => handleSuggestion(t(key))}
                        disabled={isGenerating}
                        className='rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {t(key)}
                    </button>
                ))}
            </div>
        </div>
    );
};

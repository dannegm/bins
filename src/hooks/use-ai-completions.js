import { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { useSettings } from '@/hooks/use-settings';
import { fetchCompletion } from '@/services/ai-completions';

export const useAiCompletions = () => {
    const [aiCompletions] = useSettings('aiCompletions');
    const $config = useRef(aiCompletions);
    $config.current = aiCompletions;

    useEffect(() => {
        const disposable = monaco.languages.registerInlineCompletionsProvider(
            { pattern: '**' },
            {
                async provideInlineCompletions(model, position, context, token) {
                    const config = $config.current;
                    if (!config?.enabled) return { items: [] };

                    const fullText = model.getValue();
                    const offset = model.getOffsetAt(position);
                    const prefix = fullText.slice(0, offset);
                    const suffix = fullText.slice(offset);

                    if (!prefix.trim()) return { items: [] };

                    const controller = new AbortController();
                    token.onCancellationRequested(() => controller.abort());

                    try {
                        const text = await fetchCompletion({
                            provider: config.provider ?? 'ollama',
                            model: config.model,
                            apiKey: config.apiKey,
                            baseUrl: config.baseUrl,
                            prefix,
                            suffix,
                            language: model.getLanguageId(),
                            signal: controller.signal,
                        });

                        if (!text || token.isCancellationRequested) return { items: [] };

                        return {
                            items: [
                                {
                                    insertText: text,
                                    range: new monaco.Range(
                                        position.lineNumber,
                                        position.column,
                                        position.lineNumber,
                                        position.column,
                                    ),
                                },
                            ],
                        };
                    } catch {
                        return { items: [] };
                    }
                },
                freeInlineCompletions() {},
            },
        );

        return () => disposable.dispose();
    }, []);
};

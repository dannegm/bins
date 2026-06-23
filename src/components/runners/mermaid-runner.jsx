import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle } from 'lucide-react';
import mermaid from 'mermaid';
import { useTheme } from '@/providers/theme-provider';
import { useDebouncedEffect } from '@/hooks/use-debounced-effect';

let idCounter = 0;

const getThemeVariables = isDark => ({
    darkMode: isDark,
    background: 'transparent',
    primaryColor: isDark ? '#3f3f46' : '#e4e4e7',
    primaryTextColor: isDark ? '#fafafa' : '#09090b',
    primaryBorderColor: isDark ? '#52525b' : '#d4d4d8',
    lineColor: isDark ? '#71717a' : '#a1a1aa',
    secondaryColor: isDark ? '#27272a' : '#f4f4f5',
    tertiaryColor: isDark ? '#18181b' : '#ffffff',
    edgeLabelBackground: isDark ? '#27272a' : '#f4f4f5',
    clusterBkg: isDark ? '#27272a' : '#f4f4f5',
    clusterBorder: isDark ? '#52525b' : '#d4d4d8',
    titleColor: isDark ? '#fafafa' : '#09090b',
    nodeBorder: isDark ? '#52525b' : '#d4d4d8',
    mainBkg: isDark ? '#3f3f46' : '#e4e4e7',
    noteTextColor: isDark ? '#fafafa' : '#09090b',
    noteBkgColor: isDark ? '#3f3f46' : '#fef9c3',
    noteBorderColor: isDark ? '#52525b' : '#fde047',
    actorBkg: isDark ? '#3f3f46' : '#e4e4e7',
    actorBorder: isDark ? '#52525b' : '#d4d4d8',
    actorTextColor: isDark ? '#fafafa' : '#09090b',
    actorLineColor: isDark ? '#71717a' : '#a1a1aa',
    signalColor: isDark ? '#a1a1aa' : '#52525b',
    signalTextColor: isDark ? '#fafafa' : '#09090b',
    labelBoxBkgColor: isDark ? '#3f3f46' : '#e4e4e7',
    labelBoxBorderColor: isDark ? '#52525b' : '#d4d4d8',
    labelTextColor: isDark ? '#fafafa' : '#09090b',
    loopTextColor: isDark ? '#fafafa' : '#09090b',
    activationBorderColor: isDark ? '#71717a' : '#a1a1aa',
    activationBkgColor: isDark ? '#27272a' : '#f4f4f5',
    sequenceNumberColor: isDark ? '#09090b' : '#fafafa',
    fillType0: isDark ? '#3f3f46' : '#e4e4e7',
    fillType1: isDark ? '#27272a' : '#f4f4f5',
    fillType2: isDark ? '#52525b' : '#d4d4d8',
    fillType3: isDark ? '#3f3f46' : '#e4e4e7',
    fillType4: isDark ? '#27272a' : '#f4f4f5',
    fillType5: isDark ? '#52525b' : '#d4d4d8',
    fillType6: isDark ? '#3f3f46' : '#e4e4e7',
    fillType7: isDark ? '#27272a' : '#f4f4f5',
});

const ErrorState = ({ message, t }) => (
    <div className='flex flex-col gap-2 px-4 py-6'>
        <div className='flex items-center gap-2 text-destructive'>
            <AlertCircle className='size-4 shrink-0' />
            <span className='text-xs font-medium'>{t('editor.runner_panel.mermaid.error')}</span>
        </div>
        <pre className='rounded border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive whitespace-pre-wrap break-all'>
            {message}
        </pre>
    </div>
);

export const MermaidRunner = ({ content }) => {
    const { t } = useTranslation();
    const { isDark } = useTheme();
    const $container = useRef(null);
    const [error, setError] = useState(null);

    const render = async () => {
        if (!$container.current) return;

        const id = `mermaid-${++idCounter}`;
        const diagram = (content ?? '').trim();

        if (!diagram) {
            $container.current.innerHTML = '';
            setError(null);
            return;
        }

        mermaid.initialize({
            startOnLoad: false,
            theme: 'base',
            themeVariables: getThemeVariables(isDark),
            securityLevel: 'loose',
            fontFamily: 'inherit',
        });

        try {
            const { svg } = await mermaid.render(id, diagram);
            if ($container.current) {
                $container.current.innerHTML = svg;
                setError(null);
                const el = $container.current.querySelector('svg');
                if (el) {
                    el.style.width = '100%';
                    el.style.height = 'auto';
                }
            }
        } catch (err) {
            if ($container.current) $container.current.innerHTML = '';
            setError(err?.message ?? String(err));
        }
    };

    useDebouncedEffect(
        () => {
            render();
        },
        [content, isDark],
        300,
    );

    // Render immediately on mount
    useEffect(() => {
        render();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (error) return <ErrorState message={error} t={t} />;

    return (
        <div className='flex items-start justify-center p-4 min-h-32 bg-surface'>
            <div ref={$container} className='w-full' />
        </div>
    );
};

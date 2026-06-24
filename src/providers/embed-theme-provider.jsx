import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { UI_THEMES } from '@/constants/themes';

const EmbedThemeContext = createContext('dark');

export const useEmbedTheme = () => useContext(EmbedThemeContext);

const resolveSystemTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const applyTheme = theme => {
    document.documentElement.setAttribute('data-theme', theme.id);
    document.documentElement.setAttribute('data-theme-gama', theme.isDark ? 'dark' : 'light');
};

export const EmbedThemeProvider = ({ children }) => {
    const [themeParam] = useQueryState('theme', parseAsString);
    const [themeId, setThemeId] = useState(() => {
        if (themeParam) {
            const match = UI_THEMES.find(t => t.id === themeParam);
            if (match) return match.id;
        }
        return resolveSystemTheme();
    });

    useEffect(() => {
        if (themeParam) {
            const match = UI_THEMES.find(t => t.id === themeParam);
            if (match) {
                setThemeId(match.id);
                applyTheme(match);
                return;
            }
        }

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const id = mq.matches ? 'dark' : 'light';
        setThemeId(id);
        applyTheme(UI_THEMES.find(t => t.id === id));

        const handler = e => {
            const next = e.matches ? 'dark' : 'light';
            setThemeId(next);
            applyTheme(UI_THEMES.find(t => t.id === next));
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [themeParam]);

    return <EmbedThemeContext.Provider value={themeId}>{children}</EmbedThemeContext.Provider>;
};

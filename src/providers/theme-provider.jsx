import { createContext, useContext, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { UI_THEMES } from '@/constants/themes';

const ThemeContext = createContext({ uiTheme: 'dark', isDark: true });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
    const [uiTheme] = useSettings('uiTheme', 'dark');
    const isDark = UI_THEMES.find(t => t.id === uiTheme)?.isDark ?? true;

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', uiTheme);
        document.documentElement.setAttribute('data-theme-gama', isDark ? 'dark' : 'light');
    }, [uiTheme, isDark]);

    return <ThemeContext.Provider value={{ uiTheme, isDark }}>{children}</ThemeContext.Provider>;
};

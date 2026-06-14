import { useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';

export const ThemeProvider = ({ children }) => {
    const [uiTheme] = useSettings('uiTheme', 'dark');

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', uiTheme);
    }, [uiTheme]);

    return children;
};

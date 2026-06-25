import JsonView from '@microlink/react-json-view';
import { useTheme } from '@/providers/theme-provider';
import { JSON_VIEW_THEMES } from '@/constants/json-view-themes';

export const ThemedJsonView = ({ className, src, ...props }) => {
    const { uiTheme } = useTheme();
    const theme = JSON_VIEW_THEMES[uiTheme] ?? JSON_VIEW_THEMES.dark;

    if (src === null || typeof src !== 'object') return null;

    return (
        <div className={className}>
            <JsonView
                src={src}
                theme={theme}
                style={{ background: 'transparent', fontSize: '12px', fontFamily: 'inherit' }}
                {...props}
            />
        </div>
    );
};

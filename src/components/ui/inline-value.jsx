import { cn } from '@/helpers/utils';
import { useTheme } from '@/providers/theme-provider';
import { JSON_VIEW_THEMES } from '@/constants/json-view-themes';

const resolve = (v, palette) => {
    if (v === null) return { text: 'null',       color: palette.base08, type: 'null'    };
    switch (typeof v) {
        case 'number':  return { text: String(v),  color: palette.base09, type: 'number'  };
        case 'boolean': return { text: String(v),  color: palette.base0E, type: 'boolean' };
        case 'string':  return { text: `"${v}"`,   color: palette.base0B, type: 'string'  };
        default: {
            let text;
            try { text = (JSON.stringify(v) ?? String(v)).slice(0, 80); }
            catch { text = String(v); }
            return { text, color: palette.base05, type: typeof v };
        }
    }
};

export const InlineValue = ({ className, value }) => {
    const { uiTheme } = useTheme();
    const palette = JSON_VIEW_THEMES[uiTheme] ?? JSON_VIEW_THEMES.dark;

    let resolved;
    try { resolved = resolve(value, palette); }
    catch { resolved = { text: String(value), color: palette.base05, type: typeof value }; }

    const { text, color, type } = resolved;

    return (
        <span className={cn('inline-flex items-baseline gap-1.5 font-mono text-xs', className)}>
            <span className='text-(--iv-color)' style={{ '--iv-color': color }}>{text}</span>
            <span className='text-[10px] text-(--iv-type-color)' style={{ '--iv-type-color': palette.base03 }}>{type}</span>
        </span>
    );
};

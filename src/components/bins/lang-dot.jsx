import { cn } from '@/helpers/utils';

export const getLangForeground = hex => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? '#1a1a1a' : '#ffffff';
};

export const LangDot = ({ lang, className }) => (
    <span
        className={cn(
            'flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-background bg-(--lang-bg) text-[10px] text-(--lang-fg)',
            className,
        )}
        style={{ '--lang-bg': lang.color, '--lang-fg': getLangForeground(lang.color) }}
    >
        {lang.icon ? (
            <i className={lang.icon} />
        ) : (
            <span className='text-[8px] font-bold'>{lang.label[0]}</span>
        )}
    </span>
);

import { cn } from '@/helpers/utils';

export const Switch = ({ checked, onCheckedChange, disabled }) => (
    <button
        type='button'
        role='switch'
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
            { 'bg-brand': checked, 'bg-input': !checked },
        )}
    >
        <span
            className={cn(
                'pointer-events-none block size-4 rounded-full bg-background shadow-sm transition-transform',
                { 'translate-x-4': checked, 'translate-x-0': !checked },
            )}
        />
    </button>
);

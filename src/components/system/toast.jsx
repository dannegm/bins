import { toast as sonner } from 'sonner';
import { Check, X, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/helpers/utils';

const VARIANTS = {
    success: { icon: Check, iconClass: 'bg-success/15 text-success' },
    error: { icon: X, iconClass: 'bg-destructive/15 text-destructive' },
    warning: { icon: AlertTriangle, iconClass: 'bg-warning/15 text-warning' },
    info: { icon: Info, iconClass: 'bg-brand/15 text-brand' },
};

const ToastItem = ({ message, description, variant = 'info' }) => {
    const { icon: Icon, iconClass } = VARIANTS[variant] ?? VARIANTS.info;

    return (
        <div className='flex min-w-64 max-w-sm items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-lg shadow-black/10'>
            <div
                className={cn(
                    'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full [&>svg]:size-3',
                    iconClass,
                )}
            >
                <Icon />
            </div>
            <div className='flex flex-col gap-0.5'>
                <span className='text-sm font-medium text-foreground'>{message}</span>
                {description && (
                    <span className='text-xs text-muted-foreground'>{description}</span>
                )}
            </div>
        </div>
    );
};

const make = variant => (message, opts) =>
    sonner.custom(() => <ToastItem message={message} variant={variant} {...opts} />, opts);

export const toast = {
    success: make('success'),
    error: make('error'),
    warning: make('warning'),
    info: make('info'),
    custom: sonner.custom,
    dismiss: sonner.dismiss,
    loading: sonner.loading,
    promise: sonner.promise,
};

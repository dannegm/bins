import { cva } from 'class-variance-authority';
import { cn } from '@/helpers/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium [&>svg]:pointer-events-none [&>svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'bg-primary/10 text-primary',
                secondary: 'bg-muted text-muted-foreground',
                outline: 'border border-border text-foreground',
                destructive: 'bg-destructive/10 text-destructive',
                success: 'bg-success/10 text-success',
                warning: 'bg-warning/10 text-warning',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

export const Badge = ({ className, variant, ...props }) => (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

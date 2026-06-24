import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox';
import { Check } from 'lucide-react';
import { cn } from '@/helpers/utils';

export const Checkbox = ({ className, ...props }) => (
    <CheckboxPrimitive.Root
        className={cn(
            'flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm border border-border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 data-checked:border-brand data-checked:bg-brand',
            className,
        )}
        {...props}
    >
        <CheckboxPrimitive.Indicator className='flex items-center justify-center text-brand-foreground'>
            <Check className='size-3' strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
);

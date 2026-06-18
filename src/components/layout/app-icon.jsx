import { cn } from '@/helpers/utils';
import { Link } from '@tanstack/react-router';

export const AppIcon = ({ className }) => (
    <Link to='/' className={cn('flex items-center justify-center', className)}>
        <div
            className={cn(
                'grid grid-cols-2 grid-rows-2 gap-0 size-8 p-1 overflow-hidden squircle-xl bg-brand',
                className,
            )}
        >
            {['B', 'I', 'N', 'S'].map(l => (
                <span
                    key={l}
                    className='flex-center font-mono text-[11px] font-bold leading-none text-brand-foreground'
                >
                    {l}
                </span>
            ))}
        </div>
    </Link>
);

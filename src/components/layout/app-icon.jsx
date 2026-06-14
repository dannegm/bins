import { Link } from '@tanstack/react-router';
import { cn } from '@/helpers/utils';

export const AppIcon = ({ className }) => (
    <Link
        to='/'
        className={cn('grid size-8 p-1 grid-cols-2 grid-rows-2 gap-0 overflow-hidden squircle-xl bg-brand', className)}
        title='Home'
    >
        {['B', 'I', 'N', 'S'].map(l => (
            <span
                key={l}
                className='flex items-center justify-center font-mono text-[11px] font-bold leading-none text-brand-foreground'
            >
                {l}
            </span>
        ))}
    </Link>
);

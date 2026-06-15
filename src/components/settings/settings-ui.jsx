import { cn } from '@/helpers/utils';

export const SectionHeading = ({ title, description }) => (
    <div className='mb-6'>
        <div className='flex items-baseline gap-1.5'>
            <span className='font-mono text-xs text-muted-foreground'>##</span>
            <h2 className='text-base font-semibold text-foreground'>{title}</h2>
        </div>
        {description && <p className='mt-1 text-sm text-muted-foreground'>{description}</p>}
    </div>
);

export const SettingRow = ({ label, description, children, className }) => (
    <div className={cn('flex items-center justify-between gap-4 py-3', className)}>
        <div className='min-w-0 flex-1'>
            <div className='text-sm font-medium text-foreground'>{label}</div>
            {description && (
                <div className='mt-0.5 text-xs text-muted-foreground text-pretty'>
                    {description}
                </div>
            )}
        </div>
        <div className='shrink-0'>{children}</div>
    </div>
);

export const SettingGroup = ({ children }) => (
    <div className='overflow-hidden rounded-xl border border-border bg-card'>
        <div className='divide-y divide-border px-4'>{children}</div>
    </div>
);

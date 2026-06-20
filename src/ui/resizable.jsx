import { GripVertical } from 'lucide-react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import { cn } from '@/helpers/utils';

export const ResizablePanelGroup = ({ className, ...props }) => (
    <Group
        className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
        {...props}
    />
);

export const ResizablePanel = Panel;

export const ResizableHandle = ({ withHandle, className, ...props }) => (
    <Separator
        className={cn(
            'relative z-50 flex w-px shrink-0 items-center justify-center bg-border transition-colors',
            'after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2',
            'hover:bg-accent/40 focus-visible:outline-none',
            className,
        )}
        {...props}
    >
        {withHandle && (
            <div className='z-10 flex h-8 w-3 items-center justify-center rounded-sm border border-border bg-surface'>
                <GripVertical className='size-2.5 text-muted-foreground' />
            </div>
        )}
    </Separator>
);

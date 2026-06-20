import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/ui/scroll-area';

export const RunnerPanel = ({ runner, content, onClose }) => {
    const { t } = useTranslation();
    const RunnerComponent = runner?.component;

    return (
        <div className='relative flex mt-4 sm:mt-0 min-h-0 flex-1 flex-col border-l border-border bg-background'>
            <div className='hidden sm:flex h-8 shrink-0 items-center gap-2 border-b border-border bg-surface px-3 text-xs'>
                <span className='flex-1 font-medium text-foreground'>{runner?.label}</span>
                <button
                    onClick={onClose}
                    title={t('editor.runner_panel.close')}
                    className='rounded p-0.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'
                >
                    <X className='size-3.5' />
                </button>
            </div>
            <div className='absolute inset-x-0 bottom-0 top-0 sm:top-8'>
                <ScrollArea className='h-full'>
                    {RunnerComponent && <RunnerComponent content={content} />}
                </ScrollArea>
            </div>
        </div>
    );
};

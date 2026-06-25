import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/ui/tooltip';

export const RunnerPanel = ({ runner, content, language, fileId, packages, onClose }) => {
    const { t } = useTranslation();
    const RunnerComponent = runner?.component;

    return (
        <div className='relative flex mt-4 sm:mt-0 min-h-0 flex-1 flex-col bg-surface'>
            <div className='hidden sm:flex h-8 shrink-0 items-center gap-2 border-b border-border px-3 text-xs'>
                <span className='flex-1 font-medium text-foreground'>{runner?.label}</span>
                {onClose && (
                    <TooltipProvider delay={1500}>
                        <Tooltip>
                            <TooltipTrigger
                                onClick={onClose}
                                className='rounded p-0.5 text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground'
                            >
                                <X className='size-3.5' />
                            </TooltipTrigger>
                            <TooltipContent side='bottom' align='end'>
                                {t('editor.runner_panel.close')}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            <div className='absolute inset-x-0 bottom-0 top-0 sm:top-8'>
                <ScrollArea className='h-full'>
                    {RunnerComponent && (
                        <RunnerComponent
                            content={content}
                            language={language}
                            fileId={fileId}
                            packages={packages}
                        />
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};

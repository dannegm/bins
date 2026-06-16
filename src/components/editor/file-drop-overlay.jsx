import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileEdit, ArrowDownToLine, FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/helpers/utils';
import { getLanguageByFilename } from '@/constants/languages';

const MAX_FILE_SIZE = 500 * 1024;
const BLOCKED_TYPES = ['image/', 'video/', 'audio/'];

const isBlocked = file => BLOCKED_TYPES.some(prefix => file.type.startsWith(prefix));

const readAsText = file =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });

const ZONES = [
    { id: 'replace', icon: FileEdit },
    { id: 'append', icon: ArrowDownToLine },
    { id: 'new_tab', icon: FilePlus },
];

const DropZone = ({ id, icon: Icon, label, description, isHovered, onDragEnter, onDrop }) => (
    <div
        className={cn(
            'flex flex-1 flex-col items-center justify-center gap-4 border-r border-border/20 px-8 py-12 transition-colors last:border-r-0',
            {
                'bg-brand/10': isHovered,
                'bg-surface/60': !isHovered,
            },
        )}
        onDragEnter={onDragEnter}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
    >
        <div
            className={cn('flex size-14 items-center justify-center rounded-xl border transition-colors', {
                'border-brand bg-brand/15 text-brand': isHovered,
                'border-border/30 bg-surface text-muted-foreground': !isHovered,
            })}
        >
            <Icon size={24} />
        </div>
        <div className='flex flex-col items-center gap-1 text-center'>
            <span
                className={cn('text-sm font-semibold transition-colors', {
                    'text-brand': isHovered,
                    'text-foreground': !isHovered,
                })}
            >
                {label}
            </span>
            <span className='text-xs text-muted-foreground'>{description}</span>
        </div>
    </div>
);

export const FileDropOverlay = ({ yContext, onCreateFile, onDismiss }) => {
    const { t } = useTranslation();
    const [hoveredZone, setHoveredZone] = useState(null);

    const processFile = async (file, action) => {
        onDismiss?.();

        if (isBlocked(file)) {
            toast.error(t('editor.drop_overlay.error_type'));
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error(t('editor.drop_overlay.error_size'));
            return;
        }

        let content;
        try {
            content = await readAsText(file);
        } catch {
            toast.error(t('editor.drop_overlay.error_read'));
            return;
        }

        if (action === 'replace') {
            yContext.yText.doc.transact(() => {
                yContext.yText.delete(0, yContext.yText.length);
                yContext.yText.insert(0, content);
            });
        } else if (action === 'append') {
            const len = yContext.yText.length;
            yContext.yText.doc.transact(() => {
                yContext.yText.insert(len, (len > 0 ? '\n' : '') + content);
            });
        } else if (action === 'new_tab') {
            const lang = getLanguageByFilename(file.name);
            onCreateFile?.({ name: file.name, language: lang.id, content });
        }
    };

    const handleDrop = (e, action) => {
        e.preventDefault();
        setHoveredZone(null);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file, action);
    };

    return (
        <div className='absolute inset-0 z-50 flex flex-col backdrop-blur-xs'>
            <div className='flex items-center justify-center border-b border-border/20 bg-background/70 py-3'>
                <span className='text-xs text-muted-foreground'>
                    {t('editor.drop_overlay.hint')}
                </span>
            </div>
            <div className='flex min-h-0 flex-1'>
                {ZONES.map(zone => (
                    <DropZone
                        key={zone.id}
                        id={zone.id}
                        icon={zone.icon}
                        label={t(`editor.drop_overlay.${zone.id}`)}
                        description={t(`editor.drop_overlay.${zone.id}_desc`)}
                        isHovered={hoveredZone === zone.id}
                        onDragEnter={() => setHoveredZone(zone.id)}
                        onDrop={e => handleDrop(e, zone.id)}
                    />
                ))}
            </div>
        </div>
    );
};

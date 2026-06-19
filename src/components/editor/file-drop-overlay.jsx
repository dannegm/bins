import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileEdit, ArrowDownToLine, FilePlus } from 'lucide-react';
import { motion } from 'motion/react';
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

const DropZone = ({ icon: Icon, label, description, isHovered, onDragEnter, onDrop }) => (
    <div
        className='relative flex-center flex-1 gap-4 border-r border-border/20 px-8 py-12 last:border-r-0 bg-surface/50 transition-[background] duration-150'
        onDragEnter={onDragEnter}
        onDragOver={e => e.preventDefault()}
        onDrop={onDrop}
    >
        <div
            className={cn(
                'hidden absolute inset-4 rounded-xl border-2 border-dashed border-brand pointer-events-none opacity-20 animate-[pulse_1s_infinite]',
                { block: isHovered },
            )}
        />
        <motion.div
            className='flex flex-col items-center gap-4'
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.15 }}
        >
            <div className='flex size-14 items-center justify-center rounded-xl border border-border/30 bg-surface text-muted-foreground'>
                <Icon size={24} />
            </div>
            <div className='flex flex-col items-center gap-1 text-center text-foreground'>
                <span className='text-md font-semibold'>{label}</span>
                <span className='text-sm'>{description}</span>
            </div>
        </motion.div>
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

        yContext.undoManager.trackedOrigins.add('drop');

        if (action === 'replace') {
            yContext.yText.doc.transact(() => {
                yContext.yText.delete(0, yContext.yText.length);
                yContext.yText.insert(0, content);
            }, 'drop');
        } else if (action === 'append') {
            const len = yContext.yText.length;
            yContext.yText.doc.transact(() => {
                yContext.yText.insert(len, (len > 0 ? '\n' : '') + content);
            }, 'drop');
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
        <motion.div
            className='absolute inset-0 z-50 flex flex-col backdrop-blur-sm'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
        >
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
        </motion.div>
    );
};

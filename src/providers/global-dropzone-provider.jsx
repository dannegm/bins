import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useRouterState } from '@tanstack/react-router';
import { nanoid } from 'nanoid';
import { FilePlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/helpers/utils';
import { supabase } from '@/services/supabase';
import { createFile } from '@/services/bin-files';
import { settings } from '@/services/settings';
import { generateBinName } from '@/helpers/identity';
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

const DropOverlay = ({ onDrop, t }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={cn(
                'fixed inset-0 z-[100] flex flex-col backdrop-blur-sm transition-colors',
                {
                    'bg-brand/10': isHovered,
                    'bg-surface/60': !isHovered,
                },
            )}
            onDragEnter={() => setIsHovered(true)}
            onDragLeave={e => {
                if (!e.currentTarget.contains(e.relatedTarget)) setIsHovered(false);
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={onDrop}
        >
            <div className='flex min-h-0 flex-1 items-center justify-center'>
                <div className='flex flex-col items-center gap-4 bg-radial from-surface/70 from-40% to-transparent to-70% p-24'>
                    <div
                        className={cn(
                            'flex size-14 items-center justify-center rounded-xl border transition-colors',
                            {
                                'border-brand bg-brand/15 text-brand': isHovered,
                                'border-border/30 bg-surface text-muted-foreground': !isHovered,
                            },
                        )}
                    >
                        <FilePlus size={24} />
                    </div>
                    <div className='flex flex-col items-center gap-1 text-center'>
                        <span
                            className={cn('text-md font-semibold transition-colors', {
                                'text-brand': isHovered,
                                'text-foreground': !isHovered,
                            })}
                        >
                            {t('global_dropzone.hint')}
                        </span>
                        <span
                            className={cn('text-sm transition-colors', {
                                'text-brand': isHovered,
                                'text-foreground': !isHovered,
                            })}
                        >
                            {t('global_dropzone.hint_sub')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const GlobalDropzoneProvider = ({ children }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const pathname = useRouterState({ select: s => s.location.pathname });
    const [isDragging, setIsDragging] = useState(false);
    const $counter = useRef(0);

    const isEditorRoute = pathname.startsWith('/editor/');

    useEffect(() => {
        const handleDragEnter = e => {
            if (!e.dataTransfer?.types.includes('Files')) return;
            $counter.current += 1;
            setIsDragging(true);
        };

        const handleDragLeave = () => {
            $counter.current = Math.max(0, $counter.current - 1);
            if ($counter.current === 0) setIsDragging(false);
        };

        const handleDragOver = e => e.preventDefault();

        const handleDrop = e => {
            e.preventDefault();
            $counter.current = 0;
            setIsDragging(false);
        };

        document.addEventListener('dragenter', handleDragEnter);
        document.addEventListener('dragleave', handleDragLeave);
        document.addEventListener('dragover', handleDragOver);
        document.addEventListener('drop', handleDrop);

        return () => {
            document.removeEventListener('dragenter', handleDragEnter);
            document.removeEventListener('dragleave', handleDragLeave);
            document.removeEventListener('dragover', handleDragOver);
            document.removeEventListener('drop', handleDrop);
        };
    }, []);

    const handleOverlayDrop = async e => {
        e.preventDefault();
        e.stopPropagation();
        $counter.current = 0;
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (!file) return;

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

        const binId = nanoid(10);
        const authorId = settings.get('user.uuid');
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const title = baseName || generateBinName();
        const lang = getLanguageByFilename(file.name);

        try {
            const { error: binError } = await supabase().from('bins').insert({
                id: binId,
                title,
                author_id: authorId,
                expires_at: null,
            });
            if (binError) throw binError;

            await createFile(binId, {
                name: file.name,
                language: lang.id,
                content,
                position: 0,
            });

            navigate({ to: '/editor/$binId', params: { binId } });
        } catch {
            toast.error(t('global_dropzone.error_create'));
        }
    };

    return (
        <>
            {children}
            {isDragging && !isEditorRoute && <DropOverlay onDrop={handleOverlayDrop} t={t} />}
        </>
    );
};

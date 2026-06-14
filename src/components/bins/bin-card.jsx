import { Link } from '@tanstack/react-router';
import { Eye, Globe, Lock, GitFork } from 'lucide-react';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';

const dateFnsLocales = { en: enUS, es };

export const BinCard = ({ bin }) => {
    const { t, i18n } = useTranslation();
    const locale = dateFnsLocales[i18n.language] ?? enUS;
    const formatDate = iso => format(new Date(iso), t('formats.date.short'), { locale });

    return (
        <Link
            to='/editor/$binId'
            params={{ binId: bin.id }}
            className={cn(
                'group flex flex-col gap-3 rounded-xl border border-border bg-card p-4',
                'transition-all hover:border-border/60 hover:bg-accent',
            )}
        >
            <div className='flex items-start justify-between gap-2'>
                <span className='truncate text-sm font-medium text-card-foreground'>
                    {bin.title || t('bins.card.untitled')}
                </span>
                <span className='[&>svg]:size-3.5 shrink-0 text-muted-foreground'>
                    {bin.visibility === 'public' ? <Globe /> : <Lock />}
                </span>
            </div>

            <div className='flex items-center gap-3 text-xs text-muted-foreground'>
                <span className='flex items-center gap-1 [&>svg]:size-3'>
                    <Eye />
                    {bin.views}
                </span>
                {bin.forked_from && (
                    <span className='flex items-center gap-1 [&>svg]:size-3'>
                        <GitFork />
                        {t('bins.card.forked')}
                    </span>
                )}
                <span className='ml-auto'>{formatDate(bin.updated_at)}</span>
            </div>
        </Link>
    );
};

import { useCopyToClipboard } from '@uidotdev/usehooks';
import { Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { getAvatarUrl } from '@/helpers/avatar';
import { useIdentity } from '@/hooks/use-identity';
import { useTheme } from '@/providers/theme-provider';
import { FlickeringGrid } from '@/ui/flickering-grid';
import { Skeleton } from '@/ui/skeleton';

const StatPill = ({ label, value, color }) => (
    <div className='flex flex-col items-center gap-0.5'>
        <span
            className='text-2xl font-bold tabular-nums text-(--stat-color)'
            style={{ '--stat-color': color }}
        >
            {value}
        </span>
        <span className='text-xs text-muted-foreground'>{label}</span>
    </div>
);

const ProfileHeaderLoading = () => (
    <div className='relative flex flex-col items-center gap-6 overflow-hidden border-b border-border px-8 py-12'>
        <Skeleton className='size-24 rounded-full' />
        <div className='flex flex-col items-center gap-2'>
            <Skeleton className='h-6 w-40 rounded-full' />
            <Skeleton className='h-5 w-64 rounded-full' />
        </div>
        <div className='flex items-center gap-8'>
            <Skeleton className='h-10 w-16 rounded-lg' />
            <div className='h-8 w-px bg-border' />
            <Skeleton className='h-10 w-16 rounded-lg' />
        </div>
    </div>
);

const ProfileNotFound = ({ t }) => (
    <div className='flex flex-col items-center gap-3 border-b border-border px-8 py-16 text-center'>
        <div className='size-16 rounded-full bg-surface' />
        <p className='text-sm font-medium text-foreground'>{t('profile.not_found_title')}</p>
        <p className='text-sm text-muted-foreground'>{t('profile.not_found_description')}</p>
    </div>
);

export const ProfileHeader = ({ profile, bins, isLoading }) => {
    const { t } = useTranslation();
    const { user } = useIdentity();
    const { isDark } = useTheme();
    const [copiedText, copy] = useCopyToClipboard();

    if (isLoading) return <ProfileHeaderLoading />;
    if (!profile) return <ProfileNotFound t={t} />;

    const color = isDark ? profile.colorDark : profile.colorLight;
    const seed = profile.name + profile.uuid;
    const isMe = user?.uuid === profile.uuid;
    const totalViews = bins.reduce((sum, bin) => sum + (bin.views || 0), 0);

    return (
        <div
            className='relative flex flex-col items-center gap-6 overflow-hidden border-b border-border px-8 py-12'
            style={{ '--user-color': color }}
        >
            <FlickeringGrid
                className='absolute inset-0'
                color={color}
                squareSize={3}
                gridGap={8}
                flickerChance={0.08}
                maxOpacity={0.25}
            />

            <div className='absolute top-0 inset-x-0 h-0.5 bg-(--user-color)' />

            <div className='relative z-10'>
                <div className='size-24 overflow-hidden rounded-full border-2 border-(--user-color) shadow-lg shadow-black/30'>
                    <img src={getAvatarUrl(seed)} alt={profile.name} className='size-full' />
                </div>
                {isMe && (
                    <span className='absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground'>
                        {t('profile.you')}
                    </span>
                )}
            </div>

            <div className='relative z-10 flex flex-col items-center gap-2'>
                <h1 className='text-xl font-semibold text-foreground'>{profile.name}</h1>
                <button
                    onClick={() => copy(profile.uuid)}
                    className={cn(
                        'flex items-center gap-1.5 rounded-full border border-border/50 bg-surface/80 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur-sm',
                        'transition-colors hover:border-border hover:text-foreground',
                    )}
                >
                    <span className='size-2 shrink-0 rounded-full bg-(--user-color)' />
                    <span className='truncate max-w-56 sm:max-w-none'>{profile.uuid}</span>
                    {copiedText === profile.uuid ? (
                        <Check className='size-3 shrink-0' />
                    ) : (
                        <Copy className='size-3 shrink-0' />
                    )}
                </button>
            </div>

            <div className='relative z-10 flex items-center gap-10'>
                <StatPill label={t('profile.stats.bins')} value={bins.length} color={color} />
                <div className='h-8 w-px bg-border' />
                <StatPill
                    label={t('profile.stats.views')}
                    value={totalViews.toLocaleString()}
                    color={color}
                />
            </div>
        </div>
    );
};

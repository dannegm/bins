import { useCopyToClipboard } from '@uidotdev/usehooks';
import { Copy, Check, Bot } from 'lucide-react';
import { nextBotDeletion } from '@/helpers/ua-parser';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { useIdentity } from '@/hooks/use-identity';
import { useTheme } from '@/providers/theme-provider';
import { UserAvatar } from '@/components/system/user-avatar';
import { LangDot } from '@/components/bins/lang-dot';
import { getLanguage } from '@/constants/languages';
import { FlickeringGrid } from '@/ui/flickering-grid';
import { Skeleton } from '@/ui/skeleton';

const StatPill = ({ label, value }) => (
    <div className='flex flex-col items-center gap-0.5'>
        <span className='text-2xl font-bold tabular-nums text-foreground'>{value}</span>
        <span className='text-xs text-muted-foreground'>{label}</span>
    </div>
);

const TopLanguagesStat = ({ bins, label }) => {
    const counts = {};
    bins.forEach(bin => {
        (bin.bin_files ?? []).forEach(f => {
            counts[f.language] = (counts[f.language] ?? 0) + 1;
        });
    });

    const top = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => getLanguage(id));

    if (!top.length) return null;

    return (
        <div className='flex flex-col items-center gap-1'>
            <div className='flex items-center -space-x-1.5 py-1'>
                {top.map(lang => (
                    <LangDot key={lang.id} lang={lang} className='size-6 text-xs' />
                ))}
            </div>
            <span className='text-xs text-muted-foreground'>{label}</span>
        </div>
    );
};

const ColorStat = ({ colorDark, colorLight, label }) => (
    <div className='flex flex-col items-center gap-1'>
        <div className='flex items-center -space-x-2 py-1'>
            <span
                className='size-6 rounded-full border-2 border-background bg-(--cd) shadow-sm shadow-black/20'
                style={{ '--cd': colorDark }}
            />
            <span
                className='size-6 rounded-full border-2 border-background bg-(--cl) shadow-sm shadow-black/20'
                style={{ '--cl': colorLight }}
            />
        </div>
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

const dateFnsLocales = { en: enUS, es };

export const ProfileHeader = ({ profile, bins, isLoading }) => {
    const { t, i18n } = useTranslation();
    const { user } = useIdentity();
    const { isDark } = useTheme();
    const [copiedText, copy] = useCopyToClipboard();
    const locale = dateFnsLocales[i18n.language] ?? enUS;
    const deletionDate = profile?.isBot
        ? format(nextBotDeletion(), t('formats.date.short_time'), { locale })
        : null;

    if (isLoading) return <ProfileHeaderLoading />;
    if (!profile) return <ProfileNotFound t={t} />;

    const color = isDark ? profile.colorDark : profile.colorLight;
    const isMe = user?.uuid === profile.uuid;
    const totalViews = bins.reduce((sum, bin) => sum + (bin.views || 0), 0);

    return (
        <div
            className='relative flex flex-col shrink-0 items-center gap-6 overflow-hidden border-b border-border px-8 py-12'
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
                <UserAvatar
                    profileId={profile.uuid}
                    className='size-24 border-2 border-(--user-color) shadow-lg shadow-black/30'
                />
                {isMe && (
                    <span className='absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium text-muted-foreground'>
                        {t('profile.you')}
                    </span>
                )}
                {profile.isBot && !isMe && (
                    <span
                        className='absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 whitespace-nowrap rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive'
                        title={
                            deletionDate
                                ? t('profile.scheduled_deletion', { date: deletionDate })
                                : undefined
                        }
                    >
                        <Bot className='size-2.5' />
                        {t('profile.bot_badge')}
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
                <StatPill label={t('profile.stats.bins')} value={bins.length} />
                <div className='h-8 w-px bg-border' />
                <StatPill label={t('profile.stats.views')} value={totalViews.toLocaleString()} />
                <div className='h-8 w-px bg-border' />
                <ColorStat
                    colorDark={profile.colorDark}
                    colorLight={profile.colorLight}
                    label={t('profile.stats.color')}
                />
                <div className='h-8 w-px bg-border' />
                <TopLanguagesStat bins={bins} label={t('profile.stats.top_languages')} />
            </div>
        </div>
    );
};

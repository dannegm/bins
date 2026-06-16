import { useState, useMemo } from 'react';
import { Link as RouterLink } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useQueryState, parseAsStringLiteral } from 'nuqs';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import {
    Search,
    ExternalLink,
    Copy,
    Check,
    Trash2,
    Monitor,
    Tablet,
    Smartphone,
    Server,
    HelpCircle,
    Bot,
    User,
    ShieldCheck,
    ShieldAlert,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { supabase } from '@/services/supabase';
import { getAvatarUrl } from '@/helpers/avatar';
import { parseUA, nextBotDeletion } from '@/helpers/ua-parser';
import { useTheme } from '@/providers/theme-provider';
import { useIdentity } from '@/hooks/use-identity';
import { cn } from '@/helpers/utils';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/ui/table';
import {
    Popover,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
    PopoverTrigger,
} from '@/ui/popover';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/ui/tooltip';

const FLAG_URL = cc => `https://flagicons.lipis.dev/flags/1x1/${cc.toLowerCase()}.svg`;

const SORT_KEYS = ['created_at', 'name', 'country', 'bins'];
const FILTER_KEYS = ['all', 'human', 'bot'];

const useAdminUsers = () =>
    useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('profiles')
                .select('uuid, name, color_light, color_dark, country, city, user_agent, is_bot, created_at, bins(count)')
                .order('created_at', { ascending: false })
                .limit(500);
            if (error) throw error;
            return data ?? [];
        },
    });

const useToggleBot = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ uuid, is_bot }) => {
            const { error } = await supabase().from('profiles').update({ is_bot }).eq('uuid', uuid);
            if (error) throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    });
};

const dateFnsLocales = { en: enUS, es };

const TypeBadge = ({ isBot, t }) => (
    <span
        className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold',
            {
                'bg-destructive/10 text-destructive': isBot,
                'bg-success/10 text-success': !isBot,
            },
        )}
    >
        {isBot ? <Bot className='size-4 shrink-0' /> : <User className='size-4 shrink-0' />}
        {isBot ? t('admin.users.badge_bot') : t('admin.users.badge_human')}
    </span>
);

const BrowserCell = ({ ua, isBot, t }) => {
    const parsed = useMemo(() => parseUA(ua), [ua]);

    if (isBot) {
        const bot = parsed.bot;
        const iconEl = bot?.icon
            ? <i className={cn(bot.icon, 'text-base')} style={{ color: bot.color }} />
            : <Bot className='size-4' style={{ color: bot?.color ?? '#6B7280' }} />;

        return (
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger className='flex items-center gap-1.5 cursor-default'>
                        {iconEl}
                        <span className='text-xs text-muted-foreground'>
                            {bot?.name ?? t('admin.users.unknown_bot')}
                        </span>
                    </TooltipTrigger>
                    <TooltipContent>{ua ?? '—'}</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    if (!parsed.browser) return <span className='text-xs text-muted-foreground'>—</span>;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger className='flex items-center gap-1.5 cursor-default'>
                    <i
                        className={cn(parsed.browser.icon, 'text-base')}
                        style={{ color: parsed.browser.color }}
                    />
                    <span className='text-xs text-muted-foreground'>{parsed.browser.name}</span>
                </TooltipTrigger>
                <TooltipContent>{ua ?? '—'}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const OsCell = ({ ua, isBot, t }) => {
    if (isBot) return <span className='text-xs text-muted-foreground'>{t('admin.users.os_na')}</span>;
    const parsed = useMemo(() => parseUA(ua), [ua]);
    if (!parsed.os) return <span className='text-xs text-muted-foreground'>—</span>;
    return <span className='text-xs text-muted-foreground'>{parsed.os.name}</span>;
};

const DEVICE_ICONS = {
    desktop: Monitor,
    tablet: Tablet,
    mobile: Smartphone,
    bot: Server,
    unknown: HelpCircle,
};

const DEVICE_LABELS = {
    desktop: 'Desktop',
    tablet: 'Tablet',
    mobile: 'Mobile',
    bot: 'Server',
    unknown: '—',
};

const DeviceCell = ({ ua, isBot }) => {
    const parsed = useMemo(() => parseUA(ua), [ua]);
    const device = isBot ? 'bot' : (parsed.device ?? 'unknown');
    const Icon = DEVICE_ICONS[device] ?? HelpCircle;
    const label = DEVICE_LABELS[device] ?? '—';

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger className='cursor-default'>
                    <Icon className='size-4 text-muted-foreground' />
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};

const LocationCell = ({ country, city }) => {
    if (!country && !city) return <span className='text-xs text-muted-foreground'>—</span>;

    return (
        <div className='flex items-center gap-2'>
            {country && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className='cursor-default'>
                            <img
                                src={FLAG_URL(country)}
                                alt={country}
                                className='size-4 shrink-0 overflow-hidden rounded-full object-cover'
                            />
                        </TooltipTrigger>
                        <TooltipContent>{country}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}
            <span className='whitespace-nowrap text-xs text-muted-foreground'>
                {[city, country].filter(Boolean).join(', ')}
            </span>
        </div>
    );
};

const DeleteUserAction = ({ profile, t, formatDate }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const deletionDate = profile.is_bot ? formatDate(nextBotDeletion()) : null;

    const { mutate, isPending } = useMutation({
        mutationFn: async () => {
            const { error } = await supabase().from('profiles').delete().eq('uuid', profile.uuid);
            if (error) throw error;
        },
        onSuccess: () => {
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
        },
    });

    const trigger = (
        <PopoverTrigger
            className='flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive'
            title={deletionDate ? t('admin.users.scheduled_deletion', { date: deletionDate }) : t('admin.users.delete')}
        >
            <Trash2 className='size-3.5' />
        </PopoverTrigger>
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            {deletionDate ? (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                        <TooltipContent>
                            {t('admin.users.scheduled_deletion', { date: deletionDate })}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : trigger}
            <PopoverContent side='left' align='start' className='w-60'>
                <PopoverHeader>
                    <PopoverTitle>{t('admin.users.delete_title')}</PopoverTitle>
                    <PopoverDescription>{t('admin.users.delete_description')}</PopoverDescription>
                </PopoverHeader>
                <div className='flex gap-2 pt-1'>
                    <Button variant='outline' size='sm' className='flex-1' onClick={() => setOpen(false)}>
                        {t('bins.card.delete_cancel')}
                    </Button>
                    <Button
                        variant='destructive'
                        size='sm'
                        className='flex-1'
                        disabled={isPending}
                        onClick={() => mutate()}
                    >
                        {t('bins.card.delete_confirm')}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

const SortableHead = ({ column, label, sortBy, sortDir, onSort, className }) => {
    const isActive = sortBy === column;
    const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;

    return (
        <TableHead className={className}>
            <button
                onClick={() => onSort(column)}
                className={cn(
                    'flex items-center gap-1 cursor-pointer transition-colors hover:text-foreground',
                    { 'text-foreground': isActive, 'text-muted-foreground': !isActive },
                )}
            >
                {label}
                <Icon className='size-3' />
            </button>
        </TableHead>
    );
};

const UserRow = ({ profile, t, formatDate, isMe, onToggleBot, isTogglingBot }) => {
    const { isDark } = useTheme();
    const color = isDark ? profile.color_dark : profile.color_light;
    const seed = profile.name + profile.uuid;
    const binCount = parseInt(profile.bins?.[0]?.count ?? 0);
    const [copied, setCopied] = useState(false);

    const copyUuid = () => {
        navigator.clipboard.writeText(profile.uuid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <TableRow className={cn({ 'bg-muted/30 hover:bg-muted/40': profile.is_bot })}>
            <TableCell>
                <TypeBadge isBot={profile.is_bot} t={t} />
            </TableCell>

            <TableCell>
                <div className='flex items-center gap-3'>
                    <div
                        className='size-5 shrink-0 overflow-hidden rounded-full bg-(--user-color)'
                        style={{ '--user-color': color }}
                    >
                        <img src={getAvatarUrl(seed)} alt={profile.name} className='size-full' />
                    </div>
                    <span className='text-sm font-medium text-foreground'>
                        {profile.name || t('admin.users.anonymous')}
                    </span>
                    {isMe && (
                        <span className='rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand'>
                            {t('profile.you')}
                        </span>
                    )}
                </div>
            </TableCell>

            <TableCell>
                <button
                    onClick={copyUuid}
                    className='group/uuid flex cursor-pointer items-center gap-1.5 whitespace-nowrap font-mono text-xs text-muted-foreground transition-colors hover:text-foreground'
                    title={t('admin.users.copy_uuid')}
                >
                    {profile.uuid}
                    <span className='[&>svg]:size-3'>
                        {copied ? <Check className='text-success' /> : <Copy />}
                    </span>
                </button>
            </TableCell>

            <TableCell>
                <BrowserCell ua={profile.user_agent} isBot={profile.is_bot} t={t} />
            </TableCell>

            <TableCell>
                <OsCell ua={profile.user_agent} isBot={profile.is_bot} t={t} />
            </TableCell>

            <TableCell>
                <DeviceCell ua={profile.user_agent} isBot={profile.is_bot} />
            </TableCell>

            <TableCell>
                <LocationCell country={profile.country} city={profile.city} />
            </TableCell>

            <TableCell className='text-right'>
                <span className='tabular-nums text-sm text-foreground'>{binCount}</span>
            </TableCell>

            <TableCell>
                <span className='whitespace-nowrap text-xs text-muted-foreground'>
                    {profile.created_at ? formatDate(profile.created_at) : '—'}
                </span>
            </TableCell>

            <TableCell className='text-right'>
                <div className='flex items-center justify-end gap-0.5'>
                    <RouterLink to='/user/$uuid' params={{ uuid: profile.uuid }} target='_blank' rel='noopener noreferrer'>
                        <button
                            className='flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground'
                            title={t('admin.users.view_profile')}
                        >
                            <ExternalLink className='size-3.5' />
                        </button>
                    </RouterLink>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    className='flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground'
                                    disabled={isTogglingBot}
                                    onClick={() => onToggleBot(profile.uuid, !profile.is_bot)}
                                >
                                    {profile.is_bot
                                        ? <ShieldCheck className='size-3.5' />
                                        : <ShieldAlert className='size-3.5' />
                                    }
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {profile.is_bot ? t('admin.users.mark_as_human') : t('admin.users.mark_as_bot')}
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <DeleteUserAction profile={profile} t={t} formatDate={formatDate} />
                </div>
            </TableCell>
        </TableRow>
    );
};

const StatsBar = ({ users, t }) => {
    const totalBins = users.reduce((sum, u) => sum + parseInt(u.bins?.[0]?.count ?? 0), 0);
    const botCount = users.filter(u => u.is_bot).length;
    const humanCount = users.length - botCount;

    const item = (value, label) => (
        <div className='flex flex-col gap-0.5 rounded-xl border border-border bg-card p-4'>
            <span className='text-2xl font-semibold tabular-nums text-foreground'>
                {value.toLocaleString()}
            </span>
            <span className='text-xs text-muted-foreground'>{label}</span>
        </div>
    );

    return (
        <div className='mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4'>
            {item(users.length, t('admin.stats.total_users'))}
            {item(totalBins, t('admin.stats.total_bins'))}
            {item(humanCount, t('admin.stats.human_users'))}
            {item(botCount, t('admin.stats.bot_users'))}
        </div>
    );
};

const sortUsers = (users, sortBy, sortDir) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...users].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return dir * (a.name ?? '').localeCompare(b.name ?? '');
            case 'country':
                return dir * (a.country ?? '').localeCompare(b.country ?? '');
            case 'bins':
                return dir * (parseInt(a.bins?.[0]?.count ?? 0) - parseInt(b.bins?.[0]?.count ?? 0));
            default: // created_at
                return dir * (new Date(a.created_at) - new Date(b.created_at));
        }
    });
};

export const UsersTable = () => {
    const { t, i18n } = useTranslation();
    const { user } = useIdentity();
    const locale = dateFnsLocales[i18n.language] ?? enUS;
    const formatDate = iso => format(new Date(iso), t('formats.date.short_time'), { locale });

    const [search, setSearch] = useState('');
    const [filter, setFilter] = useQueryState('filter', parseAsStringLiteral(FILTER_KEYS).withDefault('all'));
    const [sortBy, setSortBy] = useQueryState('sort', parseAsStringLiteral(SORT_KEYS).withDefault('created_at'));
    const [sortDir, setSortDir] = useQueryState('dir', parseAsStringLiteral(['asc', 'desc']).withDefault('desc'));

    const { data: users = [], isLoading } = useAdminUsers();
    const { mutate: toggleBot, isPending: isTogglingBot } = useToggleBot();

    const handleSort = col => {
        if (col === sortBy) {
            setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(col);
            setSortDir('desc');
        }
    };

    const filtered = useMemo(() => {
        let result = users;

        if (filter === 'bot') result = result.filter(u => u.is_bot);
        else if (filter === 'human') result = result.filter(u => !u.is_bot);

        const q = search.toLowerCase().trim();
        if (q) result = result.filter(u => u.name?.toLowerCase().includes(q) || u.uuid.toLowerCase().includes(q));

        return sortUsers(result, sortBy, sortDir);
    }, [users, filter, search, sortBy, sortDir]);

    const colSpan = 10;

    return (
        <div>
            <StatsBar users={users} t={t} />

            <div className='mb-4 flex flex-wrap items-center gap-3'>
                <div className='relative max-w-sm flex-1'>
                    <Search className='pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('admin.users.search_placeholder')}
                        className='pl-8'
                    />
                </div>

                <div className='flex items-center gap-1 rounded-lg border border-border bg-surface p-1'>
                    {FILTER_KEYS.map(key => (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={cn(
                                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                                {
                                    'bg-brand text-white': filter === key,
                                    'text-muted-foreground hover:text-foreground': filter !== key,
                                },
                            )}
                        >
                            {t(`admin.users.filter_${key}`)}
                        </button>
                    ))}
                </div>

                <span className='whitespace-nowrap text-xs text-muted-foreground'>
                    {filtered.length} {t('admin.users.count_label')}
                </span>
            </div>

            <div className='overflow-hidden rounded-xl border border-border'>
                <Table>
                    <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                            <TableHead>{t('admin.users.col_type')}</TableHead>
                            <SortableHead column='name' label={t('admin.users.col_user')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                            <TableHead>{t('admin.users.col_id')}</TableHead>
                            <TableHead>{t('admin.users.col_browser')}</TableHead>
                            <TableHead>{t('admin.users.col_os')}</TableHead>
                            <TableHead>{t('admin.users.col_device')}</TableHead>
                            <SortableHead column='country' label={t('admin.users.col_location')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                            <SortableHead column='bins' label={t('admin.users.col_bins')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className='text-right' />
                            <SortableHead column='created_at' label={t('admin.users.col_registered')} sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                            <TableHead className='text-right'>{t('admin.users.col_actions')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell colSpan={colSpan} className='h-32 text-center text-muted-foreground'>
                                    {t('admin.loading')}
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && filtered.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={colSpan} className='h-32 text-center text-muted-foreground'>
                                    {t('admin.users.empty')}
                                </TableCell>
                            </TableRow>
                        )}
                        {filtered.map(u => (
                            <UserRow
                                key={u.uuid}
                                profile={u}
                                t={t}
                                formatDate={formatDate}
                                isMe={u.uuid === user?.uuid}
                                onToggleBot={(uuid, is_bot) => toggleBot({ uuid, is_bot })}
                                isTogglingBot={isTogglingBot}
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

import { useState, useMemo } from 'react';
import { Link as RouterLink } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { Search, ExternalLink, Copy, Check, Trash2 } from 'lucide-react';
import { supabase } from '@/services/supabase';
import { getAvatarUrl } from '@/helpers/avatar';
import { useTheme } from '@/providers/theme-provider';
import { useIdentity } from '@/hooks/use-identity';
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

const useAdminUsers = () =>
    useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('profiles')
                .select('uuid, name, color_light, color_dark, created_at, bins(count)')
                .order('created_at', { ascending: false })
                .limit(500);
            if (error) throw error;
            return data ?? [];
        },
    });

const DeleteUserAction = ({ profile, t }) => {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();

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

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
                className='flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-destructive'
                title={t('admin.users.delete')}
            >
                <Trash2 className='size-3.5' />
            </PopoverTrigger>
            <PopoverContent side='left' align='start' className='w-60'>
                <PopoverHeader>
                    <PopoverTitle>{t('admin.users.delete_title')}</PopoverTitle>
                    <PopoverDescription>{t('admin.users.delete_description')}</PopoverDescription>
                </PopoverHeader>
                <div className='flex gap-2 pt-1'>
                    <Button
                        variant='outline'
                        size='sm'
                        className='flex-1'
                        onClick={() => setOpen(false)}
                    >
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

const dateFnsLocales = { en: enUS, es };

const UserRow = ({ profile, t, formatDate, isMe }) => {
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
        <TableRow>
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
                <div className='flex items-center -space-x-2'>
                    <div
                        className='size-5 rounded-full border-2 border-background bg-(--dark-color)'
                        style={{ '--dark-color': profile.color_dark }}
                        title='Dark'
                    />
                    <div
                        className='size-5 rounded-full border-2 border-background bg-(--light-color)'
                        style={{ '--light-color': profile.color_light }}
                        title='Light'
                    />
                </div>
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
                    <RouterLink to='/user/$uuid' params={{ uuid: profile.uuid }}>
                        <button
                            className='flex size-6 cursor-pointer items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground'
                            title={t('admin.users.view_profile')}
                        >
                            <ExternalLink className='size-3.5' />
                        </button>
                    </RouterLink>
                    <DeleteUserAction profile={profile} t={t} />
                </div>
            </TableCell>
        </TableRow>
    );
};

const StatsBar = ({ users, t }) => {
    const totalBins = users.reduce((sum, u) => sum + parseInt(u.bins?.[0]?.count ?? 0), 0);

    const item = (value, label) => (
        <div className='flex flex-col gap-0.5 rounded-xl border border-border bg-card p-4'>
            <span className='text-2xl font-semibold tabular-nums text-foreground'>
                {value.toLocaleString()}
            </span>
            <span className='text-xs text-muted-foreground'>{label}</span>
        </div>
    );

    return (
        <div className='mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3'>
            {item(users.length, t('admin.stats.total_users'))}
            {item(totalBins, t('admin.stats.total_bins'))}
        </div>
    );
};

export const UsersTable = () => {
    const { t, i18n } = useTranslation();
    const { user } = useIdentity();
    const [search, setSearch] = useState('');
    const locale = dateFnsLocales[i18n.language] ?? enUS;
    const formatDate = iso => format(new Date(iso), t('formats.date.short_time'), { locale });
    const { data: users = [], isLoading } = useAdminUsers();

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return users;
        return users.filter(
            u => u.name?.toLowerCase().includes(q) || u.uuid.toLowerCase().includes(q),
        );
    }, [users, search]);

    return (
        <div>
            <StatsBar users={users} t={t} />

            <div className='mb-4 flex items-center gap-3'>
                <div className='relative max-w-sm flex-1'>
                    <Search className='pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground' />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder={t('admin.users.search_placeholder')}
                        className='pl-8'
                    />
                </div>
                <span className='whitespace-nowrap text-xs text-muted-foreground'>
                    {filtered.length} {t('admin.users.count_label')}
                </span>
            </div>

            <div className='overflow-hidden rounded-xl border border-border'>
                <Table>
                    <TableHeader>
                        <TableRow className='hover:bg-transparent'>
                            <TableHead>{t('admin.users.col_user')}</TableHead>
                            <TableHead>{t('admin.users.col_id')}</TableHead>
                            <TableHead>{t('admin.users.col_colors')}</TableHead>
                            <TableHead className='text-right'>
                                {t('admin.users.col_bins')}
                            </TableHead>
                            <TableHead>{t('admin.users.col_registered')}</TableHead>
                            <TableHead className='text-right'>
                                {t('admin.users.col_actions')}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className='h-32 text-center text-muted-foreground'
                                >
                                    {t('admin.loading')}
                                </TableCell>
                            </TableRow>
                        )}
                        {!isLoading && filtered.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className='h-32 text-center text-muted-foreground'
                                >
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
                            />
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

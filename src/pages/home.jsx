import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { Plus, Search, Copy, Check, Code2, GitFork, Globe, Sparkles } from 'lucide-react';
import { cn } from '@/helpers/utils';
import { supabase } from '@/services/supabase';
import { useIdentity } from '@/hooks/use-identity';
import { useTheme } from '@/providers/theme-provider';
import { getAvatarUrl } from '@/helpers/avatar';
import { Layout } from '@/components/layout/layout';
import { TipsCarousel } from '@/components/system/tips-carousel';
import { BinCard } from '@/components/bins/bin-card';

const useMyBins = uuid =>
    useQuery({
        queryKey: ['bins', uuid],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('bins')
                .select('*')
                .eq('author_id', uuid)
                .order('updated_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        enabled: !!uuid,
    });

const useSharedBins = uuid =>
    useQuery({
        queryKey: ['shared-bins', uuid],
        queryFn: async () => {
            const { data, error } = await supabase()
                .from('bin_collaborators')
                .select('bin:bins(*)')
                .eq('user_id', uuid)
                .neq('bins.author_id', uuid)
                .order('joined_at', { ascending: false });
            if (error) throw error;
            return data?.map(r => r.bin).filter(Boolean) ?? [];
        },
        enabled: !!uuid,
    });

const CopyUUID = ({ uuid, color }) => {
    const [copied, setCopied] = useState(false);

    const copy = () => {
        navigator.clipboard.writeText(uuid);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={copy}
            className='flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-white/10 hover:text-white/70'
        >
            <span className='size-2 shrink-0 rounded-full' style={{ backgroundColor: color }} />
            <span className='font-mono'>{uuid}</span>
            {copied ? <Check className='size-3' /> : <Copy className='size-3' />}
        </button>
    );
};

export const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useIdentity();
    const { isDark } = useTheme();
    const { data: myBins = [], isLoading: loadingMine } = useMyBins(user?.uuid);
    const { data: sharedBins = [] } = useSharedBins(user?.uuid);

    const createBin = () => {
        navigate({ to: '/editor/$binId', params: { binId: nanoid(8) }, replace: false });
    };

    return (
        <Layout>
            <div className='flex h-full flex-col'>
            <div className='flex flex-1 flex-col gap-8 overflow-y-auto p-8 pb-4'>
                {/* Header */}
                <div className='flex items-center justify-between gap-6'>
                    {user?.uuid && (
                        <div className='flex items-center gap-3'>
                            <img
                                src={getAvatarUrl(user.uuid)}
                                alt={user.name}
                                className='size-10 rounded-full'
                            />
                            <div className='flex flex-col'>
                                <span className='text-sm font-medium text-white/90'>
                                    {user.name}
                                </span>
                                <CopyUUID
                                    uuid={user.uuid}
                                    color={isDark ? user.colorDark : user.colorLight}
                                />
                            </div>
                        </div>
                    )}

                    <div className='flex flex-1 items-center gap-3'>
                        <div className='relative flex-1'>
                            <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500' />
                            <input
                                type='text'
                                placeholder='Search bins…'
                                className='w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white/90 placeholder:text-zinc-500 focus:border-white/20 focus:outline-none'
                            />
                        </div>

                        <button
                            onClick={createBin}
                            className='flex shrink-0 items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400'
                        >
                            <Plus className='size-4' />
                            New bin
                        </button>
                    </div>
                </div>

                {/* Tips */}
                <TipsCarousel />

                {/* Your bins */}
                <div className='flex flex-col gap-4'>
                    <h2 className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                        Your bins
                    </h2>

                    {loadingMine ? (
                        <div className='text-sm text-zinc-500'>Loading…</div>
                    ) : myBins.length === 0 ? (
                        <div className='flex flex-col items-center gap-6 rounded-xl border border-dashed border-white/10 py-16 text-center'>
                            <div className='flex items-end gap-2'>
                                {[Code2, GitFork, Globe, Sparkles].map((Icon, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'flex items-center justify-center rounded-xl bg-white/5 [&>svg]:size-5',
                                            i === 1 ? 'size-14 text-indigo-400' : 'size-10 text-zinc-600',
                                        )}
                                    >
                                        <Icon />
                                    </div>
                                ))}
                            </div>
                            <div className='flex flex-col gap-1'>
                                <span className='text-sm font-medium text-white/70'>No bins yet</span>
                                <span className='text-xs text-zinc-500'>Create your first bin and start coding</span>
                            </div>
                            <button
                                onClick={createBin}
                                className='flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400'
                            >
                                <Plus className='size-4' />
                                Create your first bin
                            </button>
                        </div>
                    ) : (
                        <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                            {myBins.map(bin => (
                                <BinCard key={bin.id} bin={bin} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Shared with you */}
                {sharedBins.length > 0 && (
                    <div className='flex flex-col gap-4'>
                        <h2 className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                            Shared with you
                        </h2>
                        <div className='grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4'>
                            {sharedBins.map(bin => (
                                <BinCard key={bin.id} bin={bin} />
                            ))}
                        </div>
                    </div>
                )}

            </div>
            <footer className='flex shrink-0 items-center justify-between border-t border-white/5 px-8 py-4 text-xs text-zinc-600'>
                <span>BINS. — real-time collaborative code editor</span>
                <span>
                    v0.1.0 ·{' '}
                    <a
                        href={`https://github.com/dannegm/bins/commit/${__COMMIT_HASH__}`}
                        target='_blank'
                        rel='noreferrer'
                        className='text-zinc-400 transition-colors hover:text-white/70'
                    >
                        {__COMMIT_HASH_SHORT__}
                    </a>
                </span>
            </footer>
            </div>
        </Layout>
    );
};

import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { Plus, Search, Copy, Check } from 'lucide-react';
import { cn } from '@/helpers/utils';
import { supabase } from '@/services/supabase';
import { useIdentity } from '@/hooks/use-identity';
import { getAvatarUrl } from '@/helpers/avatar';
import { TipsCarousel } from './tips-carousel';
import { BinCard } from './bin-card';

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

const CopyUUID = ({ uuid }) => {
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
            <span className='font-mono'>{uuid.slice(0, 8)}…</span>
            {copied ? <Check className='size-3' /> : <Copy className='size-3' />}
        </button>
    );
};

export const HomePage = () => {
    const navigate = useNavigate();
    const { user } = useIdentity();
    const { data: myBins = [], isLoading: loadingMine } = useMyBins(user?.uuid);
    const { data: sharedBins = [] } = useSharedBins(user?.uuid);

    const createBin = () => {
        navigate({ to: '/editor/$bin-id', params: { 'bin-id': nanoid(8) }, replace: false });
    };

    return (
        <div className='mx-auto flex min-h-screen max-w-2xl flex-col gap-10 px-4 py-12'>
            {/* Hero */}
            <div className='flex flex-col gap-6'>
                <div className='flex items-center justify-between gap-4'>
                    {user && (
                        <div className='flex items-center gap-3'>
                            <img
                                src={getAvatarUrl(user.uuid)}
                                alt={user.name}
                                className='size-10 rounded-full'
                            />
                            <div className='flex flex-col'>
                                <span className='text-sm font-medium text-white/90'>{user.name}</span>
                                <CopyUUID uuid={user.uuid} />
                            </div>
                        </div>
                    )}

                    <button
                        onClick={createBin}
                        className='flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-400'
                    >
                        <Plus className='size-4' />
                        New bin
                    </button>
                </div>

                <div className='relative'>
                    <Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500' />
                    <input
                        type='text'
                        placeholder='Search bins…'
                        className='w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-sm text-white/90 placeholder:text-zinc-500 focus:border-white/20 focus:outline-none'
                    />
                </div>

                <TipsCarousel />
            </div>

            {/* Your bins */}
            <div className='flex flex-col gap-4'>
                <h2 className='text-xs font-semibold uppercase tracking-widest text-zinc-500'>
                    Your bins
                </h2>

                {loadingMine ? (
                    <div className='text-sm text-zinc-500'>Loading…</div>
                ) : myBins.length === 0 ? (
                    <div className='flex flex-col items-center gap-4 rounded-xl border border-dashed border-white/10 py-12 text-center'>
                        <span className='text-sm text-zinc-500'>No bins yet.</span>
                        <button
                            onClick={createBin}
                            className={cn(
                                'flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2',
                                'text-sm text-white/70 transition-colors hover:border-white/20 hover:text-white/90',
                            )}
                        >
                            <Plus className='size-4' />
                            Create your first bin
                        </button>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
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
                    <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                        {sharedBins.map(bin => (
                            <BinCard key={bin.id} bin={bin} />
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className='mt-auto border-t border-white/5 pt-6 text-center text-xs text-zinc-600'>
                Bins — real-time collaborative code editor
            </footer>
        </div>
    );
};

import { Link } from '@tanstack/react-router';
import { Eye, Globe, Lock, GitFork } from 'lucide-react';
import { cn } from '@/helpers/utils';

const formatDate = iso =>
    new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export const BinCard = ({ bin }) => (
    <Link
        to='/editor/$binId'
        params={{ binId: bin.id }}
        className={cn(
            'group flex flex-col gap-3 rounded-xl border border-white/8 bg-white/4 p-4',
            'transition-all hover:border-white/15 hover:bg-white/8',
        )}
    >
        <div className='flex items-start justify-between gap-2'>
            <span className='truncate text-sm font-medium text-white/90'>
                {bin.title || 'Untitled'}
            </span>
            <span className='[&>svg]:size-3.5 shrink-0 text-zinc-600'>
                {bin.visibility === 'public' ? <Globe /> : <Lock />}
            </span>
        </div>

        <div className='flex items-center gap-3 text-xs text-zinc-500'>
            <span className='flex items-center gap-1 [&>svg]:size-3'>
                <Eye />
                {bin.views}
            </span>
            {bin.forked_from && (
                <span className='flex items-center gap-1 [&>svg]:size-3'>
                    <GitFork />
                    forked
                </span>
            )}
            <span className='ml-auto'>{formatDate(bin.updated_at)}</span>
        </div>
    </Link>
);

import { Link } from '@tanstack/react-router';
import { Eye, Globe, Lock, GitFork } from 'lucide-react';
import { cn } from '@/helpers/utils';

const formatDate = iso => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const BinCard = ({ bin }) => (
    <Link
        to='/editor/$bin-id'
        params={{ 'bin-id': bin.id }}
        className={cn(
            'group flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4',
            'transition-colors hover:border-white/20 hover:bg-white/10',
        )}
    >
        <div className='flex items-start justify-between gap-2'>
            <span className='truncate text-sm font-medium text-white/90'>
                {bin.title || 'Untitled'}
            </span>
            {bin.visibility === 'public' ? (
                <Globe className='size-3.5 shrink-0 text-zinc-500' />
            ) : (
                <Lock className='size-3.5 shrink-0 text-zinc-500' />
            )}
        </div>

        <div className='flex items-center gap-3 text-xs text-zinc-500'>
            <span className='flex items-center gap-1'>
                <Eye className='size-3' />
                {bin.views}
            </span>
            {bin.forked_from && (
                <span className='flex items-center gap-1'>
                    <GitFork className='size-3' />
                    forked
                </span>
            )}
            <span className='ml-auto'>{formatDate(bin.updated_at)}</span>
        </div>
    </Link>
);

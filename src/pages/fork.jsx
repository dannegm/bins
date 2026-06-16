import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, GitFork } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { forkBin } from '@/services/bins';
import { delay } from '@/helpers/utils';
import { supabase } from '@/services/supabase';
import { getAvatarUrl } from '@/helpers/avatar';
import { useIdentity } from '@/hooks/use-identity';
import { useTheme } from '@/providers/theme-provider';
import { Button } from '@/ui/button';
import { FlickeringGrid } from '@/ui/flickering-grid';

const UserAvatar = ({ user, isDark }) => {
    const color = isDark ? user?.colorDark : user?.colorLight;
    const seed = user ? user.name + user.uuid : null;
    return (
        <div
            className='size-full rounded-full overflow-hidden bg-(--user-color)'
            style={{ '--user-color': color }}
        >
            {seed && <img src={getAvatarUrl(seed)} alt={user.name} className='size-full' />}
        </div>
    );
};

const LoadingHint = ({ t }) => {
    const hints = t('fork.hints', { returnObjects: true });
    const safeHints = Array.isArray(hints) ? hints : ['Copying files…'];
    const [index, setIndex] = useState(() => Math.floor(Math.random() * safeHints.length));

    useEffect(() => {
        const id = setInterval(() => {
            setIndex(i => {
                let next;
                do { next = Math.floor(Math.random() * safeHints.length); } while (next === i);
                return next;
            });
        }, 2500);
        return () => clearInterval(id);
    }, [safeHints.length]);

    return (
        <AnimatePresence mode='wait' initial={false}>
            <motion.p
                key={index}
                className='text-center text-xs text-foreground/75'
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
                {safeHints[index]}
            </motion.p>
        </AnimatePresence>
    );
};

const LoadingState = ({ t, author }) => {
    const { user } = useIdentity();
    const { isDark } = useTheme();

    return (
        <div className='flex flex-col items-center gap-4'>
            <div className='relative flex w-[80vw] items-center justify-between sm:w-[33vw]'>
                {/* Track */}
                <div className='absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-foreground/15'>
                    <motion.div
                        className='absolute inset-y-0 w-1/3'
                        style={{ background: 'linear-gradient(to right, transparent, var(--brand), transparent)' }}
                        initial={{ left: '-33%' }}
                        animate={{ left: '100%' }}
                        transition={{
                            duration: 2,
                            ease: 'easeOut',
                            repeat: Infinity,
                        }}
                    />
                </div>
                {/* From node — original author */}
                <div className='relative z-10 flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-card p-0.5 shadow-lg shadow-black/20'>
                    {author
                        ? <UserAvatar user={author} isDark={isDark} />
                        : <GitFork className='size-7 text-muted-foreground' />
                    }
                </div>
                {/* To node — current user */}
                <div className='relative z-10 flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-brand/40 bg-card p-0.5 shadow-lg shadow-black/20'>
                    <UserAvatar user={user} isDark={isDark} />
                </div>
            </div>
            <div className='flex flex-col items-center gap-1.5 text-center'>
                <p className='text-sm font-medium text-foreground'>{t('fork.loading')}</p>
                <LoadingHint t={t} />
            </div>
        </div>
    );
};

const ErrorState = ({ error, onRetry, t }) => (
    <div className='flex w-full max-w-sm flex-col items-center gap-4 text-center'>
        <div className='flex size-12 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10'>
            <AlertCircle className='size-5 text-destructive' />
        </div>
        <div className='flex flex-col gap-1'>
            <p className='text-sm font-medium text-foreground'>{t('fork.error_title')}</p>
            <p className='text-xs text-muted-foreground'>{error}</p>
        </div>
        <div className='flex gap-2'>
            <Button variant='outline' render={<Link to='/' />} nativeButton={false}>
                {t('fork.close')}
            </Button>
            <Button onClick={onRetry}>
                <GitFork />
                {t('fork.retry')}
            </Button>
        </div>
    </div>
);

export const ForkPage = () => {
    const { t } = useTranslation();
    const { binId } = useParams({ strict: false });
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [author, setAuthor] = useState(null);

    useEffect(() => {
        supabase()
            .from('bins')
            .select('profiles(uuid, name, color_light, color_dark)')
            .eq('id', binId)
            .maybeSingle()
            .then(({ data }) => {
                const p = data?.profiles;
                if (p) setAuthor({ uuid: p.uuid, name: p.name, colorDark: p.color_dark, colorLight: p.color_light });
            });
    }, [binId]);

    const run = () => {
        setError(null);
        Promise.all([forkBin(binId), delay(1500)])
            .then(([newId]) => navigate({ to: '/editor/$binId', params: { binId: newId } }))
            .catch(err => setError(err?.message ?? t('fork.error_unknown')));
    };

    useEffect(() => { run(); }, [binId]);

    return (
        <div className='relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 overflow-hidden'>
            <FlickeringGrid className='absolute inset-0 z-0' />
            <div className='relative z-10 flex w-full justify-center'>
                {error ? <ErrorState error={error} onRetry={run} t={t} /> : <LoadingState t={t} author={author} />}
            </div>
        </div>
    );
};

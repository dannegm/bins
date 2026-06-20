import { useEffect, useState } from 'react';
import { useNavigate, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Check, Monitor } from 'lucide-react';
import { motion } from 'motion/react';
import { verifyJWT } from '@/helpers/jwt';
import { settings } from '@/services/settings';
import { delay } from '@/helpers/utils';
import { getAvatarUrl } from '@/helpers/avatar';
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

const Track = ({ success }) => (
    <div className='absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 overflow-hidden rounded-full bg-foreground/15'>
        {success ? (
            <div className='absolute inset-0 bg-brand' />
        ) : (
            <motion.div
                className='absolute inset-y-0 w-1/3'
                style={{
                    background: 'linear-gradient(to right, transparent, var(--brand), transparent)',
                }}
                initial={{ left: '-33%' }}
                animate={{ left: '100%' }}
                transition={{ duration: 2, ease: 'easeOut', repeat: Infinity }}
            />
        )}
    </div>
);

const LoadingState = ({ importedUser, success, t }) => {
    const { isDark } = useTheme();

    return (
        <div className='flex flex-col items-center gap-4'>
            <div className='relative flex w-[80vw] items-center justify-between sm:w-[33vw]'>
                <Track success={success} />
                {/* Source — other device */}
                <div className='relative z-10 flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-card p-0.5 shadow-lg shadow-black/20'>
                    {importedUser ? (
                        <UserAvatar user={importedUser} isDark={isDark} />
                    ) : (
                        <Monitor className='size-7 text-muted-foreground' />
                    )}
                </div>
                {/* Destination — this device */}
                <div className='relative z-10 flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-brand/40 bg-card p-0.5 shadow-lg shadow-black/20'>
                    {importedUser ? (
                        <UserAvatar user={importedUser} isDark={isDark} />
                    ) : (
                        <Monitor className='size-7 text-muted-foreground' />
                    )}
                </div>
            </div>
            <div className='flex flex-col items-center gap-1 text-center'>
                {success ? (
                    <>
                        <div className='flex size-6 items-center justify-center rounded-full bg-success/15'>
                            <Check className='size-3.5 text-success' />
                        </div>
                        <p className='text-sm font-medium text-foreground'>{t('login.success')}</p>
                        <p className='text-xs text-muted-foreground'>{t('login.success_redirect')}</p>
                    </>
                ) : (
                    <p className='text-sm font-medium text-foreground'>{t('login.loading')}</p>
                )}
            </div>
        </div>
    );
};

const ErrorState = ({ errorKey, t }) => (
    <div className='flex w-full max-w-sm flex-col items-center gap-4 text-center'>
        <div className='flex size-12 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10'>
            <AlertCircle className='size-5 text-destructive' />
        </div>
        <div className='flex flex-col gap-1'>
            <p className='text-sm font-medium text-foreground'>{t('login.error_title')}</p>
            <p className='text-xs text-muted-foreground'>{t(`login.error_${errorKey}`)}</p>
        </div>
        <Button variant='outline' render={<Link to='/' />} nativeButton={false}>
            {t('login.go_home')}
        </Button>
    </div>
);

export const LoginPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [errorKey, setErrorKey] = useState('invalid');
    const [importedUser, setImportedUser] = useState(null);

    useEffect(() => {
        const run = async () => {
            const token = new URLSearchParams(window.location.search).get('token');
            if (!token) {
                setStatus('error');
                setErrorKey('invalid');
                return;
            }

            try {
                const payload = await verifyJWT(token);
                setImportedUser(payload.user);
                await delay(1500);
                settings.set('user', payload.user);
                setStatus('success');
                setTimeout(() => navigate({ to: '/' }), 2000);
            } catch (err) {
                setStatus('error');
                setErrorKey(err?.code === 'ERR_JWT_EXPIRED' ? 'expired' : 'invalid');
            }
        };
        run();
    }, []);

    return (
        <div className='relative flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8 overflow-hidden'>
            <FlickeringGrid className='absolute inset-0 z-0' />
            <div className='relative z-10 flex w-full justify-center'>
                {status === 'error' ? (
                    <ErrorState errorKey={errorKey} t={t} />
                ) : (
                    <LoadingState importedUser={importedUser} success={status === 'success'} t={t} />
                )}
            </div>
        </div>
    );
};

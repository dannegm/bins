import { useTranslation } from 'react-i18next';
import { UserX } from 'lucide-react';
import { clearForgotten } from '@/providers/forgotten-provider';
import { Button } from '@/ui/button';

export const ForgottenPage = () => {
    const { t } = useTranslation();

    const handleRestore = () => {
        clearForgotten();
        window.location.assign('/');
    };

    return (
        <div className='flex h-screen flex-col items-center justify-center gap-6 bg-background p-8 text-center'>
            <div className='flex flex-col items-center gap-5'>
                <div className='flex size-20 items-center justify-center rounded-3xl bg-foreground/5'>
                    <UserX className='size-10 text-muted-foreground' strokeWidth={1} />
                </div>
                <div className='flex flex-col gap-2'>
                    <h1 className='text-xl font-semibold text-foreground'>
                        {t('forgotten.title')}
                    </h1>
                    <p className='max-w-xs text-sm text-muted-foreground'>
                        {t('forgotten.description')}
                    </p>
                </div>
            </div>
            <Button onClick={handleRestore}>{t('forgotten.cta')}</Button>
        </div>
    );
};

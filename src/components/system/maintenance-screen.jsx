import { useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Wrench } from 'lucide-react';
import { NoiseOverlay } from '@/ui/noise-overlay';

export const MaintenanceScreen = () => {
    const { t } = useTranslation();

    return (
        <div className='relative flex h-screen w-screen flex-col items-center justify-center gap-4 bg-background'>
            <NoiseOverlay />
            <div className='flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand [&>svg]:size-6'>
                <Wrench />
            </div>
            <div className='flex flex-col items-center gap-1.5 text-center'>
                <p className='text-xl font-semibold text-foreground'>{t('maintenance.title')}</p>
                <p className='text-xl text-muted-foreground'>{t('maintenance.description')}</p>
            </div>
        </div>
    );
};

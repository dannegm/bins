import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Link2 } from 'lucide-react';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { settings } from '@/services/settings';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const serializeSettings = () => {
    const all = settings.getAll();
    const { user, ...rest } = all;
    return encodeURIComponent(JSON.stringify(rest));
};

const buildSettingsUrl = () => `${window.location.origin}/settings?config=${serializeSettings()}`;

const applyConfigFromUrl = rawUrl => {
    try {
        const url = new URL(rawUrl);
        const config = url.searchParams.get('config');
        if (!config) return false;
        const parsed = JSON.parse(decodeURIComponent(config));
        const current = settings.getAll();
        settings.setAll({ ...current, ...parsed });
        return true;
    } catch {
        return false;
    }
};

const ShareSettingsCard = ({ t }) => {
    const [copiedText, copy] = useCopyToClipboard();
    const url = buildSettingsUrl();
    const copied = copiedText === url;

    return (
        <div className='flex flex-col gap-3 rounded-xl border border-border bg-card p-4'>
            <div>
                <p className='text-sm font-medium text-foreground'>{t('settings.import_export.share_settings_label')}</p>
                <p className='mt-0.5 text-xs text-muted-foreground'>{t('settings.import_export.share_settings_description')}</p>
            </div>
            <Button variant='outline' size='sm' onClick={() => copy(url)} className='self-start gap-2'>
                {copied ? <Check className='size-3.5' /> : <Link2 className='size-3.5' />}
                {copied ? t('settings.import_export.copied') : t('settings.import_export.share_settings_button')}
            </Button>
        </div>
    );
};

const ApplySettingsCard = ({ t }) => {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState(null);

    const apply = () => {
        const ok = applyConfigFromUrl(url.trim());
        setStatus(ok ? 'success' : 'error');
        if (ok) setUrl('');
        setTimeout(() => setStatus(null), 3000);
    };

    return (
        <div className='flex flex-col gap-3 rounded-xl border border-border bg-card p-4'>
            <div>
                <p className='text-sm font-medium text-foreground'>{t('settings.import_export.apply_settings_label')}</p>
                <p className='mt-0.5 text-xs text-muted-foreground'>{t('settings.import_export.apply_settings_description')}</p>
            </div>
            <div className='flex gap-2'>
                <Input
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder={t('settings.import_export.apply_settings_placeholder')}
                    className='flex-1'
                />
                <Button variant='outline' size='sm' onClick={apply} disabled={!url.trim()}>
                    {t('settings.import_export.apply_settings_button')}
                </Button>
            </div>
            {status === 'success' && (
                <p className='text-xs text-success'>{t('settings.import_export.apply_success')}</p>
            )}
            {status === 'error' && (
                <p className='text-xs text-destructive'>{t('settings.import_export.apply_error')}</p>
            )}
        </div>
    );
};

export const ImportExportSection = () => {
    const { t } = useTranslation();

    return (
        <section id='settings-import-export'>
            <SectionHeading title={t('settings.import_export.title')} />
            <div className='flex flex-col gap-3'>
                <ShareSettingsCard t={t} />
                <ApplySettingsCard t={t} />
                <div className='flex flex-col gap-3 rounded-xl border border-border bg-card p-4 opacity-60'>
                    <div>
                        <p className='text-sm font-medium text-foreground'>{t('settings.import_export.export_session_label')}</p>
                        <p className='mt-0.5 text-xs text-muted-foreground'>{t('settings.import_export.export_session_description')}</p>
                    </div>
                    <Button variant='outline' size='sm' disabled className='self-start'>
                        {t('settings.import_export.export_session_button')}
                    </Button>
                    <p className='text-xs text-muted-foreground'>{t('settings.import_export.export_session_requires')}</p>
                </div>
            </div>
        </section>
    );
};

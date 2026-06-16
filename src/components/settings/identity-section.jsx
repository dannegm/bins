import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Info } from 'lucide-react';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useDebouncedCallback } from '@/hooks/use-debounce-callback';
import { useDebouncedEffect } from '@/hooks/use-debounced-effect';
import { useIdentity } from '@/hooks/use-identity';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { ColorPicker } from '@/ui/color-picker';
import { UserAvatar } from '@/components/system/user-avatar';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const InfoCallout = ({ children }) => (
    <div className='flex gap-2.5 px-1 py-3 text-xs text-muted-foreground'>
        <Info className='mt-px size-3.5 shrink-0' />
        <p className='text-pretty leading-relaxed'>{children}</p>
    </div>
);

const UUIDCopy = ({ uuid }) => {
    const [copiedText, copy] = useCopyToClipboard();
    return (
        <Button
            variant='ghost'
            size='sm'
            onClick={() => copy(uuid)}
            className='h-auto gap-1.5 px-2 py-1 font-mono text-xs text-muted-foreground'
        >
            <span className='max-w-44 truncate'>{uuid}</span>
            {copiedText === uuid ? (
                <Check className='size-3 shrink-0' />
            ) : (
                <Copy className='size-3 shrink-0' />
            )}
        </Button>
    );
};

export const IdentitySection = () => {
    const { t } = useTranslation();
    const { user, update } = useIdentity();
    const [name, setName] = useState(user?.name ?? '');

    const commitName = useDebouncedCallback(value => {
        const trimmed = value.trim();
        if (trimmed && trimmed !== user?.name) update({ name: trimmed });
    }, 600);

    const [colorLight, setColorLight] = useState(user?.colorLight || '#6366f1');
    const [colorDark, setColorDark] = useState(user?.colorDark || '#6366f1');

    useDebouncedEffect(() => update({ colorLight }), [colorLight], 400);
    useDebouncedEffect(() => update({ colorDark }), [colorDark], 400);

    return (
        <section id='settings-identity'>
            <SectionHeading
                title={t('settings.identity.title')}
                description={t('settings.identity.description')}
            />
            <SettingGroup>
                <SettingRow label={t('settings.identity.name_label')}>
                    <div className='flex items-center gap-2'>
                        {user?.uuid && <UserAvatar className='size-7 shrink-0' />}
                        <Input
                            value={name}
                            onChange={e => {
                                setName(e.target.value);
                                commitName(e.target.value);
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    commitName.cancel();
                                    const trimmed = e.target.value.trim();
                                    if (trimmed && trimmed !== user?.name)
                                        update({ name: trimmed });
                                }
                            }}
                            placeholder={t('settings.identity.name_placeholder')}
                            className='w-40'
                        />
                    </div>
                </SettingRow>
                <InfoCallout>{t('settings.identity.name_callout')}</InfoCallout>
                <SettingRow
                    label={t('settings.identity.color_label')}
                    description={t('settings.identity.color_hint')}
                >
                    <div className='flex items-center gap-4'>
                        <div className='flex flex-col items-center gap-1.5'>
                            <ColorPicker value={colorLight} onChange={setColorLight}>
                                <button
                                    type='button'
                                    className='h-8 w-16 rounded-md border border-border bg-(--swatch-color) transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
                                    style={{ '--swatch-color': colorLight }}
                                    aria-label={t('settings.identity.color_light')}
                                >
                                    <span className='text-xs text-foreground mix-blend-difference'>
                                        {t('settings.identity.color_light')}
                                    </span>
                                </button>
                            </ColorPicker>
                        </div>

                        <div className='flex flex-col items-center gap-1.5'>
                            <ColorPicker value={colorDark} onChange={setColorDark}>
                                <button
                                    type='button'
                                    className='h-8 w-16 rounded-md border border-border bg-(--swatch-color) transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
                                    style={{ '--swatch-color': colorDark }}
                                    aria-label={t('settings.identity.color_dark')}
                                >
                                    <span className='text-xs text-foreground mix-blend-difference'>
                                        {t('settings.identity.color_dark')}
                                    </span>
                                </button>
                            </ColorPicker>
                        </div>
                    </div>
                </SettingRow>
                <InfoCallout>{t('settings.identity.color_callout')}</InfoCallout>
                <SettingRow
                    label={t('settings.identity.uuid_label')}
                    description={t('settings.identity.uuid_hint')}
                >
                    <UUIDCopy uuid={user?.uuid} />
                </SettingRow>
            </SettingGroup>
        </section>
    );
};

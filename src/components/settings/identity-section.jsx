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

const contrastColor = hex => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? '#000' : '#fff';
};

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
    const [saved, setSaved] = useState(false);

    const handleSave = async value => {
        const trimmed = value.trim();
        if (!trimmed || trimmed === user?.name) return;
        await update({ name: trimmed });
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const commitName = useDebouncedCallback(handleSave, 600);

    const [colorLight, setColorLight] = useState(user?.colorLight || '#6366f1');
    const [colorDark, setColorDark] = useState(user?.colorDark || '#6366f1');
    const [savedColorLight, setSavedColorLight] = useState(false);
    const [savedColorDark, setSavedColorDark] = useState(false);

    const showSaved = setter => {
        setter(true);
        setTimeout(() => setter(false), 2000);
    };

    useDebouncedEffect(() => { update({ colorLight }); showSaved(setSavedColorLight); }, [colorLight], 400);
    useDebouncedEffect(() => { update({ colorDark }); showSaved(setSavedColorDark); }, [colorDark], 400);

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
                        <div className='relative'>
                            <Input
                                value={name}
                                onChange={e => {
                                    setName(e.target.value);
                                    commitName(e.target.value);
                                }}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        commitName.cancel();
                                        handleSave(e.target.value);
                                    }
                                }}
                                placeholder={t('settings.identity.name_placeholder')}
                                className='w-40'
                            />
                            {saved && (
                                <span className='absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-success'>
                                    <Check className='size-2.5 text-white' />
                                </span>
                            )}
                        </div>
                    </div>
                </SettingRow>
                <InfoCallout>{t('settings.identity.name_callout')}</InfoCallout>
                <SettingRow
                    label={t('settings.identity.color_label')}
                    description={t('settings.identity.color_hint')}
                >
                    <div className='flex items-center gap-4'>
                        <div className='flex flex-col items-center gap-1.5'>
                            <div className='relative'>
                                <ColorPicker value={colorLight} onChange={setColorLight}>
                                    <button
                                        type='button'
                                        className='h-8 w-16 rounded-md border border-border bg-(--swatch-color) transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
                                        style={{ '--swatch-color': colorLight }}
                                        aria-label={t('settings.identity.color_light')}
                                    >
                                        <span className='text-xs text-(--contrast)' style={{ '--contrast': contrastColor(colorLight) }}>
                                            {t('settings.identity.color_light')}
                                        </span>
                                    </button>
                                </ColorPicker>
                                {savedColorLight && (
                                    <span className='absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-success'>
                                        <Check className='size-2.5 text-white' />
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className='flex flex-col items-center gap-1.5'>
                            <div className='relative'>
                                <ColorPicker value={colorDark} onChange={setColorDark}>
                                    <button
                                        type='button'
                                        className='h-8 w-16 rounded-md border border-border bg-(--swatch-color) transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
                                        style={{ '--swatch-color': colorDark }}
                                        aria-label={t('settings.identity.color_dark')}
                                    >
                                        <span className='text-xs text-(--contrast)' style={{ '--contrast': contrastColor(colorDark) }}>
                                            {t('settings.identity.color_dark')}
                                        </span>
                                    </button>
                                </ColorPicker>
                                {savedColorDark && (
                                    <span className='absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-success'>
                                        <Check className='size-2.5 text-white' />
                                    </span>
                                )}
                            </div>
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

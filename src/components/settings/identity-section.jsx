import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Copy } from 'lucide-react';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { useIdentity } from '@/hooks/use-identity';
import { getAvatarUrl } from '@/helpers/avatar';
import { Input } from '@/ui/input';
import { Button } from '@/ui/button';
import { SectionHeading, SettingGroup, SettingRow } from './settings-ui';

const ColorSwatch = ({ value, onChange, label }) => {
    const $input = useRef(null);
    return (
        <div className='flex flex-col items-center gap-1.5'>
            <button
                type='button'
                onClick={() => $input.current?.click()}
                className='size-8 rounded-md border-2 border-border bg-(--swatch-color) transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
                style={{ '--swatch-color': value || '#6366f1' }}
                aria-label={label}
            />
            <input
                ref={$input}
                type='color'
                value={value || '#6366f1'}
                onChange={e => onChange(e.target.value)}
                className='sr-only'
                aria-label={label}
            />
            <span className='text-xs text-muted-foreground'>{label}</span>
        </div>
    );
};

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

    const commitName = () => {
        const trimmed = name.trim();
        if (trimmed && trimmed !== user?.name) update({ name: trimmed });
    };

    return (
        <section id='settings-identity'>
            <SectionHeading
                title={t('settings.identity.title')}
                description={t('settings.identity.description')}
            />
            <SettingGroup>
                <SettingRow label={t('settings.identity.name_label')}>
                    <div className='flex items-center gap-2'>
                        {user?.uuid && (
                            <img
                                src={getAvatarUrl(user.uuid)}
                                alt={user.name}
                                className='size-7 shrink-0 rounded-full'
                            />
                        )}
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={e => e.key === 'Enter' && commitName()}
                            placeholder={t('settings.identity.name_placeholder')}
                            className='w-40'
                        />
                    </div>
                </SettingRow>
                <SettingRow
                    label={t('settings.identity.color_label')}
                    description={t('settings.identity.color_hint')}
                >
                    <div className='flex items-center gap-4'>
                        <ColorSwatch
                            value={user?.colorLight}
                            onChange={v => update({ colorLight: v })}
                            label={t('settings.identity.color_light')}
                        />
                        <ColorSwatch
                            value={user?.colorDark}
                            onChange={v => update({ colorDark: v })}
                            label={t('settings.identity.color_dark')}
                        />
                    </div>
                </SettingRow>
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

import { useRef, useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { RotateCcw, UserX, X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { Layout } from '@/components/layout/layout';
import { SettingsNav } from '@/components/settings/settings-nav';
import { IdentitySection } from '@/components/settings/identity-section';
import { AppearanceSection } from '@/components/settings/appearance-section';
import { EditorSection } from '@/components/settings/editor-section';
import { KeybindingsSection } from '@/components/settings/keybindings-section';
import { PrettierSection } from '@/components/settings/prettier-section';
import { AiCompletionsSection } from '@/components/settings/ai-completions-section';
import { ImportExportSection } from '@/components/settings/import-export-section';
import { SectionHeading } from '@/components/settings/settings-ui';
import { defaultSettings } from '@/constants/default-settings';
import { settings } from '@/services/settings';
import { deleteProfile } from '@/services/profiles';
import { markAsForgotten } from '@/providers/forgotten-provider';
import { useIdentity } from '@/hooks/use-identity';
import { Button } from '@/ui/button';
import { Input } from '@/ui/input';

const ForgetMeModal = ({ t }) => {
    const [open, setOpen] = useState(false);
    const [phrase, setPhrase] = useState('');
    const [isPending, setIsPending] = useState(false);
    const { user } = useIdentity();

    const confirmPhrase = t('settings.forget.confirm_phrase');
    const isValid = phrase.trim().toLowerCase() === confirmPhrase.toLowerCase();

    const handleOpenChange = val => {
        setOpen(val);
        if (!val) setPhrase('');
    };

    const handleForget = async () => {
        if (!isValid || isPending) return;
        setIsPending(true);
        try {
            if (user?.uuid) await deleteProfile(user.uuid);
        } catch {
            // non-critical — proceed even if DB delete fails
        }
        localStorage.clear();
        markAsForgotten();
        window.location.assign('/');
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleOpenChange}>
            <Dialog.Trigger render={<Button variant='destructive' size='sm' />}>
                <UserX />
                {t('settings.forget.button')}
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0' />
                <Dialog.Popup className='fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-0 shadow-xl shadow-black/30 transition-all duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0'>
                    <div className='flex items-start justify-between border-b border-border px-5 py-4'>
                        <Dialog.Title className='text-sm font-semibold text-foreground'>
                            {t('settings.forget.modal_title')}
                        </Dialog.Title>
                        <Dialog.Close
                            render={<Button variant='ghost' size='icon-xs' className='shrink-0' />}
                        >
                            <X />
                        </Dialog.Close>
                    </div>
                    <div className='flex flex-col gap-4 px-5 py-4'>
                        <Dialog.Description className='text-sm text-muted-foreground'>
                            <Trans
                                i18nKey='settings.forget.modal_description'
                                components={{
                                    phrase: <code className='rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-foreground' />,
                                }}
                            />
                        </Dialog.Description>
                        <Input
                            value={phrase}
                            onChange={e => setPhrase(e.target.value)}
                            placeholder={t('settings.forget.confirm_placeholder')}
                            onKeyDown={e => e.key === 'Enter' && isValid && handleForget()}
                        />
                    </div>
                    <div className='flex items-center justify-end gap-2 border-t border-border px-5 py-3'>
                        <Dialog.Close render={<Button variant='ghost' size='sm' />}>
                            {t('settings.forget.cancel')}
                        </Dialog.Close>
                        <Button
                            variant='destructive'
                            size='sm'
                            disabled={!isValid || isPending}
                            onClick={handleForget}
                        >
                            {t('settings.forget.confirm')}
                        </Button>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

const ResetConfirmModal = ({ t }) => {
    const [open, setOpen] = useState(false);

    const handleReset = () => {
        const currentUser = settings.get('user');
        settings.setAll({ ...defaultSettings, user: currentUser });
        setOpen(false);
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger render={<Button variant='destructive' size='sm' />}>
                <RotateCcw />
                {t('settings.reset.button')}
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Backdrop className='fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0' />
                <Dialog.Popup className='fixed left-1/2 top-1/2 z-50 w-full max-w-xs -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-popover p-0 shadow-xl shadow-black/30 transition-all duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0'>
                    <div className='flex items-start justify-between border-b border-border px-5 py-4'>
                        <Dialog.Title className='text-sm font-semibold text-foreground'>
                            {t('settings.reset.modal_title')}
                        </Dialog.Title>
                        <Dialog.Close
                            render={<Button variant='ghost' size='icon-xs' className='shrink-0' />}
                        >
                            <X />
                        </Dialog.Close>
                    </div>
                    <div className='px-5 py-4'>
                        <Dialog.Description className='text-sm text-muted-foreground'>
                            {t('settings.reset.modal_description')}
                        </Dialog.Description>
                    </div>
                    <div className='flex items-center justify-end gap-2 border-t border-border px-5 py-3'>
                        <Dialog.Close render={<Button variant='ghost' size='sm' />}>
                            {t('settings.reset.cancel')}
                        </Dialog.Close>
                        <Button variant='destructive' size='sm' onClick={handleReset}>
                            {t('settings.reset.confirm')}
                        </Button>
                    </div>
                </Dialog.Popup>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export const SettingsPage = () => {
    const { t } = useTranslation();
    const $scrollContainer = useRef(null);

    return (
        <Layout>
            <div className='flex h-dvh flex-col'>
                <header className='shrink-0 border-b border-border px-6 py-4 sm:px-8'>
                    <h1 className='text-sm font-semibold text-foreground'>{t('settings.title')}</h1>
                </header>
                <div className='flex flex-1 overflow-hidden'>
                    <SettingsNav scrollContainerRef={$scrollContainer} />
                    <div ref={$scrollContainer} className='flex-1 overflow-y-auto'>
                        <div className='mx-auto max-w-xl px-6 py-10 sm:px-8'>
                            <div className='flex flex-col gap-14'>
                                <IdentitySection />
                                <AppearanceSection />
                                <EditorSection />
                                <KeybindingsSection />
                                <PrettierSection />
                                <AiCompletionsSection />
                                <ImportExportSection />

                                <section id='settings-danger-zone'>
                                    <SectionHeading title={t('settings.danger_zone.title')} />
                                    <div className='flex flex-col gap-4'>
                                        <div className='flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5'>
                                            <div>
                                                <p className='text-sm font-medium text-foreground'>
                                                    {t('settings.reset.title')}
                                                </p>
                                                <p className='mt-0.5 text-xs text-muted-foreground'>
                                                    {t('settings.reset.description')}
                                                </p>
                                            </div>
                                            <ResetConfirmModal t={t} />
                                        </div>
                                        <div className='flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5'>
                                            <div>
                                                <p className='text-sm font-medium text-foreground'>
                                                    {t('settings.forget.title')}
                                                </p>
                                                <p className='mt-0.5 text-xs text-muted-foreground'>
                                                    {t('settings.forget.description')}
                                                </p>
                                            </div>
                                            <ForgetMeModal t={t} />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

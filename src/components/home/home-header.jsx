import { Link } from '@tanstack/react-router';
import { useCopyToClipboard } from '@uidotdev/usehooks';
import { Plus, Search, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/helpers/utils';
import { useIdentity } from '@/hooks/use-identity';
import { useTheme } from '@/providers/theme-provider';
import { Button } from '@/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/input-group';
import { UserAvatar } from '@/components/system/user-avatar';

const CopyUUID = ({ uuid, color, className }) => {
    const [copiedText, copy] = useCopyToClipboard();

    return (
        <Button
            onClick={() => copy(uuid)}
            variant='ghost'
            size='sm'
            className={cn(
                'h-auto max-w-full gap-1.5 px-2 py-1 border border-border/50 text-xs text-muted-foreground',
                className,
            )}
        >
            <span
                className='size-2 shrink-0 rounded-full bg-(--user-color)'
                style={{ '--user-color': color }}
            />
            <span className='truncate font-mono'>{uuid}</span>
            {copiedText === uuid ? (
                <Check className='size-3 shrink-0' />
            ) : (
                <Copy className='size-3 shrink-0' />
            )}
        </Button>
    );
};

export const HomeHeader = () => {
    const { t } = useTranslation();
    const { user } = useIdentity();
    const { isDark } = useTheme();

    return (
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6'>
            <div className='flex items-center gap-3 sm:flex-1'>
                <InputGroup className='flex-1'>
                    <InputGroupAddon align='inline-start'>
                        <Search />
                    </InputGroupAddon>
                    <InputGroupInput placeholder={t('home.header.search_placeholder')} />
                </InputGroup>

                <Button render={<Link to='/new' />} nativeButton={false} className='shrink-0'>
                    <Plus data-icon='inline-start' />
                    {t('home.header.new_bin')}
                </Button>
            </div>

            {user?.uuid && (
                <div className='flex min-w-0 items-center gap-3 rounded-xl border border-border bg-card p-3 sm:order-first sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0'>
                    <UserAvatar />
                    <div className='flex min-w-0 flex-col'>
                        <span className='text-sm font-medium text-foreground'>{user.name}</span>
                        <CopyUUID
                            className='-ml-1'
                            uuid={user.uuid}
                            color={isDark ? user.colorDark : user.colorLight}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

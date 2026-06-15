import { cn } from '@/helpers/utils';
import { getAvatarUrl } from '@/helpers/avatar';
import { useIdentity } from '@/hooks/use-identity';
import { useTheme } from '@/providers/theme-provider';

export const UserAvatar = ({ className }) => {
    const { user } = useIdentity();
    const { isDark } = useTheme();

    return (
        <div
            className={cn('size-10 bg-(--user-color) rounded-full overflow-hidden', className)}
            style={{ '--user-color': isDark ? user?.colorDark : user?.colorLight }}
        >
            <img src={getAvatarUrl(user.uuid)} alt='User Avatar' className={cn('size-full')} />
        </div>
    );
};

import { useQuery } from '@tanstack/react-query';
import { cn } from '@/helpers/utils';
import { getAvatarUrl } from '@/helpers/avatar';
import { getProfile } from '@/services/profiles';
import { useIdentity } from '@/hooks/use-identity';
import { useTheme } from '@/providers/theme-provider';

export const UserAvatar = ({ className, profileId }) => {
    const { user } = useIdentity();
    const { isDark } = useTheme();

    const { data: profile } = useQuery({
        queryKey: ['profile', profileId],
        queryFn: () => getProfile(profileId),
        enabled: !!profileId,
    });

    const source = profileId ? profile : user;
    const seed = source ? source.name + source.uuid : null;
    const color = isDark ? source?.colorDark : source?.colorLight;

    return (
        <div
            className={cn('size-10 bg-(--user-color) rounded-full overflow-hidden', className)}
            style={{ '--user-color': color }}
        >
            {seed && <img src={getAvatarUrl(seed)} alt='User Avatar' className='size-full' />}
        </div>
    );
};

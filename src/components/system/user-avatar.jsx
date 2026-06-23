import { useQuery } from '@tanstack/react-query';
import { cn } from '@/helpers/utils';
import { getAvatarUrl } from '@/helpers/avatar';
import { getProfile } from '@/services/profiles';
import { useIdentity } from '@/hooks/use-identity';
import { useTheme } from '@/providers/theme-provider';

export const UserAvatar = ({ className, profileId, profile: profileProp }) => {
    const { user } = useIdentity();
    const { isDark } = useTheme();

    const { data: fetched } = useQuery({
        queryKey: ['profile', profileId],
        queryFn: () => getProfile(profileId),
        enabled: !!profileId && !profileProp,
    });

    const source = profileProp ?? (profileId ? fetched : user);
    const seed = source ? source.name + (source.uuid ?? source.id) : null;
    const color = isDark
        ? (source?.colorDark ?? source?.color_dark)
        : (source?.colorLight ?? source?.color_light);

    return (
        <div
            className={cn('size-10 bg-(--user-color) rounded-full overflow-hidden', className)}
            style={{ '--user-color': color }}
        >
            {seed && <img src={getAvatarUrl(seed)} alt='User Avatar' className='size-full' />}
        </div>
    );
};

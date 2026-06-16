import { useRouter } from '@tanstack/react-router';
import { useListener } from '@/providers/bus-provider';
import { useIdentity } from '@/hooks/use-identity';
import { settings } from '@/services/settings';

export const useGlobalCommands = () => {
    const router = useRouter();
    const { user } = useIdentity();

    useListener('command:setting', params => settings.handleCommand(params));
    useListener('app:reload', () => window.location.reload());
    useListener('app:navigate', opts => router.navigate(opts));
    useListener('user:go-profile', () => {
        if (user?.uuid) router.navigate({ to: '/user/$uuid', params: { uuid: user.uuid } });
    });
};

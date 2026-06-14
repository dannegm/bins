import { useRouter } from '@tanstack/react-router';
import { useListener } from '@/providers/bus-provider';
import { settings } from '@/services/settings';

export const useGlobalCommands = () => {
    const router = useRouter();

    useListener('command:setting', params => settings.handleCommand(params));
    useListener('app:reload', () => window.location.reload());
    useListener('app:navigate', opts => router.navigate(opts));
};

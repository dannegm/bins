import { useListener } from '@/providers/bus-provider';
import { settings } from '@/services/settings';

export const useGlobalCommands = () => {
    useListener('command:setting', params => settings.handleCommand(params));
};

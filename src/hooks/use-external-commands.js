import { useEffect } from 'react';
import { subscribe, parseCommand as ntfyParse } from '@/services/ntfy';
import { parseCommand } from '@/services/commands';
import { settings } from '@/services/settings';
import { useEvents } from '@/providers/bus-provider';

const createHandlers = emit => ({
    setting: params => emit('command:setting', params),
    nudge: params => emit('command:nudge', params),
});

export const useExternalCommands = () => {
    const { emit } = useEvents();

    useEffect(() => {
        const handlers = createHandlers(emit);

        return subscribe(message => {
            const cmd = parseCommand(message);
            if (cmd) {
                if (cmd.to && !cmd.to.includes(settings.get('user.uuid'))) return;
                handlers[cmd.name]?.(cmd.params);
                return;
            }

            const raw = ntfyParse(message);
            if (raw) handlers[raw.name]?.(raw.params);
        });
    }, []);
};

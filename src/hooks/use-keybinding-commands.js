import { useRouterState } from '@tanstack/react-router';
import { useEvents } from '@/providers/bus-provider';
import { useSettings } from '@/hooks/use-settings';
import { defaultSettings } from '@/constants/default-settings';
import { useHotkey } from '@/hooks/use-hotkey';

export const useKeybindingCommands = () => {
    const { emit } = useEvents();
    const pathname = useRouterState({ select: s => s.location.pathname });
    const [appKeybindings] = useSettings('appKeybindings', defaultSettings.appKeybindings);

    const kb = id => appKeybindings[id] ?? defaultSettings.appKeybindings[id];
    const onEditor = pathname.startsWith('/editor');

    // ─── General ────────────────────────────────────────────────────────────────
    useHotkey(kb('command_palette'), () => emit('palette:toggle'));
    useHotkey(kb('settings'), () => emit('app:navigate', { to: '/settings' }));
    useHotkey(kb('new_bin'), () => emit('app:navigate', { to: '/new' }));

    // ─── Tabs ───────────────────────────────────────────────────────────────────
    useHotkey(kb('new_file'), () => emit('editor:new-file'), { enabled: onEditor });
    useHotkey(kb('prev_tab'), () => emit('editor:prev-tab'), { enabled: onEditor });
    useHotkey(kb('next_tab'), () => emit('editor:next-tab'), { enabled: onEditor });

    // ─── Bin ────────────────────────────────────────────────────────────────────
    useHotkey(kb('copy_link'), () => emit('bin:share'), { enabled: onEditor });

    // ─── Editor ─────────────────────────────────────────────────────────────────
    useHotkey(kb('toggle_runner'), () => emit('editor:toggle-runner'), { enabled: onEditor });
    useHotkey(kb('format_code'), () => emit('editor:format'), { enabled: onEditor });
};

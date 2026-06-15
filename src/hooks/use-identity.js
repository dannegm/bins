import { useSettings } from '@/hooks/use-settings';
import { settings } from '@/services/settings';
import { supabase } from '@/services/supabase';

export const useIdentity = () => {
    const [user, setUser] = useSettings('user');

    const update = async patch => {
        setUser(current => ({ ...current, ...patch }));
        const current = settings.get('user');
        const merged = { ...current, ...patch };
        await supabase().from('profiles').upsert({
            uuid: merged.uuid,
            name: merged.name,
            color_light: merged.colorLight,
            color_dark: merged.colorDark,
        });
    };

    return { user, update };
};

import { useEffect } from 'react';
import { settings } from '@/services/settings';
import { supabase } from '@/services/supabase';
import { generateUUID, generateName, generateColors } from '@/helpers/identity';

const initIdentity = async () => {
    const user = settings.get('user');

    if (user?.uuid) return;

    const uuid = generateUUID();
    const name = generateName();
    const { colorDark, colorLight } = generateColors();

    settings.set('user', { uuid, name, colorDark, colorLight });

    await supabase().from('profiles').upsert({
        uuid,
        name,
        color_light: colorLight,
        color_dark: colorDark,
    });
};

export const IdentityProvider = ({ children }) => {
    useEffect(() => {
        initIdentity();
    }, []);

    return children;
};

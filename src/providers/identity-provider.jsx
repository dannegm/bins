import { useEffect } from 'react';
import { settings } from '@/services/settings';
import { supabase } from '@/services/supabase';
import { generateUUID, generateName, generateColors } from '@/helpers/identity';
import { parseUA } from '@/helpers/ua-parser';

const hashIP = async ip => {
    const data = new TextEncoder().encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

const syncProfile = async ({ uuid, name, colorDark, colorLight }) => {
    try {
        const res = await fetch('https://ipinfo.io/json');
        const { ip, country, city } = await res.json();
        const ip_hash = await hashIP(ip);
        const ua = navigator.userAgent;
        const is_bot = navigator.webdriver === true || parseUA(ua).bot !== null;

        await supabase()
            .from('profiles')
            .upsert({
                uuid,
                name,
                color_light: colorLight,
                color_dark: colorDark,
                ip_hash,
                country,
                city,
                user_agent: ua,
                is_bot,
            });
    } catch {
        // non-critical
    }
};

const initIdentity = async () => {
    let profile = settings.get('user');

    if (!profile?.uuid) {
        const uuid = generateUUID();
        const name = generateName();
        const { colorDark, colorLight } = generateColors();
        profile = { uuid, name, colorDark, colorLight };
        settings.set('user', profile);
    }

    syncProfile(profile);
};

export const IdentityProvider = ({ children }) => {
    useEffect(() => {
        initIdentity();
    }, []);

    return children;
};

import { useEffect } from 'react';
import { settings } from '@/services/settings';
import { supabase } from '@/services/supabase';
import { generateUUID, generateName, generateColors } from '@/helpers/identity';
import { parseUA } from '@/helpers/ua-parser';

const hashIP = ip =>
    ip.split('.').map(n => parseInt(n).toString(16).padStart(2, '0')).join('').toUpperCase();

const fetchGeoData = async () => {
    try {
        const res = await fetch('https://ipinfo.io/json');
        const { ip, country, city } = await res.json();
        const ip_hash = hashIP(ip);
        return { ip_hash, country, city };
    } catch {
        return {};
    }
};

const syncProfile = async ({ uuid, name, colorDark, colorLight }) => {
    const ua = navigator.userAgent;
    const is_bot = navigator.webdriver === true || parseUA(ua).bot !== null;
    const geo = await fetchGeoData();

    try {
        await supabase().from('profiles').upsert({
            uuid,
            name,
            color_light: colorLight,
            color_dark: colorDark,
            user_agent: ua,
            is_bot,
            ...geo,
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

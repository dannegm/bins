import { useEffect } from 'react';
import { isBefore, parseISO } from 'date-fns';
import { settings } from '@/services/settings';
import { supabase } from '@/services/supabase';
import { generateName, generateColors } from '@/helpers/identity';
import { parseUA } from '@/helpers/ua-parser';

const MIGRATION_DATE = parseISO('2026-06-20T22:00:00-05:00');

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

    const { error } = await supabase().from('profiles').upsert({
        uuid,
        name,
        color_light: colorLight,
        color_dark: colorDark,
        user_agent: ua,
        is_bot,
        ...geo,
    });
    if (error) console.error('[identity] syncProfile failed:', error);
};

// Module-level promise ensures a single initialization per page load.
// React Strict Mode double-invokes effects — without this, two concurrent
// signInAnonymously() calls create two different auth users, causing a
// uuid/auth.uid() mismatch that breaks the RLS insert policy.
let _initPromise = null;

const _runInitIdentity = async () => {
    const migratedAt = settings.get('migratedAt');
    if (!migratedAt || isBefore(parseISO(migratedAt), MIGRATION_DATE)) {
        settings.setAll({});
        settings.set('migratedAt', MIGRATION_DATE.toISOString());
    }

    // INITIAL_SESSION fires after the client finishes async init + token refresh from localStorage,
    // avoiding a race where getSession() returns null before the stored session is restored.
    let session = await new Promise(resolve => {
        const { data: { subscription } } = supabase().auth.onAuthStateChange((event, s) => {
            if (event === 'INITIAL_SESSION') {
                subscription.unsubscribe();
                resolve(s);
            }
        });
    });

    if (!session) {
        const { data: anonData, error: anonError } = await supabase().auth.signInAnonymously();
        if (anonError) {
            console.error('[identity] signInAnonymously failed:', anonError);
            return;
        }
        session = anonData.session;
    }

    const uuid = session.user.id;

    let profile = settings.get('user');
    if (!profile?.uuid || profile.uuid !== uuid) {
        const name = generateName();
        const { colorDark, colorLight } = generateColors();
        profile = { uuid, name, colorDark, colorLight };
        settings.set('user', profile);
    }

    supabase().auth.updateUser({ data: { display_name: profile.name } });
    syncProfile(profile);
};

const initIdentity = () => {
    if (!_initPromise) _initPromise = _runInitIdentity();
    return _initPromise;
};

export const IdentityProvider = ({ children }) => {
    useEffect(() => {
        initIdentity();
    }, []);

    return children;
};

import { supabase } from './supabase';
import { signJWT } from '@/helpers/jwt';

const ADMIN_CLAIM_URL =
    import.meta.env.VITE_ADMIN_CLAIM_URL ?? 'https://endpoints.hckr.mx/bins/admin/claim';
const AUTH_CLAIM_URL =
    import.meta.env.VITE_AUTH_CLAIM_URL ?? 'https://endpoints.hckr.mx/bins/auth/claim';

export const claimSession = async (uuid = null) => {
    const headers = {};
    if (uuid) {
        const token = await signJWT({ uuid });
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(AUTH_CLAIM_URL, { method: 'POST', headers });
    if (!res.ok) throw new Error('Claim failed');
    const { access_token, refresh_token } = await res.json();
    const { data, error } = await supabase().auth.setSession({ access_token, refresh_token });
    if (error) throw error;
    return data.session;
};

export const claimAdmin = async (uuid, password) => {
    const token = await signJWT({ uuid, password });
    const res = await fetch(ADMIN_CLAIM_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Invalid credentials');
};

export const deleteProfile = async uuid => {
    const { error } = await supabase().from('profiles').delete().eq('uuid', uuid);
    if (error) throw error;
};

export const getProfile = async uuid => {
    const { data } = await supabase()
        .from('profiles')
        .select('uuid, name, color_light, color_dark, is_bot')
        .eq('uuid', uuid)
        .maybeSingle();
    if (!data) return null;
    return {
        uuid: data.uuid,
        name: data.name,
        colorLight: data.color_light,
        colorDark: data.color_dark,
        isBot: data.is_bot ?? false,
    };
};

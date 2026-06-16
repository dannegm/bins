import { supabase } from './supabase';

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

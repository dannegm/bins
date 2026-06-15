import { supabase } from './supabase';

export const getProfile = async uuid => {
    const { data } = await supabase()
        .from('profiles')
        .select('uuid, name')
        .eq('uuid', uuid)
        .maybeSingle();
    return data ?? null;
};

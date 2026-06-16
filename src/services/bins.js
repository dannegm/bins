import { settings } from './settings';
import { supabase } from './supabase';
import { generateBinName } from '@/helpers/identity';

export const getBin = async binId => {
    const { data, error } = await supabase().from('bins').select('*').eq('id', binId).maybeSingle();

    if (error) throw error;
    return data;
};

export const ensureBin = async binId => {
    const existing = await getBin(binId);
    if (existing) return existing;

    const authorId = settings.get('user.uuid');
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { data, error } = await supabase()
        .from('bins')
        .insert({ id: binId, title: generateBinName(), author_id: authorId, expires_at: expiresAt })
        .select()
        .single();

    if (error?.code === '23505') return await getBin(binId);
    if (error) throw error;
    return data;
};

export const permanentizeBin = async binId => {
    const { error } = await supabase().from('bins').update({ expires_at: null }).eq('id', binId);

    if (error) throw error;
};

export const updateBin = async (binId, data) => {
    const { error } = await supabase().from('bins').update(data).eq('id', binId);
    if (error) throw error;
};

export const deleteBin = async binId => {
    const { error } = await supabase().from('bins').delete().eq('id', binId);
    if (error) throw error;
};

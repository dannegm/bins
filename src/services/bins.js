import { nanoid } from 'nanoid';
import { settings } from './settings';
import { supabase } from './supabase';
import { generateBinName } from '@/helpers/identity';

export const getBinAccess = async binId => {
    const { data, error } = await supabase().rpc('get_bin_access', { p_bin_id: binId });
    if (error) return { bin_exists: false, can_access: true };
    return data?.[0] ?? { bin_exists: false, can_access: true };
};

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

export const forkBin = async sourceBinId => {
    const authorId = settings.get('user.uuid');

    const { data: source, error: sourceError } = await supabase()
        .from('bins')
        .select('*, bin_files(*)')
        .eq('id', sourceBinId)
        .single();

    if (sourceError) throw sourceError;

    const newId = nanoid(10);

    const { error: binError } = await supabase().from('bins').insert({
        id: newId,
        title: source.title,
        author_id: authorId,
        is_readonly: source.is_readonly,
        forked_from: sourceBinId,
        expires_at: null,
    });

    if (binError) throw binError;

    const files = source.bin_files ?? [];
    for (const file of files) {
        const { error: fileError } = await supabase()
            .from('bin_files')
            .insert({
                id: nanoid(8),
                bin_id: newId,
                name: file.name,
                language: file.language,
                content: file.content,
                ydoc_state: file.ydoc_state,
                position: file.position,
            });
        if (fileError) throw fileError;
    }

    return newId;
};

export const createBinWithFiles = async (title, files) => {
    const authorId = settings.get('user.uuid');
    const newId = nanoid(10);

    const { error: binError } = await supabase()
        .from('bins')
        .insert({ id: newId, title, author_id: authorId, expires_at: null });

    if (binError) throw binError;

    for (let i = 0; i < files.length; i++) {
        const { name, language, content } = files[i];
        const { error: fileError } = await supabase()
            .from('bin_files')
            .insert({ id: nanoid(8), bin_id: newId, name, language, content: content ?? '', position: i });
        if (fileError) throw fileError;
    }

    return newId;
};

export const incrementViews = async binId => {
    const key = `viewed:${binId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');

    const { data } = await supabase().from('bins').select('views').eq('id', binId).maybeSingle();

    await supabase()
        .from('bins')
        .update({ views: (data?.views ?? 0) + 1 })
        .eq('id', binId);
};

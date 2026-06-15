import { nanoid } from 'nanoid';
import { supabase } from './supabase';

export const getFiles = async binId => {
    const { data, error } = await supabase()
        .from('bin_files')
        .select('*')
        .eq('bin_id', binId)
        .order('position', { ascending: true });

    if (error) throw error;
    return data ?? [];
};

export const createFile = async (binId, attrs = {}) => {
    const { data, error } = await supabase()
        .from('bin_files')
        .insert({
            id: nanoid(8),
            bin_id: binId,
            name: attrs.name ?? 'untitled.md',
            language: attrs.language ?? 'markdown',
            content: attrs.content ?? '',
            position: attrs.position ?? 0,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateFile = async (fileId, attrs) => {
    const { error } = await supabase().from('bin_files').update(attrs).eq('id', fileId);
    if (error) throw error;
};

export const deleteFile = async fileId => {
    const { error } = await supabase().from('bin_files').delete().eq('id', fileId);
    if (error) throw error;
};

export const subscribeToFiles = (binId, { onInsert, onUpdate, onDelete } = {}) => {
    const channel = supabase()
        .channel(`db:bin_files:${binId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'bins',
                table: 'bin_files',
                filter: `bin_id=eq.${binId}`,
            },
            ({ new: file }) => onInsert?.(file),
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'bins',
                table: 'bin_files',
                filter: `bin_id=eq.${binId}`,
            },
            ({ new: file }) => onUpdate?.(file),
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'bins',
                table: 'bin_files',
                filter: `bin_id=eq.${binId}`,
            },
            ({ old: file }) => onDelete?.(file),
        )
        .subscribe();

    return () => channel.unsubscribe();
};

import { supabase } from './supabase';

export const registerCollaborator = async (binId, userId) => {
    const { error } = await supabase()
        .from('bin_collaborators')
        .upsert(
            { bin_id: binId, user_id: userId },
            { onConflict: 'bin_id,user_id', ignoreDuplicates: true },
        );

    if (error) throw error;
};

export const clearCollaborators = async binId => {
    const { error } = await supabase()
        .from('bin_collaborators')
        .delete()
        .eq('bin_id', binId);

    if (error) throw error;
};

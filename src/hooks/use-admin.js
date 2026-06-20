import { useQuery } from '@tanstack/react-query';
import { settings } from '@/services/settings';
import { supabase } from '@/services/supabase';

const fetchIsAdmin = async uuid => {
    if (!uuid) return false;
    const { data } = await supabase()
        .from('profiles')
        .select('is_admin')
        .eq('uuid', uuid)
        .maybeSingle();
    return data?.is_admin ?? false;
};

export const useAdmin = () => {
    const uuid = settings.get('user.uuid');
    const { data: isAdmin = false } = useQuery({
        queryKey: ['admin', uuid],
        queryFn: () => fetchIsAdmin(uuid),
        staleTime: 1000 * 60 * 5,
    });
    return { isAdmin };
};

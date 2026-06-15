import { createClient } from '@supabase/supabase-js';
import { settings } from '@/services/settings';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let _client = null;
let _uuid = null;

export const supabase = () => {
    const uuid = settings.get('user.uuid');

    if (_client && uuid === _uuid) return _client;

    _uuid = uuid;
    _client = createClient(SUPABASE_URL, SUPABASE_KEY, {
        db: { schema: 'bins' },
        global: {
            headers: {
                ...(uuid && { 'x-client-id': uuid }),
            },
        },
    });

    return _client;
};

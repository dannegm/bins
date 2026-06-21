import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let _client = null;

export const supabase = () => {
    if (_client) return _client;
    _client = createClient(SUPABASE_URL, SUPABASE_KEY, {
        db: { schema: 'bins' },
    });
    return _client;
};

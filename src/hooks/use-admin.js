import { useLocalStorage } from '@/hooks/use-local-storage';

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY;

export const useAdmin = () => {
    const [adminKey] = useLocalStorage('admin:key', null);
    return { isAdmin: !!(ADMIN_KEY && adminKey === ADMIN_KEY) };
};

import { useSettings } from '@/hooks/use-settings';

export const useIdentity = () => {
    const [user, setUser] = useSettings('user');

    const update = patch => {
        setUser(current => ({ ...current, ...patch }));
    };

    return { user, update };
};

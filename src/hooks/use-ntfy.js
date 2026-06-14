import { useEffect } from 'react';
import { subscribe } from '@/services/ntfy';

export const useNtfy = onMessage => {
    useEffect(() => {
        const unsubscribe = subscribe(onMessage);
        return unsubscribe;
    }, []);
};

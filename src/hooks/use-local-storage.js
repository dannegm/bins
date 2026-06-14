import { useState, useEffect, useRef } from 'react';

export const useLocalStorage = (key, initialValue) => {
    const $initial = useRef(initialValue);

    const [storedValue, setStoredValue] = useState(() => {
        if (typeof window === 'undefined') return $initial.current;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : $initial.current;
        } catch {
            return $initial.current;
        }
    });

    const setValue = value => {
        try {
            const next = value instanceof Function ? value(storedValue) : value;
            setStoredValue(next);
            localStorage.setItem(key, JSON.stringify(next));
            const bc = new BroadcastChannel('local-storage');
            bc.postMessage({ key, value: next });
            bc.close();
        } catch {}
    };

    const setSilentValue = value => {
        try {
            const next = value instanceof Function ? value(storedValue) : value;
            localStorage.setItem(key, JSON.stringify(next));
        } catch {}
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const bc = new BroadcastChannel('local-storage');

        const handleStorage = event => {
            if (event.key === key) {
                try {
                    const item = localStorage.getItem(key);
                    setStoredValue(item ? JSON.parse(item) : $initial.current);
                } catch {}
            }
        };

        const handleBroadcast = event => {
            if (event.data.key === key) setStoredValue(event.data.value);
        };

        window.addEventListener('storage', handleStorage);
        bc.addEventListener('message', handleBroadcast);

        return () => {
            window.removeEventListener('storage', handleStorage);
            bc.removeEventListener('message', handleBroadcast);
            bc.close();
        };
    }, [key]);

    return [storedValue, setValue, setSilentValue];
};

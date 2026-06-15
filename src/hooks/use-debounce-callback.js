import { useCallback, useRef } from 'react';

export const useDebouncedCallback = (fn, delay) => {
    const $timer = useRef(null);

    const debounced = useCallback(
        (...args) => {
            clearTimeout($timer.current);
            $timer.current = setTimeout(() => fn(...args), delay);
        },
        [fn, delay],
    );

    debounced.cancel = () => clearTimeout($timer.current);

    return debounced;
};

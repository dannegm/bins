import { useEffect, useRef } from 'react';

export const useDebouncedEffect = (fn, deps, delay) => {
    const $timer = useRef(null);
    const $mounted = useRef(false);

    useEffect(() => {
        if (!$mounted.current) {
            $mounted.current = true;
            return;
        }
        clearTimeout($timer.current);
        $timer.current = setTimeout(fn, delay);
        return () => clearTimeout($timer.current);
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps
};

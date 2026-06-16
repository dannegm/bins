import { useState, useEffect } from 'react';

const DEFAULT_CHARS =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-={}[];:,.<>/?';

const scramble = (text, chars) =>
    String(text)
        .split('')
        .map(ch => (ch === ' ' ? ' ' : chars[Math.floor(Math.random() * chars.length)]))
        .join('');

export const ScrambleText = ({ children, chars = DEFAULT_CHARS }) => {
    const [, setTick] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 50);
        return () => clearInterval(id);
    }, []);

    return <span>{scramble(children, chars)}</span>;
};

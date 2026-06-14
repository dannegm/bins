import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export const redirectInternal =
    ({ to, params, search }) =>
    () => {
        const navigate = useNavigate();
        useEffect(() => {
            navigate({ to, params, search, replace: true });
        }, []);
        return null;
    };

export const redirectExternal =
    ({ to, target = '_self' }) =>
    () => {
        useEffect(() => {
            if (target === '_self') {
                window.location.replace(to);
            } else {
                window.open(to, target);
            }
        }, []);
        return null;
    };

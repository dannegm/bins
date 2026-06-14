import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { nanoid } from 'nanoid';

export const NewPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate({ to: '/editor/$bin-id', params: { 'bin-id': nanoid(8) }, replace: true });
    }, []);

    return null;
};

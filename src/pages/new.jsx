import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { nanoid } from 'nanoid';

export const NewPage = () => {
    const navigate = useNavigate();

    useEffect(() => {
        navigate({ to: '/editor/$binId', params: { binId: nanoid(8) }, replace: true });
    }, []);

    return null;
};

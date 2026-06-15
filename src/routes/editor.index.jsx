import { createFileRoute, redirect } from '@tanstack/react-router';
import { nanoid } from 'nanoid';

export const Route = createFileRoute('/editor/')({
    beforeLoad: () => {
        throw redirect({ to: '/editor/$binId', params: { binId: nanoid(8) }, replace: true });
    },
    component: () => null,
});

import { createFileRoute } from '@tanstack/react-router';
import { UserPage } from '@/pages/user';

export const Route = createFileRoute('/user/$uuid')({ component: UserPage });

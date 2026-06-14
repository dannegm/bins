import { createFileRoute } from '@tanstack/react-router';
import { AdminUsersPage } from '@/pages/admin-users';

export const Route = createFileRoute('/admin/users')({ component: AdminUsersPage });

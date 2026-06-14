import { createFileRoute } from '@tanstack/react-router';
import { AdminBinsPage } from '@/pages/admin-bins';

export const Route = createFileRoute('/admin/bins')({ component: AdminBinsPage });

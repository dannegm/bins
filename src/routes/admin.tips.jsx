import { createFileRoute } from '@tanstack/react-router';
import { AdminTipsPage } from '@/pages/admin-tips';

export const Route = createFileRoute('/admin/tips')({ component: AdminTipsPage });

import { createFileRoute } from '@tanstack/react-router';
import { ForkPage } from '@/pages/fork';

export const Route = createFileRoute('/fork/$binId')({ component: ForkPage });

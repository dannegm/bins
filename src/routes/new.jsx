import { createFileRoute } from '@tanstack/react-router';
import { NewPage } from '@/pages/new';

export const Route = createFileRoute('/new')({ component: NewPage });

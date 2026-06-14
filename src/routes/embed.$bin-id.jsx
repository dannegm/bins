import { createFileRoute } from '@tanstack/react-router';
import { EmbedPage } from '@/pages/embed';

export const Route = createFileRoute('/embed/$bin-id')({ component: EmbedPage });

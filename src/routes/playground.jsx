import { createFileRoute } from '@tanstack/react-router';
import { PlaygroundPage } from '@/pages/playground';

export const Route = createFileRoute('/playground')({ component: PlaygroundPage });

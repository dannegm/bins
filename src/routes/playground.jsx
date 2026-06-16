import { createFileRoute } from '@tanstack/react-router';
import { DummyPage } from '@/pages/dummy.jsx';

export const Route = createFileRoute('/playground')({ component: DummyPage });

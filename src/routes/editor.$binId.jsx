import { createFileRoute } from '@tanstack/react-router';
import { EditorPage } from '@/pages/editor';

export const Route = createFileRoute('/editor/$binId')({ component: EditorPage });

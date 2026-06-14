import { createFileRoute } from '@tanstack/react-router';
import { HomePage } from '@/pages/home.jsx';

export const Route = createFileRoute('/')({ component: HomePage });

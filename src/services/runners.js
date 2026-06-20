import { Eye } from 'lucide-react';
import { MarkdownRunner } from '@/components/runners/markdown-runner';

const RUNNERS = [
    {
        id: 'markdown',
        label: 'Preview',
        icon: Eye,
        component: MarkdownRunner,
        languages: ['markdown'],
    },
];

export const getRunner = language =>
    RUNNERS.find(r => r.languages.includes(language)) ?? null;

export const hasRunner = language => getRunner(language) !== null;

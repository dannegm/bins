import { Eye, Table } from 'lucide-react';
import { MarkdownRunner } from '@/components/runners/markdown-runner';
import { CsvRunner } from '@/components/runners/csv-runner';

const RUNNERS = [
    {
        id: 'markdown',
        label: 'Preview',
        icon: Eye,
        component: MarkdownRunner,
        languages: ['markdown'],
    },
    {
        id: 'csv',
        label: 'Preview',
        icon: Table,
        component: CsvRunner,
        languages: ['csv'],
    },
];

export const getRunner = language =>
    RUNNERS.find(r => r.languages.includes(language)) ?? null;

export const hasRunner = language => getRunner(language) !== null;

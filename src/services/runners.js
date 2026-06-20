import { Eye, Table, MessageCircle } from 'lucide-react';
import { MarkdownRunner } from '@/components/runners/markdown-runner';
import { CsvRunner } from '@/components/runners/csv-runner';
import { WhatsAppRunner } from '@/components/runners/whatsapp-runner';

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
    {
        id: 'whatsapp',
        label: 'Preview',
        icon: MessageCircle,
        component: WhatsAppRunner,
        languages: ['whatsapp'],
    },
];

export const getRunner = language =>
    RUNNERS.find(r => r.languages.includes(language)) ?? null;

export const hasRunner = language => getRunner(language) !== null;

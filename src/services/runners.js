import { Eye, Table, MessageCircle, Globe, Terminal } from 'lucide-react';
import { MarkdownRunner } from '@/components/runners/markdown-runner';
import { HtmlRunner } from '@/components/runners/html-runner';
import { CsvRunner } from '@/components/runners/csv-runner';
import { WhatsAppRunner } from '@/components/runners/whatsapp-runner';
import { JsRunner } from '@/components/runners/js-runner';

const RUNNERS = [
    {
        id: 'markdown',
        label: 'Preview',
        icon: Eye,
        component: MarkdownRunner,
        languages: ['markdown'],
    },
    {
        id: 'html',
        label: 'Preview',
        icon: Globe,
        component: HtmlRunner,
        languages: ['html'],
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
    {
        id: 'js',
        label: 'Console',
        icon: Terminal,
        component: JsRunner,
        languages: ['javascript', 'typescript', 'jsx', 'tsx'],
    },
];

export const getRunner = language =>
    RUNNERS.find(r => r.languages.includes(language)) ?? null;

export const hasRunner = language => getRunner(language) !== null;

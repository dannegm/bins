import {
    Eye,
    Table,
    MessageCircle,
    Globe,
    Terminal,
    Braces,
    Network,
    GitBranch,
} from 'lucide-react';
import { MarkdownRunner } from '@/components/runners/markdown-runner';
import { HtmlRunner } from '@/components/runners/html-runner';
import { CsvRunner } from '@/components/runners/csv-runner';
import { WhatsAppRunner } from '@/components/runners/whatsapp-runner';
import { JsRunner } from '@/components/runners/js-runner';
import { JsonRunner } from '@/components/runners/json-runner';
import { YamlRunner } from '@/components/runners/yaml-runner';
import { TomlRunner } from '@/components/runners/toml-runner';
import { SvgRunner } from '@/components/runners/svg-runner';
import { HttpRunner } from '@/components/runners/http-runner';
import { XmlRunner } from '@/components/runners/xml-runner';
import { MermaidRunner } from '@/components/runners/mermaid-runner';

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
    {
        id: 'json',
        label: 'Preview',
        icon: Braces,
        component: JsonRunner,
        languages: ['json'],
    },
    {
        id: 'yaml',
        label: 'Preview',
        icon: Braces,
        component: YamlRunner,
        languages: ['yaml'],
    },
    {
        id: 'toml',
        label: 'Preview',
        icon: Braces,
        component: TomlRunner,
        languages: ['toml'],
    },
    {
        id: 'xml',
        label: 'Preview',
        icon: Braces,
        component: XmlRunner,
        languages: ['xml'],
    },
    {
        id: 'svg',
        label: 'Preview',
        icon: Eye,
        component: SvgRunner,
        languages: ['svg'],
    },
    {
        id: 'http',
        label: 'Requests',
        icon: Network,
        component: HttpRunner,
        languages: ['http'],
    },
    {
        id: 'mermaid',
        label: 'Diagram',
        icon: GitBranch,
        component: MermaidRunner,
        languages: ['mermaid'],
    },
];

export const getRunner = language => RUNNERS.find(r => r.languages.includes(language)) ?? null;

export const hasRunner = language => getRunner(language) !== null;

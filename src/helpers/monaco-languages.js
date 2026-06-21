import * as monaco from 'monaco-editor';
import * as csv from '@/helpers/languages/csv';
import * as whatsapp from '@/helpers/languages/whatsapp';
import * as http from '@/helpers/languages/http';
import * as mermaid from '@/helpers/languages/mermaid';

const CUSTOM_LANGUAGES = [csv, whatsapp, http, mermaid];

const HTTP_VERB_RULES_DARK = [
    { token: 'http.verb.get',     foreground: '60a5fa', fontStyle: 'bold' },
    { token: 'http.verb.post',    foreground: '4ade80', fontStyle: 'bold' },
    { token: 'http.verb.put',     foreground: 'facc15', fontStyle: 'bold' },
    { token: 'http.verb.patch',   foreground: 'fb923c', fontStyle: 'bold' },
    { token: 'http.verb.delete',  foreground: 'f87171', fontStyle: 'bold' },
    { token: 'http.verb.head',    foreground: 'c084fc', fontStyle: 'bold' },
    { token: 'http.verb.options', foreground: '67e8f9', fontStyle: 'bold' },
    { token: 'http.verb',         foreground: '94a3b8', fontStyle: 'bold' },
];

const HTTP_VERB_RULES_LIGHT = [
    { token: 'http.verb.get',     foreground: '2563eb', fontStyle: 'bold' },
    { token: 'http.verb.post',    foreground: '16a34a', fontStyle: 'bold' },
    { token: 'http.verb.put',     foreground: 'ca8a04', fontStyle: 'bold' },
    { token: 'http.verb.patch',   foreground: 'ea580c', fontStyle: 'bold' },
    { token: 'http.verb.delete',  foreground: 'dc2626', fontStyle: 'bold' },
    { token: 'http.verb.head',    foreground: '9333ea', fontStyle: 'bold' },
    { token: 'http.verb.options', foreground: '0891b2', fontStyle: 'bold' },
    { token: 'http.verb',         foreground: '64748b', fontStyle: 'bold' },
];

// Singleton state — all custom languages here are stateless (column/token
// counts reset per line), so one shared IState object is enough.
const STATE = {
    clone() { return this; },
    equals(other) { return other === this; },
};

const register = lang => {
    monaco.languages.register({ id: lang.id, extensions: lang.extensions, mimetypes: lang.mimetypes });
    monaco.languages.setTokensProvider(lang.id, {
        getInitialState: () => STATE,
        tokenize: (line, _state) => ({ tokens: lang.tokenize(line), endState: STATE }),
    });
};

export const getHttpVerbRules = isDark => (isDark ? HTTP_VERB_RULES_DARK : HTTP_VERB_RULES_LIGHT);

export const registerCustomLanguages = () => {
    CUSTOM_LANGUAGES.forEach(register);
};

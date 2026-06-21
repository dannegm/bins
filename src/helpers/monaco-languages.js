import * as monaco from 'monaco-editor';
import * as csv from '@/helpers/languages/csv';
import * as whatsapp from '@/helpers/languages/whatsapp';
import * as http from '@/helpers/languages/http';

const CUSTOM_LANGUAGES = [csv, whatsapp, http];

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

export const registerCustomLanguages = () => {
    CUSTOM_LANGUAGES.forEach(register);
};

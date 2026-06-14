import { createParser } from 'nuqs';

export const parseAsShorthandBoolean = createParser({
    parse() {
        return true;
    },
    serialize() {
        return 'true';
    },
}).withDefault(false);

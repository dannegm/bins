import { createParser } from 'nuqs';

export const parseAsShorthandBoolean = createParser({
    parse(value) {
        if (value === null || value === '0' || value === 'false' || value === 'no') return false;
        return true;
    },
    serialize(value) {
        return value ? '' : null;
    },
}).withDefault(false);

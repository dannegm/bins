import Color from 'color';
import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import { nouns } from '@/constants/word-lists';

export const generateUUID = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant
    const h = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
    return `${h.slice(0, 8)}-4105-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

export const generateName = () =>
    uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        separator: '-',
        style: 'lowerCase',
    });

export const generateBinName = () =>
    uniqueNamesGenerator({
        dictionaries: [colors, nouns],
        separator: '-',
        style: 'lowerCase',
    });

// colorDark  = bright/light color → used when isDark=true  (dark bg  → needs light color for contrast)
// colorLight = dark/rich color   → used when isDark=false (light bg → needs dark color for contrast)
export const generateColors = () => {
    const hue = Math.floor(Math.random() * 360);
    return {
        colorDark: Color.hsl(hue, 90, 68).hex(),
        colorLight: Color.hsl(hue, 72, 35).hex(),
    };
};

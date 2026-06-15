import { uniqueNamesGenerator, adjectives, animals, colors } from 'unique-names-generator';
import { nouns } from '@/constants/word-lists';

export const generateUUID = () => crypto.randomUUID();

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
        colorDark: `hsl(${hue}, 90%, 68%)`,
        colorLight: `hsl(${hue}, 72%, 35%)`,
    };
};

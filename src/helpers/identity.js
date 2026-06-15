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

export const generateColors = () => {
    const hue = Math.floor(Math.random() * 360);
    return {
        colorDark: `hsl(${hue}, 80%, 70%)`,
        colorLight: `hsl(${hue}, 70%, 40%)`,
    };
};

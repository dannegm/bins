import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

export const generateUUID = () => crypto.randomUUID();

export const generateName = () =>
    uniqueNamesGenerator({ dictionaries: [adjectives, animals], separator: '-', style: 'lowerCase' });

export const generateColors = () => {
    const hue = Math.floor(Math.random() * 360);
    return {
        colorDark: `hsl(${hue}, 80%, 70%)`,
        colorLight: `hsl(${hue}, 70%, 40%)`,
    };
};

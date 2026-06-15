import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/locales/en.json';
import es from '@/locales/es.json';

const langs = [
    { id: 'en', label: en.language, resources: en },
    { id: 'es', label: es.language, resources: es },
];

const resources = langs.reduce((acc, lang) => {
    acc[lang.id] = { translation: lang.resources };
    return acc;
}, {});

export const SUPPORTED_LANGUAGES = langs.map(({ id, label }) => ({ id, label }));

i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
});

export default i18n;

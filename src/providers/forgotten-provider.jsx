import { ForgottenPage } from '@/pages/forgotten';

export const FORGOTTEN_KEY = 'bins:forgotten';

export const markAsForgotten = () => localStorage.setItem(FORGOTTEN_KEY, '1');
export const clearForgotten = () => localStorage.removeItem(FORGOTTEN_KEY);

export const ForgottenProvider = ({ children }) => {
    if (localStorage.getItem(FORGOTTEN_KEY) !== null) return <ForgottenPage />;
    return children;
};

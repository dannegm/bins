import { DummyPage } from '@/pages/dummy';

export const HeadlessGuard = ({ children }) => {
    if (navigator.webdriver) return <DummyPage />;
    return children;
};

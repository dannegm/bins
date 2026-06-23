import { parseUA } from '@/helpers/ua-parser';
import { DummyPage } from '@/pages/dummy';

const isHeadless = () => navigator.webdriver || parseUA(navigator.userAgent).bot !== null;

export const HeadlessGuard = ({ children }) => {
    if (isHeadless()) return <DummyPage />;
    return children;
};

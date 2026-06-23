import { useEffect } from 'react';
import { useLocation } from '@tanstack/react-router';
import { parseUA } from '@/helpers/ua-parser';

const toSlug = name => name.split(/[\s/]/)[0].toLowerCase();

const toPageSlug = pathname => {
    if (pathname === '/') return 'home';
    return pathname.split('/')[1] || 'home';
};

export const DeviceProvider = ({ children }) => {
    const { pathname } = useLocation();

    useEffect(() => {
        const { browser, os, device } = parseUA(navigator.userAgent);
        document.documentElement.setAttribute(
            'data-browser',
            browser ? toSlug(browser.name) : 'unknown',
        );
        document.documentElement.setAttribute('data-os', os ? toSlug(os.name) : 'unknown');
        document.documentElement.setAttribute('data-device', device);
    }, []);

    useEffect(() => {
        document.documentElement.setAttribute('data-page', toPageSlug(pathname));
    }, [pathname]);

    return children;
};

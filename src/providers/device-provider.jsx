import { useEffect } from 'react';
import { parseUA } from '@/helpers/ua-parser';

const toSlug = name => name.split(/[\s/]/)[0].toLowerCase();

export const DeviceProvider = ({ children }) => {
    useEffect(() => {
        const { browser, os, device } = parseUA(navigator.userAgent);
        document.documentElement.setAttribute('data-browser', browser ? toSlug(browser.name) : 'unknown');
        document.documentElement.setAttribute('data-os', os ? toSlug(os.name) : 'unknown');
        document.documentElement.setAttribute('data-device', device);
    }, []);

    return children;
};

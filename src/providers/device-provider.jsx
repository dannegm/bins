import { useEffect } from 'react';

const detectBrowser = () => {
    const ua = navigator.userAgent;
    if (/Edg\//.test(ua)) return 'edge';
    if (/OPR\/|Opera\//.test(ua)) return 'opera';
    if (/Firefox\//.test(ua)) return 'firefox';
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'safari';
    if (/Chrome\//.test(ua)) return 'chrome';
    return 'unknown';
};

const detectDevice = () => {
    const ua = navigator.userAgent;
    if (/Mobi|Android|iPhone|iPod/.test(ua)) return 'mobile';
    if (/iPad|Tablet|PlayBook/.test(ua)) return 'tablet';
    return 'desktop';
};

const detectOS = () => {
    const ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'windows';
    if (/Android/.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Mac OS X/.test(ua)) return 'macos';
    if (/Linux/.test(ua)) return 'linux';
    return 'unknown';
};

export const DeviceProvider = ({ children }) => {
    useEffect(() => {
        document.documentElement.setAttribute('data-browser', detectBrowser());
        document.documentElement.setAttribute('data-device', detectDevice());
        document.documentElement.setAttribute('data-os', detectOS());
    }, []);

    return children;
};

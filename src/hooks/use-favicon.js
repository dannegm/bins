import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '@/providers/theme-provider';
import { useListener } from '@/providers/bus-provider';

const DOT_RADIUS = 6;

const DOT_COLOR = {
    offline: '#FF0052',
    nudge: '#FFD400',
    unsaved: '#0055DA',
};

const drawFavicon = (img, dotColor) => {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, 32, 32);
    if (dotColor) {
        const cx = 32 - DOT_RADIUS;
        const cy = DOT_RADIUS;
        ctx.beginPath();
        ctx.arc(cx, cy, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = dotColor;
        ctx.fill();
    }
    return canvas.toDataURL();
};

const applyFavicon = href => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
    }
    link.href = href;
};

export const useFavicon = ({ hasUnsaved }) => {
    const { isDark } = useTheme();
    const [img, setImg] = useState(null);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isVisible, setIsVisible] = useState(document.hasFocus());
    const [hasNudge, setHasNudge] = useState(false);

    useEffect(() => {
        const image = new Image();
        image.onload = () => setImg(image);
        image.src = isDark ? '/favicon-dark.png' : '/favicon-light.png';
    }, [isDark]);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        const handleFocus = () => { setIsVisible(true); setHasNudge(false); };
        const handleBlur = () => setIsVisible(false);
        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    useListener(
        'peer:nudge:received',
        useCallback(() => {
            if (!document.hasFocus()) setHasNudge(true);
        }, []),
    );

    useEffect(() => {
        if (!img) return;
        let dotColor = null;
        if (!isOnline) dotColor = DOT_COLOR.offline;
        else if (!isVisible && hasNudge) dotColor = DOT_COLOR.nudge;
        else if (!isVisible && hasUnsaved) dotColor = DOT_COLOR.unsaved;
        applyFavicon(drawFavicon(img, dotColor));
    }, [img, isOnline, isVisible, hasUnsaved, hasNudge]);
};

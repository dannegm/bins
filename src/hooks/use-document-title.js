import { useEffect, useState, useCallback } from 'react';
import { useListener } from '@/providers/bus-provider';

export const useDocumentTitle = ({ binTitle, fileName, hasUnsaved }) => {
    const [isVisible, setIsVisible] = useState(document.hasFocus());
    const [hasNudge, setHasNudge] = useState(false);

    useEffect(() => {
        const handleFocus = () => {
            setIsVisible(true);
            setHasNudge(false);
        };
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
        const base = [binTitle, fileName].filter(Boolean).join(' - ');
        let prefix = '';
        if (!isVisible) {
            if (hasNudge) prefix = '💡 ';
            else if (hasUnsaved) prefix = '✏️ ';
        }
        document.title = `${prefix}${base || 'BINS.'}`;
        return () => {
            document.title = 'BINS.';
        };
    }, [binTitle, fileName, isVisible, hasUnsaved, hasNudge]);
};

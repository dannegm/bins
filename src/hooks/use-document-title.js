import { useEffect, useState, useCallback } from 'react';
import { useListener } from '@/providers/bus-provider';

export const useDocumentTitle = ({ binTitle, fileName, hasUnsaved }) => {
    const [isVisible, setIsVisible] = useState(!document.hidden);
    const [hasNudge, setHasNudge] = useState(false);

    useEffect(() => {
        const handleVisibility = () => {
            const visible = !document.hidden;
            setIsVisible(visible);
            if (visible) setHasNudge(false);
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    useListener(
        'peer:nudge:received',
        useCallback(() => {
            if (document.hidden) setHasNudge(true);
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

import { useState, useEffect } from 'react';
import { useListener } from '@/providers/bus-provider';

export const EditorEventsProvider = ({ children }) => {
    const [editorFocused, setEditorFocused] = useState(false);

    useListener('editor:focus', () => {
        setEditorFocused(true);
    });

    useListener('editor:blur', () => {
        setEditorFocused(false);
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-editor-focused', editorFocused);
    }, [editorFocused]);

    return children;
};

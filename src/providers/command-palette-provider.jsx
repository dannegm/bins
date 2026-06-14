import { createContext, useContext, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { CommandPalette } from '@/components/system/command-palette';

const CommandPaletteContext = createContext({ isOpen: false, open: () => {}, close: () => {}, toggle: () => {} });

export const useCommandPalette = () => useContext(CommandPaletteContext);

export const CommandPaletteProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen(v => !v);

    useHotkeys('mod+k', e => { e.preventDefault(); toggle(); }, { enableOnFormElements: false });

    return (
        <CommandPaletteContext.Provider value={{ isOpen, open, close, toggle }}>
            <CommandPalette />
            {children}
        </CommandPaletteContext.Provider>
    );
};

import { createContext, useContext, useState } from 'react';
import { useListener } from '@/providers/bus-provider';
import { CommandPalette } from '@/components/system/command-palette';

const CommandPaletteContext = createContext({ isOpen: false, open: () => {}, close: () => {}, toggle: () => {} });

export const useCommandPalette = () => useContext(CommandPaletteContext);

export const CommandPaletteProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);

    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);

    useListener('palette:toggle', () => setIsOpen(v => !v));
    useListener('palette:open', open);
    useListener('palette:close', close);

    return (
        <CommandPaletteContext.Provider value={{ isOpen, open, close }}>
            <CommandPalette />
            {children}
        </CommandPaletteContext.Provider>
    );
};

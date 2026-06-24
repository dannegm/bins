import { createContext, useContext, useState } from 'react';

const PackagesCtx = createContext(null);

export const PackagesProvider = ({ children }) => {
    const [packagesOpen, setPackagesOpen] = useState(false);
    const [isJsFile, setIsJsFile] = useState(false);

    return (
        <PackagesCtx.Provider value={{ packagesOpen, setPackagesOpen, isJsFile, setIsJsFile }}>
            {children}
        </PackagesCtx.Provider>
    );
};

export const usePackagesPanel = () => useContext(PackagesCtx);

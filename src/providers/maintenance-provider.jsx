import { MaintenanceScreen } from '@/components/system/maintenance-screen';

export const MaintenanceProvider = ({ enabled, children }) => {
    if (enabled) return <MaintenanceScreen />;
    return children;
};

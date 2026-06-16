import { AdminLayout } from '@/components/admin/admin-layout';
import { UsersTable } from '@/components/admin/users-table';

export const AdminUsersPage = () => (
    <AdminLayout>
        <UsersTable />
    </AdminLayout>
);

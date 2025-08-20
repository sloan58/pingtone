import { UcmUsersTable } from '@/components/UcmUsersTable';
import { FilterRow } from '@/components/advanced-search';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { VisibilityState } from '@tanstack/react-table';

interface User {
    _id: string;
    userid: string;
    displayName?: string;
    mailid?: string;
    ucm: {
        name: string;
    };
}

interface Props {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({
    users,
    tableState,
    filters,
}: Props & {
    tableState?: { sort: string; perPage: number; columnVisibility?: VisibilityState };
    filters?: { applied?: FilterRow[]; logic?: 'and' | 'or' };
}) {
    return (
        <AppLayout>
            <Head title="Users" />
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="p-6">
                    <UcmUsersTable users={users} tableState={tableState} filters={filters} baseUrl="/ucm-users" title="UCM Users" />
                </div>
            </div>
        </AppLayout>
    );
}

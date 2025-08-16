import { UcmUsersTable } from '@/components/UcmUsersTable';
import { FilterRow } from '@/components/advanced-search';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
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
        <AppShell variant="sidebar">
            <Head title="Users" />

            <AppSidebar />

            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />

                <AppContent variant="sidebar">
                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <div className="p-6">
                            <UcmUsersTable users={users} tableState={tableState} filters={filters} baseUrl="/ucm-users" title="UCM Users" />
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

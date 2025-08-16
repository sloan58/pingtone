import { PhonesTable } from '@/components/PhonesTable';
import { FilterRow } from '@/components/advanced-search';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { Phone } from '@/types';
import { Head } from '@inertiajs/react';
import { VisibilityState } from '@tanstack/react-table';

interface Props {
    phones: {
        data: Phone[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({
    phones,
    tableState,
    filters,
}: Props & {
    tableState?: { sort: string; perPage: number; columnVisibility?: VisibilityState };
    filters?: { applied?: FilterRow[]; logic?: 'and' | 'or' };
}) {
    return (
        <AppShell variant="sidebar">
            <Head title="Phones" />

            <AppSidebar />

            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />

                <AppContent variant="sidebar">
                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <div className="p-6">
                            <PhonesTable phones={phones} tableState={tableState} filters={filters} baseUrl="/phones" title="Phones" />
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

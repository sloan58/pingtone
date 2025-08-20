import { PhonesTable } from '@/components/PhonesTable';
import { FilterRow } from '@/components/advanced-search';
import { Phone } from '@/types';
import AppLayout from '@/layouts/app-layout';
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
        <AppLayout>
            <Head title="Phones" />
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                <div className="p-6">
                    <PhonesTable phones={phones} tableState={tableState} filters={filters} baseUrl="/phones" title="Phones" />
                </div>
            </div>
        </AppLayout>
    );
}

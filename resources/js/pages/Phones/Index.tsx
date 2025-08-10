import * as React from 'react';
import { DataTable } from '@/components/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { Phone } from '@/types';
import { Head, Link, router } from '@inertiajs/react';

interface Props {
    phones: {
        data: Phone[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ phones, tableState }: Props & { tableState?: { sort: string; perPage: number } }) {
    const [sorting, setSorting] = React.useState(() => {
        const [id, dir] = (tableState?.sort ?? 'name:asc').split(':');
        return [{ id, desc: dir === 'desc' }];
    });

    const columns: ColumnDef<Phone & any>[] = [
        { accessorKey: 'name', header: 'Name', cell: (info) => info.getValue() as string },
        { accessorKey: 'description', header: 'Description', cell: (info) => (info.getValue() as string) || '' },
        { accessorKey: 'model', header: 'Model', cell: (info) => (info.getValue() as string) || '' },
        {
            accessorKey: 'devicePoolName',
            header: 'Device Pool',
            cell: ({ row }) => {
                const devicePool = (row.original as any).devicePoolName || (row.original as any).device_pool_name || '';
                return typeof devicePool === 'string' ? devicePool : devicePool?.name || devicePool?._ || devicePool?.value || '';
            },
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Link href={`/phones/${(row.original as any).id}/edit`} className="text-primary hover:underline">
                    Edit
                </Link>
            ),
        },
    ];
    return (
        <AppShell variant="sidebar">
            <Head title="Phones" />

            <AppSidebar />

            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />

                <AppContent variant="sidebar">
                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <div className="p-6">
                            <h2 className="mb-6 text-2xl font-semibold">Phones</h2>
                            <DataTable
                                columns={columns}
                                data={phones.data as any}
                                sorting={sorting as any}
                                onSortingChange={(next: any) => {
                                    setSorting(next);
                                    const first = next[0];
                                    if (first) {
                                        const dir = first.desc ? 'desc' : 'asc';
                                        router.get('/phones', { sort: `${first.id}:${dir}`, page: phones.current_page, perPage: phones.per_page }, {
                                            preserveState: true,
                                            replace: true,
                                        });
                                    }
                                }}
                            />
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

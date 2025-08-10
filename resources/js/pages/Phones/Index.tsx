import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { DataTable } from '@/components/data-table';
import { Phone } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

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
    const [perPage, setPerPage] = React.useState<number>(tableState?.perPage ?? phones.per_page ?? 20);

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
                            <div className="hidden mb-4 items-center justify-between gap-4 md:flex">
                                <div className="text-sm text-muted-foreground">
                                    Page {phones.current_page} of {phones.last_page} • {phones.total} total
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm">Rows:</label>
                                    <select
                                        className="rounded-md border bg-background p-1 text-sm"
                                        value={perPage}
                                        onChange={(e) => {
                                            const next = parseInt(e.target.value, 10);
                                            setPerPage(next);
                                            const first: any = (sorting as any)[0] ?? { id: 'name', desc: false };
                                            const dir = first.desc ? 'desc' : 'asc';
                                            router.get(
                                                '/phones',
                                                { sort: `${first.id}:${dir}`, page: 1, perPage: next },
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                    >
                                        {[10, 25, 50, 100].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
                                        disabled={phones.current_page <= 1}
                                        onClick={() => {
                                            const first: any = (sorting as any)[0] ?? { id: 'name', desc: false };
                                            const dir = first.desc ? 'desc' : 'asc';
                                            router.get(
                                                '/phones',
                                                { sort: `${first.id}:${dir}`, page: phones.current_page - 1, perPage },
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                    >
                                        Prev
                                    </button>
                                    <button
                                        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
                                        disabled={phones.current_page >= phones.last_page}
                                        onClick={() => {
                                            const first: any = (sorting as any)[0] ?? { id: 'name', desc: false };
                                            const dir = first.desc ? 'desc' : 'asc';
                                            router.get(
                                                '/phones',
                                                { sort: `${first.id}:${dir}`, page: phones.current_page + 1, perPage },
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                            <DataTable
                                columns={columns}
                                data={phones.data as any}
                                sorting={sorting as any}
                                onSortingChange={(next: any) => {
                                    setSorting(next);
                                    const first = next[0];
                                    if (first) {
                                        const dir = first.desc ? 'desc' : 'asc';
                                        router.get(
                                            '/phones',
                                            { sort: `${first.id}:${dir}`, page: phones.current_page, perPage },
                                            {
                                                preserveState: true,
                                                replace: true,
                                            },
                                        );
                                    }
                                }}
                            />
                            <div className="mt-4 flex items-center justify-between gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Page {phones.current_page} of {phones.last_page} • {phones.total} total
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm">Rows:</label>
                                    <select
                                        className="rounded-md border bg-background p-1 text-sm"
                                        value={perPage}
                                        onChange={(e) => {
                                            const next = parseInt(e.target.value, 10);
                                            setPerPage(next);
                                            const first: any = (sorting as any)[0] ?? { id: 'name', desc: false };
                                            const dir = first.desc ? 'desc' : 'asc';
                                            router.get(
                                                '/phones',
                                                { sort: `${first.id}:${dir}`, page: 1, perPage: next },
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                    >
                                        {[10, 25, 50, 100].map((n) => (
                                            <option key={n} value={n}>
                                                {n}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
                                        disabled={phones.current_page <= 1}
                                        onClick={() => {
                                            const first: any = (sorting as any)[0] ?? { id: 'name', desc: false };
                                            const dir = first.desc ? 'desc' : 'asc';
                                            router.get(
                                                '/phones',
                                                { sort: `${first.id}:${dir}`, page: phones.current_page - 1, perPage },
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                    >
                                        Prev
                                    </button>
                                    <button
                                        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
                                        disabled={phones.current_page >= phones.last_page}
                                        onClick={() => {
                                            const first: any = (sorting as any)[0] ?? { id: 'name', desc: false };
                                            const dir = first.desc ? 'desc' : 'asc';
                                            router.get(
                                                '/phones',
                                                { sort: `${first.id}:${dir}`, page: phones.current_page + 1, perPage },
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

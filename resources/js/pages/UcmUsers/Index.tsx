import { AdvancedSearch, FilterRow } from '@/components/advanced-search';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { DataTable } from '@/components/data-table';
import { Head, router } from '@inertiajs/react';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';
import * as React from 'react';

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
    const [sorting, setSorting] = React.useState(() => {
        const [id, dir] = (tableState?.sort ?? 'userid:asc').split(':');
        return [{ id, desc: dir === 'desc' }];
    });
    const [perPage, setPerPage] = React.useState<number>(tableState?.perPage ?? users.per_page ?? 20);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(tableState?.columnVisibility ?? {});

    const columns: ColumnDef<User & any>[] = [
        {
            accessorKey: 'userid',
            header: 'User ID',
            cell: ({ row }) => <code className="rounded bg-muted px-2 py-1 text-sm">{(row.original as any).userid}</code>,
        },
        {
            accessorKey: 'displayName',
            header: 'Display Name',
            cell: ({ row }) => <div className="font-medium">{(row.original as any).displayName || '-'}</div>,
        },
        {
            accessorKey: 'mailid',
            header: 'Email',
            cell: ({ row }) => (row.original as any).mailid || '-',
        },
        {
            accessorKey: 'ucm.name',
            header: 'UCM',
            cell: ({ row }) => (row.original as any).ucm?.name || '-',
        },
    ];

    const handleColumnVisibilityChange = (updater: VisibilityState) => {
        setColumnVisibility(updater);
        // Column visibility is purely UI state - no need for API calls
    };

    return (
        <AppShell variant="sidebar">
            <Head title="Users" />

            <AppSidebar />

            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />

                <AppContent variant="sidebar">
                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <div className="p-6">
                            <h2 className="mb-6 text-2xl font-semibold">UCM Users</h2>
                            <div className="mb-4">
                                <AdvancedSearch
                                    fields={[
                                        { value: 'userid', label: 'User ID' },
                                        { value: 'displayName', label: 'Display Name' },
                                        { value: 'mailid', label: 'Email' },
                                    ]}
                                    initial={filters}
                                    onApply={(payload) => {
                                        const normalized = {
                                            logic: payload.logic,
                                            filters_json: JSON.stringify(payload.filters),
                                            sort: (sorting as any)[0]
                                                ? `${(sorting as any)[0].id}:${(sorting as any)[0].desc ? 'desc' : 'asc'}`
                                                : 'userid:asc',
                                            page: 1,
                                            perPage,
                                        };
                                        router.get('/ucm-users', normalized, { replace: true, preserveState: true, preserveScroll: true });
                                    }}
                                />
                            </div>
                            <DataTable
                                columns={columns}
                                data={users.data as any}
                                sorting={sorting as any}
                                onSortingChange={(next: any) => {
                                    setSorting(next);
                                    const first = next[0];
                                    if (first) {
                                        const dir = first.desc ? 'desc' : 'asc';
                                        router.get(
                                            '/ucm-users',
                                            {
                                                sort: `${first.id}:${dir}`,
                                                page: users.current_page,
                                                perPage,
                                            },
                                            {
                                                preserveState: true,
                                                replace: true,
                                            },
                                        );
                                    }
                                }}
                                columnVisibility={columnVisibility}
                                onColumnVisibilityChange={handleColumnVisibilityChange}
                            />

                            <div className="mt-4 flex items-center justify-between gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Page {users.current_page} of {users.last_page} • {users.total} total
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-sm">Rows:</label>
                                    <select
                                        className="rounded-md border bg-background p-1 text-sm"
                                        value={perPage}
                                        onChange={(e) => {
                                            const next = parseInt(e.target.value, 10);
                                            setPerPage(next);
                                            const first: any = (sorting as any)[0] ?? { id: 'userid', desc: false };
                                            const dir = first.desc ? 'desc' : 'asc';
                                            router.get(
                                                '/ucm-users',
                                                {
                                                    sort: `${first.id}:${dir}`,
                                                    page: 1,
                                                    perPage: next,
                                                },
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
                                        disabled={users.current_page <= 1}
                                        onClick={() => {
                                            const first: any = (sorting as any)[0] ?? { id: 'userid', desc: false };
                                            const dir = first.desc ? 'desc' : 'asc';
                                            router.get(
                                                '/ucm-users',
                                                {
                                                    sort: `${first.id}:${dir}`,
                                                    page: users.current_page - 1,
                                                    perPage,
                                                },
                                                { preserveState: true, replace: true },
                                            );
                                        }}
                                    >
                                        Prev
                                    </button>
                                    <button
                                        className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
                                        disabled={users.current_page >= users.last_page}
                                        onClick={() => {
                                            const first: any = (sorting as any)[0] ?? { id: 'userid', desc: false };
                                            const dir = first.desc ? 'desc' : 'asc';
                                            router.get(
                                                '/ucm-users',
                                                {
                                                    sort: `${first.id}:${dir}`,
                                                    page: users.current_page + 1,
                                                    perPage,
                                                },
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

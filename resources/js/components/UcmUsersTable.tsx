import { AdvancedSearch, FilterRow } from '@/components/advanced-search';
import { DataTable } from '@/components/data-table';
import { router } from '@inertiajs/react';
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
    tableState?: { sort: string; perPage: number; columnVisibility?: VisibilityState };
    filters?: { applied?: FilterRow[]; logic?: 'and' | 'or' };
    baseUrl: string;
    title?: string;
    showSearch?: boolean;
}

export function UcmUsersTable({
    users,
    tableState,
    filters,
    baseUrl,
    title = 'UCM Users',
    showSearch = true,
}: Props) {
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

    const makeRequest = (params: Record<string, any>) => {
        router.get(baseUrl, params, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
        });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">{title}</h3>
            
            {showSearch && (
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
                        makeRequest(normalized);
                    }}
                />
            )}

            <DataTable
                columns={columns}
                data={users.data as any}
                sorting={sorting as any}
                onSortingChange={(next: any) => {
                    setSorting(next);
                    const first = next[0];
                    if (first) {
                        const dir = first.desc ? 'desc' : 'asc';
                        makeRequest({
                            sort: `${first.id}:${dir}`,
                            page: users.current_page,
                            perPage,
                        });
                    }
                }}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={handleColumnVisibilityChange}
            />

            <div className="flex items-center justify-between gap-4">
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
                            makeRequest({
                                sort: `${first.id}:${dir}`,
                                page: 1,
                                perPage: next,
                            });
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
                            makeRequest({
                                sort: `${first.id}:${dir}`,
                                page: users.current_page - 1,
                                perPage,
                            });
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
                            makeRequest({
                                sort: `${first.id}:${dir}`,
                                page: users.current_page + 1,
                                perPage,
                            });
                        }}
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
}

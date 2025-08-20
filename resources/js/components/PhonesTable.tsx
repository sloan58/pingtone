import { AdvancedSearch, FilterRow } from '@/components/advanced-search';
import { DataTable } from '@/components/data-table';
import { Phone } from '@/types';
import { Link, router } from '@inertiajs/react';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';
import * as React from 'react';

interface Props {
    phones: {
        data: Phone[];
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
    showActions?: boolean;
}

export function PhonesTable({
    phones,
    tableState,
    filters,
    baseUrl,
    title = 'Phones',
    showSearch = true,
    showActions = true,
}: Props) {
    const [sorting, setSorting] = React.useState(() => {
        const [id, dir] = (tableState?.sort ?? 'name:asc').split(':');
        return [{ id, desc: dir === 'desc' }];
    });
    const [perPage, setPerPage] = React.useState<number>(tableState?.perPage ?? phones.per_page ?? 20);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(tableState?.columnVisibility ?? {});

    const columns: ColumnDef<Phone & any>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => {
                const name = (row.original as any).name;
                return showActions ? (
                    <Link href={`/phones/${(row.original as any).id}/edit`} className="text-primary hover:underline">
                        {name}
                    </Link>
                ) : (
                    <span className="font-medium">{name}</span>
                );
            },
        },
        {
            accessorKey: 'description',
            header: 'Description',
            cell: (info) => (info.getValue() as string) || '-'
        },
        {
            accessorKey: 'model',
            header: 'Model',
            cell: (info) => (info.getValue() as string) || '-'
        },
        {
            accessorKey: 'devicePoolName',
            header: 'Device Pool',
            cell: ({ row }) => {
                const devicePool = (row.original as any).devicePoolName || (row.original as any).device_pool_name || '';
                return typeof devicePool === 'string' ? devicePool : devicePool?.name || devicePool?._ || devicePool?.value || '-';
            },
        },
        {
            accessorKey: 'callingSearchSpaceName._',
            header: 'Calling Search Space',
            cell: ({ row }) => {
                const css = (row.original as any).callingSearchSpaceName;
                return typeof css === 'string' ? css : css?._ || '-';
            },
        },
        {
            accessorKey: 'ucm.name',
            header: 'UCM',
            cell: ({ row }) => {
                const ucm = (row.original as any).ucm;
                return ucm?.name || '-';
            },
        },
    ];

    // Add actions column only if showActions is true
    if (showActions) {
        columns.push({
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <Link href={`/phones/${(row.original as any).id}/edit`} className="text-primary hover:underline">
                    Edit
                </Link>
            ),
        });
    }

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
                        { value: 'name', label: 'Name' },
                        { value: 'description', label: 'Description' },
                        { value: 'model', label: 'Model' },
                        { value: 'devicePoolName', label: 'Device Pool' },
                        { value: 'callingSearchSpaceName._', label: 'Calling Search Space' },
                        { value: 'ucm_cluster_id', label: 'UCM' },
                    ]}
                    initial={filters}
                    onApply={(payload) => {
                        const normalized = {
                            logic: payload.logic,
                            filters_json: JSON.stringify(payload.filters),
                            sort: (sorting as any)[0]
                                ? `${(sorting as any)[0].id}:${(sorting as any)[0].desc ? 'desc' : 'asc'}`
                                : 'name:asc',
                            page: 1,
                            perPage,
                        };
                        makeRequest(normalized);
                    }}
                />
            )}

            <DataTable
                columns={columns}
                data={phones.data as any}
                sorting={sorting as any}
                onSortingChange={(next: any) => {
                    setSorting(next);
                    const first = next[0];
                    if (first) {
                        const dir = first.desc ? 'desc' : 'asc';
                        makeRequest({
                            sort: `${first.id}:${dir}`,
                            page: phones.current_page,
                            perPage,
                        });
                    }
                }}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={handleColumnVisibilityChange}
            />

            <div className="flex items-center justify-between gap-4">
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
                        disabled={phones.current_page <= 1}
                        onClick={() => {
                            const first: any = (sorting as any)[0] ?? { id: 'name', desc: false };
                            const dir = first.desc ? 'desc' : 'asc';
                            makeRequest({
                                sort: `${first.id}:${dir}`,
                                page: phones.current_page - 1,
                                perPage,
                            });
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
                            makeRequest({
                                sort: `${first.id}:${dir}`,
                                page: phones.current_page + 1,
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

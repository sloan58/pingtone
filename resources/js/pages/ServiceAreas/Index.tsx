import { AdvancedSearch, FilterRow } from '@/components/advanced-search';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef, VisibilityState } from '@tanstack/react-table';
import { Edit, MapPin, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';

interface ServiceArea {
    id: number;
    name: string;
    userFilter?: {
        field: string;
        regex: string;
    } | null;
    ucm_users_count?: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    serviceAreas: {
        data: ServiceArea[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
}

export default function ServiceAreasIndex({
    serviceAreas,
    tableState,
    filters,
}: Props & {
    tableState?: { sort: string; perPage: number; columnVisibility?: VisibilityState };
    filters?: { applied?: FilterRow[]; logic?: 'and' | 'or' };
}) {
    useToast();

    const [sorting, setSorting] = React.useState(() => {
        const [id, dir] = (tableState?.sort ?? 'name:asc').split(':');
        return [{ id, desc: dir === 'desc' }];
    });
    const [perPage, setPerPage] = React.useState<number>(tableState?.perPage ?? serviceAreas.per_page ?? 20);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(tableState?.columnVisibility ?? {});

    const handleDelete = (serviceAreaId: number) => {
        router.delete(`/service-areas/${serviceAreaId}`);
    };

    const columns: ColumnDef<ServiceArea & any>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => (
                <Link href={`/service-areas/${(row.original as any).id}/edit`} className="font-medium text-primary hover:underline">
                    {(row.original as any).name}
                </Link>
            ),
        },
        {
            accessorKey: 'userFilter',
            header: 'User Filter',
            cell: ({ row }) => {
                const filters = (row.original as any).userFilter;
                if (!filters || !filters.field || !filters.regex) {
                    return <span className="text-sm text-muted-foreground">No filters</span>;
                }
                const fieldLabel = filters.field === 'mailid' ? 'Email' : 'Phone';
                return (
                    <div className="text-sm">
                        <div className="font-medium">{fieldLabel}</div>
                        <code className="text-xs text-muted-foreground">{filters.regex}</code>
                    </div>
                );
            },
        },
        {
            accessorKey: 'ucm_users_count',
            header: 'Assigned Users',
            cell: ({ row }) => {
                const count = (row.original as any).ucm_users_count || 0;
                return (
                    <div className="text-sm">
                        <span className="font-medium">{count}</span>
                        <span className="ml-1 text-muted-foreground">users</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'created_at',
            header: 'Created',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">{new Date((row.original as any).created_at).toLocaleDateString()}</span>
            ),
        },
        {
            accessorKey: 'updated_at',
            header: 'Updated',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">{new Date((row.original as any).updated_at).toLocaleDateString()}</span>
            ),
        },
        {
            id: 'actions',
            header: 'Actions',
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={`/service-areas/${(row.original as any).id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete((row.original as any).id)}
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    const handleColumnVisibilityChange = (updater: VisibilityState) => {
        setColumnVisibility(updater);
    };

    return (
        <AppShell variant="sidebar">
            <Head title="Service Areas" />

            <AppSidebar />

            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />

                <AppContent variant="sidebar">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Service Areas</h1>
                                <p className="text-muted-foreground">Manage your service areas for organizing services and locations.</p>
                            </div>
                            <Button asChild>
                                <Link href="/service-areas/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Service Area
                                </Link>
                            </Button>
                        </div>

                        {/* Data Table */}
                        <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                            <div className="p-6">
                                <h2 className="mb-6 text-2xl font-semibold">Service Areas</h2>

                                {/* Advanced Search */}
                                <div className="mb-4">
                                    <AdvancedSearch
                                        fields={[
                                            { value: 'name', label: 'Name' },
                                            { value: 'userFilter.field', label: 'Filter Field' },
                                            { value: 'userFilter.regex', label: 'Filter Pattern' },
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
                                            router.get('/service-areas', normalized, { replace: true, preserveState: true, preserveScroll: true });
                                        }}
                                    />
                                </div>

                                {/* Empty State */}
                                {serviceAreas.data.length === 0 && (!filters?.applied || filters.applied.length === 0) ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="mb-2 text-lg font-semibold">No Service Areas</h3>
                                        <p className="mb-4 text-muted-foreground">Get started by creating your first service area.</p>
                                        <Button asChild>
                                            <Link href="/service-areas/create">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Service Area
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <DataTable
                                            columns={columns}
                                            data={serviceAreas.data as any}
                                            sorting={sorting as any}
                                            onSortingChange={(next: any) => {
                                                setSorting(next);
                                                const first = next[0];
                                                if (first) {
                                                    const dir = first.desc ? 'desc' : 'asc';
                                                    router.get(
                                                        '/service-areas',
                                                        {
                                                            sort: `${first.id}:${dir}`,
                                                            page: serviceAreas.current_page,
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

                                        {/* Pagination */}
                                        <div className="mt-4 flex items-center justify-between gap-4">
                                            <div className="text-sm text-muted-foreground">
                                                Page {serviceAreas.current_page} of {serviceAreas.last_page} • {serviceAreas.total} total
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
                                                            '/service-areas',
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
                                                    disabled={serviceAreas.current_page <= 1}
                                                    onClick={() => {
                                                        const first: any = (sorting as any)[0] ?? { id: 'name', desc: false };
                                                        const dir = first.desc ? 'desc' : 'asc';
                                                        router.get(
                                                            '/service-areas',
                                                            {
                                                                sort: `${first.id}:${dir}`,
                                                                page: serviceAreas.current_page - 1,
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
                                                    disabled={serviceAreas.current_page >= serviceAreas.last_page}
                                                    onClick={() => {
                                                        const first: any = (sorting as any)[0] ?? { id: 'name', desc: false };
                                                        const dir = first.desc ? 'desc' : 'asc';
                                                        router.get(
                                                            '/service-areas',
                                                            {
                                                                sort: `${first.id}:${dir}`,
                                                                page: serviceAreas.current_page + 1,
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
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

import { AdvancedSearch, FilterRow } from '@/components/advanced-search';
import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import * as React from 'react';

interface User {
    _id: string;
    name: string;
    userid: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    enableMobility?: boolean;
    enableExtensionMobility?: boolean;
    enableMobileVoiceAccess?: boolean;
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
}: Props & { tableState?: { sort: string; perPage: number }; filters?: { applied?: FilterRow[]; logic?: 'and' | 'or' } }) {
    const [sorting, setSorting] = React.useState(() => {
        const [id, dir] = (tableState?.sort ?? 'name:asc').split(':');
        return [{ id, desc: dir === 'desc' }];
    });
    const [perPage, setPerPage] = React.useState<number>(tableState?.perPage ?? users.per_page ?? 20);

    const columns: ColumnDef<User & any>[] = [
        {
            accessorKey: 'name',
            header: 'Name',
            cell: ({ row }) => {
                const user = row.original as any;
                return (
                    <div>
                        <div className="font-medium">{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}</div>
                        {user.firstName && user.lastName && (
                            <div className="text-sm text-muted-foreground">
                                {user.firstName} {user.lastName}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'userid',
            header: 'User ID',
            cell: ({ row }) => <code className="rounded bg-muted px-2 py-1 text-sm">{(row.original as any).userid}</code>,
        },
        {
            accessorKey: 'department',
            header: 'Department',
            cell: ({ row }) => (row.original as any).department || '-',
        },
        {
            accessorKey: 'ucm.name',
            header: 'UCM',
            cell: ({ row }) => (row.original as any).ucm?.name || '-',
        },
        {
            accessorKey: 'features',
            header: 'Features',
            cell: ({ row }) => {
                const user = row.original as any;
                return (
                    <div className="flex gap-1">
                        {user.enableMobility && (
                            <Badge variant="secondary" className="text-xs">
                                Mobility
                            </Badge>
                        )}
                        {user.enableExtensionMobility && (
                            <Badge variant="secondary" className="text-xs">
                                EM
                            </Badge>
                        )}
                        {user.enableMobileVoiceAccess && (
                            <Badge variant="secondary" className="text-xs">
                                MVA
                            </Badge>
                        )}
                    </div>
                );
            },
        },
    ];

    return (
        <AppShell variant="sidebar">
            <Head title="Users" />

            <AppSidebar />

            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />

                <AppContent variant="sidebar">
                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <div className="p-6">
                            <h2 className="mb-6 text-2xl font-semibold">Users</h2>
                            <div className="mb-4">
                                <AdvancedSearch
                                    fields={[
                                        { value: 'name', label: 'Name' },
                                        { value: 'userid', label: 'User ID' },
                                        { value: 'firstName', label: 'First Name' },
                                        { value: 'lastName', label: 'Last Name' },
                                        { value: 'department', label: 'Department' },
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
                                        router.get('/ucm-users', normalized, { replace: true, preserveState: true, preserveScroll: true });
                                    }}
                                />
                            </div>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>User ID</TableHead>
                                            <TableHead>Department</TableHead>
                                            <TableHead>UCM</TableHead>
                                            <TableHead>Features</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.data.map((user) => (
                                            <TableRow key={user._id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim()}
                                                        </div>
                                                        {user.firstName && user.lastName && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="rounded bg-muted px-2 py-1 text-sm">{user.userid}</code>
                                                </TableCell>
                                                <TableCell>{user.department || '-'}</TableCell>
                                                <TableCell>{user.ucm.name}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        {user.enableMobility && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Mobility
                                                            </Badge>
                                                        )}
                                                        {user.enableExtensionMobility && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                EM
                                                            </Badge>
                                                        )}
                                                        {user.enableMobileVoiceAccess && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                MVA
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {users.last_page > 1 && (
                                <div className="flex items-center justify-between space-x-2 py-4">
                                    <div className="text-sm text-muted-foreground">
                                        Showing {(users.current_page - 1) * users.per_page + 1} to{' '}
                                        {Math.min(users.current_page * users.per_page, users.total)} of {users.total} results
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {Array.from({ length: users.last_page }, (_, i) => i + 1).map((page) => (
                                            <Link
                                                key={page}
                                                href={`/ucm-users?page=${page}`}
                                                className={`rounded-md px-3 py-2 text-sm ${
                                                    page === users.current_page ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                                                }`}
                                                preserveScroll
                                            >
                                                {page}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { CheckCircle, Edit, Eye, History, Loader2, MoreHorizontal, RefreshCw, Server, Trash2, XCircle } from 'lucide-react';

interface Ucm {
    id: number;
    name: string;
    hostname: string;
    username: string;
    schema_version: string;
    version: string | null;
    last_sync_at: string | null;
    sync_status: string;
    latest_sync_status: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    ucms: Ucm[];
}

export default function UcmIndex({ ucms }: Props) {
    useToast(); // Add toast hook

    const handleDelete = (ucmId: number) => {
        router.delete(`/ucm/${ucmId}`);
    };

    const getSyncStatusIcon = (status: string | null) => {
        switch (status) {
            case 'syncing':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return null;
        }
    };

    const getSyncStatusBadge = (status: string | null) => {
        switch (status) {
            case 'syncing':
                return (
                    <Badge variant="outline" className="text-blue-600">
                        Syncing...
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge variant="default" className="bg-green-600">
                        Completed
                    </Badge>
                );
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="outline">{ucms.find((u) => u.latest_sync_status === status)?.sync_status || 'Never Synced'}</Badge>;
        }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">UCM Servers</h1>
                        <p className="text-muted-foreground">Manage your Cisco Unified Communications Manager servers.</p>
                    </div>
                    <Button asChild>
                        <Link href="/ucm/create">Add UCM Server</Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{ucms.length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Synced Today</CardTitle>
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{ucms.filter((u) => u.sync_status === 'Synced Today').length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Currently Syncing</CardTitle>
                            <Loader2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{ucms.filter((u) => u.latest_sync_status === 'syncing').length}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{ucms.filter((u) => u.latest_sync_status === 'failed').length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* UCM Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>UCM Servers</CardTitle>
                        <CardDescription>A list of all your UCM servers and their sync status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Hostname</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Sync Status</TableHead>
                                    <TableHead>Last Sync</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ucms.map((ucm) => (
                                    <TableRow key={ucm.id}>
                                        <TableCell className="font-medium">{ucm.name}</TableCell>
                                        <TableCell>{ucm.hostname}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Badge variant="outline">{ucm.schema_version}</Badge>
                                                {ucm.version && <Badge variant="secondary">{ucm.version}</Badge>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                {getSyncStatusIcon(ucm.latest_sync_status)}
                                                {getSyncStatusBadge(ucm.latest_sync_status)}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {ucm.last_sync_at ? (
                                                <span className="text-sm text-muted-foreground">
                                                    {new Date(ucm.last_sync_at).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Never</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/ucm/${ucm.id}`}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/ucm/${ucm.id}/edit`}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/ucm/${ucm.id}/sync-history`}>
                                                            <History className="mr-2 h-4 w-4" />
                                                            Sync History
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" className="h-auto w-full justify-start p-2">
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Delete
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Delete UCM Server</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        Are you sure you want to delete "{ucm.name}"? This action cannot be undone.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={() => handleDelete(ucm.id)}>Delete</AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

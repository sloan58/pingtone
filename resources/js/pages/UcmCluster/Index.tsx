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
import { CheckCircle, Edit, Layers, Loader2, MoreHorizontal, RefreshCw, Trash2, XCircle } from 'lucide-react';

interface UcmNode {
    id: number;
    name: string;
    hostname: string;
    node_role: string | null;
    version: string | null;
    created_at: string;
    updated_at: string;
}

interface UcmCluster {
    id: number;
    name: string;
    sync_status: string;
    latest_sync_status: string | null;
    last_sync_at: string | null;
    ucm_nodes: UcmNode[];
    created_at: string;
    updated_at: string;
}

interface Props {
    clusters: UcmCluster[];
}

export default function UcmClusterIndex({ clusters }: Props) {
    useToast(); // Add toast hook

    const handleDelete = (clusterId: number) => {
        router.delete(`/ucm-clusters/${clusterId}`);
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

    const getSyncStatusBadge = (status: string | null, syncStatus: string) => {
        switch (status) {
            case 'syncing':
                return (
                    <Badge variant="outline" className="text-blue-600">
                        Syncing...
                    </Badge>
                );
            case 'completed':
                return (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        Completed
                    </Badge>
                );
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="outline">{syncStatus || 'Never Synced'}</Badge>;
        }
    };

    const getTotalNodes = () => clusters.reduce((total, cluster) => total + cluster.ucm_nodes.length, 0);
    const getSyncedToday = () =>
        clusters.filter((cluster) => {
            if (!cluster.last_sync_at) return false;
            const lastSync = new Date(cluster.last_sync_at);
            const today = new Date();
            return lastSync.toDateString() === today.toDateString();
        }).length;
    const getCurrentlySyncing = () => clusters.filter((cluster) => cluster.latest_sync_status === 'syncing').length;
    const getFailedSyncs = () => clusters.filter((cluster) => cluster.latest_sync_status === 'failed').length;

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">UCM Clusters</h1>
                        <p className="text-muted-foreground">Manage your Cisco Unified Communications Manager clusters.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href="/ucm-clusters/wizard">Cluster Onboarding Wizard</Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Clusters</CardTitle>
                            <Layers className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{clusters.length}</div>
                            <p className="text-xs text-muted-foreground">{getTotalNodes()} total nodes</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Synced Today</CardTitle>
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{getSyncedToday()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Currently Syncing</CardTitle>
                            <Loader2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{getCurrentlySyncing()}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Failed Syncs</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{getFailedSyncs()}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Clusters Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>UCM Clusters</CardTitle>
                        <CardDescription>A list of all your UCM clusters and their sync status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cluster Name</TableHead>
                                    <TableHead>Nodes</TableHead>
                                    <TableHead>Publisher</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Sync Status</TableHead>
                                    <TableHead>Last Sync</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clusters.map((cluster) => {
                                    const publisherNode = cluster.ucm_nodes.find((node) => node.node_role === 'Publisher');
                                    return (
                                        <TableRow key={cluster.id}>
                                            <TableCell className="font-medium">
                                                <Link href={`/ucm-clusters/${cluster.id}`} className="text-primary hover:underline">
                                                    {cluster.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary">{cluster.ucm_nodes.length} nodes</Badge>
                                                    <div className="flex gap-1">
                                                        {cluster.ucm_nodes.map((node) => (
                                                            <Badge
                                                                key={node.id}
                                                                variant={node.node_role === 'Publisher' ? 'default' : 'outline'}
                                                                className="text-xs"
                                                            >
                                                                {node.node_role?.charAt(0) || 'N'}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {publisherNode ? (
                                                    <div>
                                                        <div className="font-medium">{publisherNode.name}</div>
                                                        <div className="text-sm text-muted-foreground">{publisherNode.hostname}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No publisher</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {publisherNode?.version ? (
                                                    <Badge variant="secondary">{publisherNode.version}</Badge>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">Not detected</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {getSyncStatusIcon(cluster.latest_sync_status)}
                                                    {getSyncStatusBadge(cluster.latest_sync_status, cluster.sync_status)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {cluster.last_sync_at ? (
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(cluster.last_sync_at).toLocaleDateString()}
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
                                                            <Link href={`/ucm-clusters/${cluster.id}`}>
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                View Details
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                router.post(`/ucm-clusters/${cluster.id}/sync`);
                                                            }}
                                                        >
                                                            <RefreshCw className="mr-2 h-4 w-4" />
                                                            Start Sync
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
                                                                        <AlertDialogTitle>Delete UCM Cluster</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Are you sure you want to delete cluster "{cluster.name}"? This will also
                                                                            delete all associated nodes and cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={() => handleDelete(cluster.id)}>
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

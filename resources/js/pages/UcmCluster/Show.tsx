import SqlQueryInterface from '@/components/SqlQueryInterface';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Database, Layers, Loader2, RefreshCw, Save, Server, Settings, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';

interface UcmNode {
    id: number;
    name: string;
    hostname: string;
    node_role: string | null;
    version: string | null;
    username?: string;
    schema_version?: string;
    ssh_username?: string;
    created_at: string;
    updated_at: string;
}

interface SyncHistory {
    id: number;
    sync_start_time: string;
    sync_end_time: string | null;
    status: string;
    error: string | null;
}

interface UcmCluster {
    id: number;
    name: string;
    username: string;
    schema_version: string;
    ssh_username: string | null;
    sync_status: string;
    latest_sync_status: string | null;
    has_active_sync: boolean;
    created_at: string;
    updated_at: string;
    ucm_nodes: UcmNode[];
    sync_history: SyncHistory[];
}

interface Props {
    cluster: UcmCluster;
    apiVersions: { [key: string]: string };
}

export default function Show({ cluster, apiVersions }: Props) {
    useToast(); // Add toast hook to handle server flash messages
    
    // Initialize tab from URL hash or default to cluster-overview
    const getInitialTab = () => {
        const hash = window.location.hash.replace('#', '');
        return hash === 'sql-queries' ? 'sql-queries' : 'cluster-overview';
    };
    
    const [activeTab, setActiveTab] = useState(getInitialTab);
    
    // Update URL hash when tab changes
    const handleTabChange = (value: string) => {
        setActiveTab(value);
        window.history.replaceState(null, '', `#${value}`);
    };
    
    // Listen for hash changes (back/forward navigation)
    useEffect(() => {
        const handleHashChange = () => {
            setActiveTab(getInitialTab());
        };
        
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const { data, setData, put, processing, errors } = useForm({
        name: cluster.name,
        username: cluster.username || '',
        password: '',
        schema_version: cluster.schema_version || '',
        ssh_username: cluster.ssh_username || '',
        ssh_password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/ucm-clusters/${cluster.id}`);
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        Completed
                    </Badge>
                );
            case 'syncing':
                return <Badge variant="secondary">Syncing</Badge>;
            case 'failed':
                return <Badge variant="destructive">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getRoleBadge = (role: string | null) => {
        if (!role) return <Badge variant="outline">Unknown</Badge>;

        switch (role.toLowerCase()) {
            case 'publisher':
                return <Badge variant="default">Publisher</Badge>;
            case 'subscriber':
                return <Badge variant="secondary">Subscriber</Badge>;
            default:
                return <Badge variant="outline">{role}</Badge>;
        }
    };

    return (
        <AppLayout>
            <Head title={`Cluster: ${cluster.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/ucm-clusters">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Clusters
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center space-x-2">
                                <Layers className="h-6 w-6 text-muted-foreground" />
                                <h1 className="text-3xl font-bold tracking-tight">{cluster.name}</h1>
                            </div>
                            <p className="text-muted-foreground">Cluster created on {new Date(cluster.created_at).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {cluster.has_active_sync || cluster.latest_sync_status === 'syncing' ? (
                            <Button disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Syncing...
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link href={`/ucm-clusters/${cluster.id}/sync`} method="post" as="button">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Start Sync
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Main Content with Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="cluster-overview" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Cluster Overview
                        </TabsTrigger>
                        <TabsTrigger value="sql-queries" className="flex items-center gap-2">
                            <Database className="h-4 w-4" />
                            SQL Queries
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="cluster-overview" className="space-y-6">
                        {/* Cluster Info */}
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Nodes</CardTitle>
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{cluster.ucm_nodes.length}</div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Publisher Nodes</CardTitle>
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {cluster.ucm_nodes.filter((node) => node.node_role === 'Publisher').length}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Subscriber Nodes</CardTitle>
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {cluster.ucm_nodes.filter((node) => node.node_role === 'Subscriber').length}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Cluster Settings */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Cluster Settings</CardTitle>
                                <CardDescription>Update cluster name and connection settings for all nodes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Cluster Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Cluster Name</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g., Production UCM Cluster"
                                            />
                                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                        </div>

                                        {/* API Version */}
                                        <div className="space-y-2">
                                            <Label htmlFor="schema_version">API Version</Label>
                                            <Select value={data.schema_version} onValueChange={(value) => setData('schema_version', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select API version" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {Object.entries(apiVersions).map(([version, description]) => (
                                                        <SelectItem key={version} value={version}>
                                                            {version} - {description}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.schema_version && <p className="text-sm text-destructive">{errors.schema_version}</p>}
                                        </div>

                                        {/* API Username */}
                                        <div className="space-y-2">
                                            <Label htmlFor="username">API Username</Label>
                                            <Input
                                                id="username"
                                                value={data.username}
                                                onChange={(e) => setData('username', e.target.value)}
                                                placeholder="e.g., admin"
                                            />
                                            {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                                        </div>

                                        {/* API Password */}
                                        <div className="space-y-2">
                                            <Label htmlFor="password">API Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="Leave blank to keep current password"
                                            />
                                            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                                        </div>

                                        {/* SSH Username */}
                                        <div className="space-y-2">
                                            <Label htmlFor="ssh_username">SSH Username (Optional)</Label>
                                            <Input
                                                id="ssh_username"
                                                value={data.ssh_username}
                                                onChange={(e) => setData('ssh_username', e.target.value)}
                                                placeholder="Leave blank to use API username"
                                            />
                                            {errors.ssh_username && <p className="text-sm text-destructive">{errors.ssh_username}</p>}
                                        </div>

                                        {/* SSH Password */}
                                        <div className="space-y-2">
                                            <Label htmlFor="ssh_password">SSH Password (Optional)</Label>
                                            <Input
                                                id="ssh_password"
                                                type="password"
                                                value={data.ssh_password}
                                                onChange={(e) => setData('ssh_password', e.target.value)}
                                                placeholder="Leave blank to use API password"
                                            />
                                            {errors.ssh_password && <p className="text-sm text-destructive">{errors.ssh_password}</p>}
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Updating...' : 'Update Cluster Settings'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Nodes Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Cluster Nodes</CardTitle>
                                <CardDescription>All nodes in this UCM cluster</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Hostname</TableHead>
                                            <TableHead>Role</TableHead>
                                            <TableHead>Version</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {cluster.ucm_nodes.map((node) => (
                                            <TableRow key={node.id}>
                                                <TableCell className="font-medium">{node.name}</TableCell>
                                                <TableCell>{node.hostname}</TableCell>
                                                <TableCell>{getRoleBadge(node.node_role)}</TableCell>
                                                <TableCell>{node.version || 'Unknown'}</TableCell>
                                                <TableCell>
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link href={`/ucm-nodes/${node.id}`}>
                                                            <Terminal className="mr-2 h-4 w-4" />
                                                            SSH Terminal
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Recent Sync History */}
                        {cluster.sync_history.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Sync History</CardTitle>
                                    <CardDescription>Last 10 sync operations for this cluster</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Start Time</TableHead>
                                                <TableHead>End Time</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Error</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cluster.sync_history.map((sync) => (
                                                <TableRow key={sync.id}>
                                                    <TableCell>{new Date(sync.sync_start_time).toLocaleString()}</TableCell>
                                                    <TableCell>
                                                        {sync.sync_end_time ? new Date(sync.sync_end_time).toLocaleString() : 'In Progress'}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(sync.status)}</TableCell>
                                                    <TableCell className="max-w-xs truncate">{sync.error || '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="sql-queries">
                        <SqlQueryInterface ucmId={cluster.id} version={cluster.schema_version || 'Unknown'} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

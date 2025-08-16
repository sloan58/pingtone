import SSHTerminalComponent from '@/components/SSHTerminal';
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
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, History, Loader2, RefreshCw, Save, Settings, Terminal, XCircle } from 'lucide-react';
import { useState } from 'react';

interface Ucm {
    id: number;
    name: string;
    hostname: string;
    username: string;
    password?: string;
    schema_version: string | null;
    version: string | null;
    last_sync_at: string | null;
}

interface SyncHistoryEntry {
    id: number;
    sync_start_time: string;
    sync_end_time: string | null;
    status: 'syncing' | 'completed' | 'failed';
    error: string | null;
    formatted_duration: string | null;
    created_at: string;
}

interface ApiVersion {
    [key: string]: string;
}

interface Props {
    ucm: Ucm;
    apiVersions: ApiVersion;
    syncHistory: SyncHistoryEntry[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'UCM Servers',
        href: '/ucm',
    },
    {
        title: 'Edit UCM Server',
        href: '/ucm/edit',
    },
];

export default function UcmEdit({ ucm, apiVersions, syncHistory }: Props) {
    useToast(); // Add toast hook
    const [activeTab, setActiveTab] = useState('server-details');

    const { data, setData, put, processing, errors } = useForm({
        name: ucm.name,
        hostname: ucm.hostname,
        username: ucm.username,
        password: '',
        schema_version: ucm.schema_version || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/ucm/${ucm.id}`);
    };

    const getSyncStatusIcon = (status: string) => {
        switch (status) {
            case 'syncing':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <RefreshCw className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getSyncStatusBadge = (status: string) => {
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
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit UCM Server" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit UCM Server</h1>
                        <p className="text-muted-foreground">Update the connection details for your UCM server</p>
                    </div>
                    <Button variant="outline" asChild>
                        <a href="/ucm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to UCM Servers
                        </a>
                    </Button>
                </div>

                {/* Main Content with Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="server-details" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Server Details
                        </TabsTrigger>
                        <TabsTrigger value="remote-connection" className="flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            Remote Connection
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="server-details" className="space-y-6">
                        {/* Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>UCM Server Details</CardTitle>
                                <CardDescription>Update the connection details for your UCM server</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Name</Label>
                                            <Input
                                                id="name"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g., Production UCM"
                                            />
                                            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                        </div>

                                        {/* Hostname */}
                                        <div className="space-y-2">
                                            <Label htmlFor="hostname">Hostname / IP Address</Label>
                                            <Input
                                                id="hostname"
                                                value={data.hostname}
                                                onChange={(e) => setData('hostname', e.target.value)}
                                                placeholder="e.g., cucm.company.com or 192.168.1.100"
                                            />
                                            {errors.hostname && <p className="text-sm text-destructive">{errors.hostname}</p>}
                                        </div>

                                        {/* Username */}
                                        <div className="space-y-2">
                                            <Label htmlFor="username">Username</Label>
                                            <Input
                                                id="username"
                                                value={data.username}
                                                onChange={(e) => setData('username', e.target.value)}
                                                placeholder="e.g., admin"
                                            />
                                            {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                                        </div>

                                        {/* Password */}
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password</Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="Leave blank to keep current password"
                                            />
                                            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                                        </div>

                                        {/* Schema Version */}
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
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={processing}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Updating...' : 'Update UCM Server'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Sync Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Synchronization</CardTitle>
                                <CardDescription>Manage data synchronization with this UCM server</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Current Status */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Current Version</Label>
                                        <div className="flex items-center space-x-2">
                                            {ucm.version ? (
                                                <Badge variant="secondary">{ucm.version}</Badge>
                                            ) : (
                                                <span className="text-sm text-muted-foreground">Not detected</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium">Last Sync</Label>
                                        <div className="text-sm text-muted-foreground">
                                            {ucm.last_sync_at ? new Date(ucm.last_sync_at).toLocaleString() : 'Never'}
                                        </div>
                                    </div>
                                </div>

                                {/* Sync Actions */}
                                <div className="flex items-center space-x-4">
                                    <Button
                                        onClick={() => {
                                            router.post(`/ucm/${ucm.id}/sync`);
                                        }}
                                        variant="outline"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Start Sync
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            router.post(`/ucm/${ucm.id}/test-connection`);
                                        }}
                                        variant="outline"
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Test Connection
                                    </Button>
                                </div>

                                {/* Sync History Table */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium">Recent Sync History</h4>
                                    </div>
                                    {syncHistory.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <History className="mb-2 h-8 w-8 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">No sync operations yet</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead>Started</TableHead>
                                                    <TableHead>Duration</TableHead>
                                                    <TableHead>Error</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {syncHistory.map((entry) => (
                                                    <TableRow key={entry.id}>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-2">
                                                                {getSyncStatusIcon(entry.status)}
                                                                {getSyncStatusBadge(entry.status)}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm">{new Date(entry.sync_start_time).toLocaleString()}</div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm text-muted-foreground">
                                                                {entry.formatted_duration || 'In Progress...'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {entry.error ? (
                                                                <div className="max-w-xs truncate text-sm text-red-600" title={entry.error}>
                                                                    {entry.error}
                                                                </div>
                                                            ) : (
                                                                <span className="text-sm text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="remote-connection">
                        <SSHTerminalComponent
                            ucmId={ucm.id}
                            ucmHost={ucm.hostname}
                            ucmUsername={ucm.ssh_username || ucm.username}
                            ucmPassword={ucm.ssh_password || ucm.password || ''}
                            ucmPort={ucm.ssh_port || 22}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

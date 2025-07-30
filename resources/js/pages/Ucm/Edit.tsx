import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, History, RefreshCw, Save } from 'lucide-react';

interface Ucm {
    id: number;
    name: string;
    hostname: string;
    username: string;
    schema_version: string | null;
    version: string | null;
    last_sync_at: string | null;
}

interface ApiVersion {
    [key: string]: string;
}

interface Props {
    ucm: Ucm;
    apiVersions: ApiVersion;
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

export default function UcmEdit({ ucm, apiVersions }: Props) {
    useToast(); // Add toast hook

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
                            <Button variant="outline" asChild>
                                <a href={`/ucm/${ucm.id}/sync-history`}>
                                    <History className="mr-2 h-4 w-4" />
                                    View Sync History
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

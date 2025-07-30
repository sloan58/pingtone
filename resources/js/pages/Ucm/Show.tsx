import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Database, Edit, Hash, History, Loader2, Phone, RefreshCw, XCircle } from 'lucide-react';

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
    ucm: Ucm;
}

export default function UcmShow({ ucm }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'UCM Servers',
            href: '/ucm',
        },
        {
            title: ucm.name,
            href: `/ucm/${ucm.id}`,
        },
    ];

    const getSyncStatusIcon = (status: string | null) => {
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
                return <Badge variant="outline">{ucm.sync_status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`UCM Server - ${ucm.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{ucm.name}</h1>
                        <p className="text-muted-foreground">UCM Server Details</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" asChild>
                            <Link href="/ucm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to UCM Servers
                            </Link>
                        </Button>
                        <Button asChild>
                            <Link href={`/ucm/${ucm.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Schema Version</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{ucm.schema_version}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{ucm.sync_status}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Details */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connection Details</CardTitle>
                            <CardDescription>Network and authentication information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Hostname</span>
                                <span className="text-sm text-muted-foreground">{ucm.hostname}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Username</span>
                                <span className="text-sm text-muted-foreground">{ucm.username}</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Schema Version</span>
                                    <Badge variant="outline">{ucm.schema_version}</Badge>
                                </div>
                                {ucm.version && (
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Version</span>
                                        <Badge variant="secondary">{ucm.version}</Badge>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Sync Status</span>
                                    <div className="flex items-center space-x-2">
                                        {getSyncStatusIcon(ucm.latest_sync_status)}
                                        {getSyncStatusBadge(ucm.latest_sync_status)}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Last Sync</span>
                                    <span className="text-sm text-muted-foreground">
                                        {ucm.last_sync_at ? new Date(ucm.last_sync_at).toLocaleDateString() : 'Never'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Sync Information</CardTitle>
                            <CardDescription>Synchronization settings and status</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-sm font-medium">Last Sync</span>
                                <span className="text-sm text-muted-foreground">
                                    {ucm.last_sync_at ? new Date(ucm.last_sync_at).toLocaleString() : 'Never'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Actions</CardTitle>
                        <CardDescription>Manage this UCM server</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center space-x-4">
                            <Button variant="outline" asChild>
                                <Link href={`/ucm/${ucm.id}/sync-history`}>
                                    <History className="mr-2 h-4 w-4" />
                                    View Sync History
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/ucm/${ucm.id}/phones`}>
                                    <Phone className="mr-2 h-4 w-4" />
                                    View Phones
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={`/ucm/${ucm.id}/lines`}>
                                    <Hash className="mr-2 h-4 w-4" />
                                    View Lines
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

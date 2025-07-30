import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';

interface SyncHistoryEntry {
    id: number;
    sync_start_time: string;
    sync_end_time: string | null;
    status: 'syncing' | 'completed' | 'failed';
    error: string | null;
    formatted_duration: string | null;
    created_at: string;
}

interface Ucm {
    id: number;
    name: string;
    hostname: string;
}

interface Props {
    ucm: Ucm;
    syncHistory: {
        data: SyncHistoryEntry[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function UcmSyncHistory({ ucm, syncHistory }: Props) {
    useToast();

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'syncing':
                return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <Clock className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
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
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" asChild>
                            <Link href="/ucm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to UCM Servers
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Sync History</h1>
                            <p className="text-muted-foreground">
                                Sync history for {ucm.name} ({ucm.hostname})
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sync History Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sync History</CardTitle>
                        <CardDescription>A complete history of all sync operations for this UCM server.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {syncHistory.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold">No Sync History</h3>
                                <p className="text-center text-muted-foreground">No sync operations have been performed for this UCM server yet.</p>
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
                                    {syncHistory.data.map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusIcon(entry.status)}
                                                    {getStatusBadge(entry.status)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{new Date(entry.sync_start_time).toLocaleString()}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-muted-foreground">{entry.formatted_duration || 'In Progress...'}</div>
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
                    </CardContent>
                </Card>

                {/* Pagination Info */}
                {syncHistory.total > 0 && (
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div>
                            Showing {(syncHistory.current_page - 1) * syncHistory.per_page + 1} to{' '}
                            {Math.min(syncHistory.current_page * syncHistory.per_page, syncHistory.total)} of {syncHistory.total} entries
                        </div>
                        <div>
                            Page {syncHistory.current_page} of {syncHistory.last_page}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

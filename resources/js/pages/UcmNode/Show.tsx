import SSHTerminalComponent from '@/components/SSHTerminal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Server, Terminal } from 'lucide-react';

interface UcmNode {
    id: number;
    name: string;
    hostname: string;
    username: string;
    password?: string;
    node_role: string | null;
    version: string | null;
    ssh_username?: string;
    ssh_password?: string;
    ssh_port?: number;
    ucm_cluster: {
        id: number;
        name: string;
    };
}

interface Props {
    ucmNode: UcmNode;
}

export default function UcmNodeShow({ ucmNode }: Props) {
    useToast();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'UCM Clusters',
            href: '/ucm-clusters',
        },
        {
            title: ucmNode.ucm_cluster.name,
            href: `/ucm-clusters/${ucmNode.ucm_cluster.id}`,
        },
        {
            title: `${ucmNode.name} - SSH Terminal`,
            href: `/ucm-nodes/${ucmNode.id}`,
        },
    ];

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`SSH Terminal - ${ucmNode.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/ucm-clusters/${ucmNode.ucm_cluster.id}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Cluster
                            </Link>
                        </Button>
                        <div>
                            <div className="flex items-center space-x-2">
                                <Terminal className="h-6 w-6 text-muted-foreground" />
                                <h1 className="text-3xl font-bold tracking-tight">SSH Terminal</h1>
                            </div>
                            <p className="text-muted-foreground">
                                Remote connection to {ucmNode.name} ({ucmNode.hostname})
                            </p>
                        </div>
                    </div>
                </div>

                {/* Node Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            Node Information
                        </CardTitle>
                        <CardDescription>Details about this UCM cluster node</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Name</label>
                                <p className="font-medium">{ucmNode.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Hostname</label>
                                <p className="font-medium">{ucmNode.hostname}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Role</label>
                                <div className="mt-1">{getRoleBadge(ucmNode.node_role)}</div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Version</label>
                                <p className="font-medium">{ucmNode.version || 'Unknown'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* SSH Terminal */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Terminal className="h-5 w-5" />
                            SSH Terminal
                        </CardTitle>
                        <CardDescription>Direct SSH connection to {ucmNode.hostname}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <SSHTerminalComponent
                            ucmId={ucmNode.id}
                            ucmHost={ucmNode.hostname}
                            ucmUsername={ucmNode.ssh_username || ucmNode.username}
                            ucmPassword={ucmNode.ssh_password || ucmNode.password || ''}
                            ucmPort={ucmNode.ssh_port || 22}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

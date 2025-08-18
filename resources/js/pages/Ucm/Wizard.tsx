import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Server } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ApiVersion {
    [key: string]: string;
}

interface Props {
    apiVersions: ApiVersion;
}

interface DiscoveredNode {
    processnode: string;
    type: string;
}

interface DiscoveryResult {
    success: boolean;
    message: string;
    nodes: DiscoveredNode[];
    publisher: DiscoveredNode;
    publisher_id: number;
    created_count: number;
}

interface WizardData {
    cluster_name: string;
    hostname: string;
    username: string;
    password: string;
    schema_version: string;
    ssh_username: string;
    ssh_password: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'UCM Servers',
        href: '/ucm',
    },
    {
        title: 'UCM Onboarding Wizard',
        href: '/ucm/wizard',
    },
];

export default function UcmWizard({ apiVersions }: Props) {
    useToast(); // For handling server flash messages
    const [currentStep, setCurrentStep] = useState(1);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveredNodes, setDiscoveredNodes] = useState<DiscoveredNode[]>([]);
    const [publisherNode, setPublisherNode] = useState<DiscoveredNode | null>(null);
    const [publisherId, setPublisherId] = useState<number | null>(null);

    const { data, setData, processing, errors, setError, clearErrors } = useForm<WizardData>({
        cluster_name: '',
        hostname: '',
        username: '',
        password: '',
        schema_version: '',
        ssh_username: '',
        ssh_password: '',
    });

    const totalSteps = 5;
    const progressPercentage = (currentStep / totalSteps) * 100;

    const handleNext = () => {
        clearErrors();

        // Validate current step
        if (currentStep === 1) {
            if (!data.cluster_name.trim()) {
                setError('cluster_name', 'Cluster name is required');
                return;
            }
        } else if (currentStep === 2) {
            if (!data.hostname.trim()) {
                setError('hostname', 'Hostname/IP address is required');
                return;
            }
            if (!data.username.trim()) {
                setError('username', 'API username is required');
                return;
            }
            if (!data.password.trim()) {
                setError('password', 'API password is required');
                return;
            }
            if (!data.schema_version.trim()) {
                setError('schema_version', 'API version is required');
                return;
            }
        }

        if (currentStep === 3) {
            // Start discovery process
            handleDiscovery();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleDiscovery = async () => {
        setIsDiscovering(true);
        setCurrentStep(4); // Move to discovery step

        try {
            // Make API call to discover nodes
            const response = await axios.post('/ucm/discover', {
                cluster_name: data.cluster_name,
                hostname: data.hostname,
                username: data.username,
                password: data.password,
                schema_version: data.schema_version,
                ssh_username: data.ssh_username,
                ssh_password: data.ssh_password,
            });

            const result = response.data;

            setDiscoveredNodes(result.nodes);
            setPublisherNode(result.publisher);
            setPublisherId(result.publisher_id);
            setCurrentStep(5); // Move to success step

            toast.success('Discovery Successful', {
                description: `Found ${result.nodes.length} nodes in the cluster`,
            });
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Failed to discover cluster nodes';
            toast.error('Discovery Failed', {
                description: errorMessage,
            });
            setCurrentStep(3); // Go back to SSH credentials step
        } finally {
            setIsDiscovering(false);
        }
    };

    const handleFinish = () => {
        if (publisherId) {
            // Redirect to the publisher node edit page
            router.visit(`/ucm/${publisherId}/edit`);
        } else {
            // Fallback to UCM index page
            router.visit('/ucm');
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5" />
                                Cluster Information
                            </CardTitle>
                            <CardDescription>
                                This is the name of your cluster! It will help you identify this UCM cluster in the system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="cluster_name">Cluster Name</Label>
                                <Input
                                    id="cluster_name"
                                    value={data.cluster_name}
                                    onChange={(e) => setData('cluster_name', e.target.value)}
                                    placeholder="e.g., Production Cluster, Main UCM, etc."
                                    className="text-lg"
                                />
                                {errors.cluster_name && <p className="text-sm text-destructive">{errors.cluster_name}</p>}
                            </div>
                        </CardContent>
                    </Card>
                );

            case 2:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>API Connection Details</CardTitle>
                            <CardDescription>
                                This is what we'll use to interact with your system. We need the hostname/IP address of your UCM publisher and
                                credentials for an administrative user with AXL API access.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
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

                                <div className="space-y-2">
                                    <Label htmlFor="password">API Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Enter password"
                                    />
                                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );

            case 3:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>SSH Connection (Optional)</CardTitle>
                            <CardDescription>
                                If you'd like to connect remotely to your UCM servers for terminal access and advanced operations, you can add your
                                SSH credentials here. This is optional and can be configured later.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
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
                        </CardContent>
                    </Card>
                );

            case 4:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Discovering Cluster Nodes
                            </CardTitle>
                            <CardDescription>
                                We're connecting to your UCM system and discovering all nodes in the cluster. This may take a moment...
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-center py-8">
                                <div className="space-y-4 text-center">
                                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                                    <p className="text-muted-foreground">Testing API connection and discovering cluster topology...</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );

            case 5:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Discovery Complete!
                            </CardTitle>
                            <CardDescription>Successfully discovered your UCM cluster and stored all node information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                                <h3 className="mb-2 font-semibold text-green-800">Cluster: {data.cluster_name}</h3>
                                <p className="text-sm text-green-700">Found {discoveredNodes.length} nodes in your cluster</p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-medium">Discovered Nodes:</h4>
                                <div className="space-y-2">
                                    {discoveredNodes.map((node, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                            <div>
                                                <p className="font-medium">{node.processnode}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`rounded px-2 py-1 text-xs font-medium ${
                                                        node.type === 'Publisher' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    {node.type}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Next:</strong> You'll be taken to the publisher node configuration page where you can manage your cluster
                                    settings and start syncing data.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="UCM Onboarding Wizard" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">UCM Onboarding Wizard</h1>
                        <p className="text-muted-foreground">Set up your Cisco Unified Communications Manager cluster</p>
                    </div>
                    <Button variant="outline" asChild>
                        <a href="/ucm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to UCM Servers
                        </a>
                    </Button>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                        <span>
                            Step {currentStep} of {totalSteps}
                        </span>
                        <span>{Math.round(progressPercentage)}% complete</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">{renderStepContent()}</div>

                {/* Navigation */}
                <div className="flex justify-between">
                    <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || isDiscovering}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                    </Button>

                    <div className="flex gap-2">
                        {currentStep < 3 && (
                            <Button onClick={handleNext} disabled={processing}>
                                Next
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                        {currentStep === 3 && (
                            <Button onClick={handleNext} disabled={isDiscovering}>
                                {isDiscovering ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Discovering...
                                    </>
                                ) : (
                                    <>
                                        Start Discovery
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                        {currentStep === 5 && (
                            <Button onClick={handleFinish}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Go to Publisher Settings
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';

interface ApiVersion {
    [key: string]: string;
}

interface Props {
    apiVersions: ApiVersion;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'UCM Servers',
        href: '/ucm',
    },
    {
        title: 'Add UCM Server',
        href: '/ucm/create',
    },
];

export default function UcmCreate({ apiVersions }: Props) {
    useToast(); // Add toast hook

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        hostname: '',
        username: '',
        password: '',
        schema_version: '',
        ssh_username: '',
        ssh_password: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting form data:', data); // Debug

        // Show a toast indicating that API testing is in progress
        post('/ucm', {
            onStart: () => {
                console.log('Starting UCM creation with API test...');
            },
            onSuccess: () => {
                console.log('UCM creation completed');
            },
            onError: (errors) => {
                console.error('UCM creation failed:', errors);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add UCM Server" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add UCM Server</h1>
                        <p className="text-muted-foreground">Add a new Cisco Unified Communications Manager server</p>
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
                        <CardDescription>
                            Enter the connection details for your UCM server. The system will automatically test the API connection and detect the
                            server version.
                        </CardDescription>
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
                                        placeholder="Enter password"
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

                                {/* SSH Username */}
                                <div className="space-y-2">
                                    <Label htmlFor="ssh_username">SSH Username (Optional)</Label>
                                    <Input
                                        id="ssh_username"
                                        value={data.ssh_username}
                                        onChange={(e) => setData('ssh_username', e.target.value)}
                                        placeholder="Leave blank to use UCM username"
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
                                        placeholder="Leave blank to use UCM password"
                                    />
                                    {errors.ssh_password && <p className="text-sm text-destructive">{errors.ssh_password}</p>}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Creating & Testing API...' : 'Create UCM Server'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

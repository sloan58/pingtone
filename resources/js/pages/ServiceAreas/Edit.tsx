import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, RefreshCw, Save, Users } from 'lucide-react';

interface UcmUser {
    id: string;
    userid: string;
    displayName?: string;
    mailid?: string;
    telephoneNumber?: string;
}

interface ServiceArea {
    id: number;
    name: string;
    userFilters?: {
        field: string;
        regex: string;
    } | null;
    ucm_users?: UcmUser[];
    created_at: string;
    updated_at: string;
}

interface Props {
    serviceArea: ServiceArea;
}

export default function ServiceAreaEdit({ serviceArea }: Props) {
    useToast();

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Service Areas',
            href: '/service-areas',
        },
        {
            title: serviceArea.name,
            href: `/service-areas/${serviceArea.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: serviceArea.name,
        userFilters: serviceArea.userFilters || {
            field: '',
            regex: '',
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/service-areas/${serviceArea.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${serviceArea.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Service Area</h1>
                        <p className="text-muted-foreground">Update the details for this service area</p>
                    </div>
                    <Button variant="outline" asChild>
                        <a href="/service-areas">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Service Areas
                        </a>
                    </Button>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Service Area Details</CardTitle>
                        <CardDescription>Update the details for this service area.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g., North Region, Downtown Area"
                                    required
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            {/* User Filters */}
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-base font-medium">User Filters</Label>
                                    <p className="text-sm text-muted-foreground">Define criteria to group UCM users in this service area</p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Field Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="userFilters.field">Field</Label>
                                        <Select
                                            value={data.userFilters.field}
                                            onValueChange={(value) => setData('userFilters', { ...data.userFilters, field: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select field to filter by" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mailid">Email</SelectItem>
                                                <SelectItem value="telephoneNumber">Telephone Number</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors['userFilters.field'] && <p className="text-sm text-destructive">{errors['userFilters.field']}</p>}
                                    </div>

                                    {/* Regex Pattern */}
                                    <div className="space-y-2">
                                        <Label htmlFor="userFilters.regex">Regex Pattern</Label>
                                        <Input
                                            id="userFilters.regex"
                                            value={data.userFilters.regex}
                                            onChange={(e) => setData('userFilters', { ...data.userFilters, regex: e.target.value })}
                                            placeholder="e.g., .*@company\.com$ or ^555.*"
                                        />
                                        {errors['userFilters.regex'] && <p className="text-sm text-destructive">{errors['userFilters.regex']}</p>}
                                    </div>
                                </div>

                                <div className="rounded-lg border bg-muted/50 p-3">
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Examples:</strong>
                                        <br />• Email ending with company.com: <code>.*@company\.com$</code>
                                        <br />• Phone numbers starting with 555: <code>^555.*</code>
                                        <br />• Any gmail address: <code>.*@gmail\.com$</code>
                                    </p>
                                </div>
                            </div>

                            {/* Assigned Users */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label className="text-base font-medium">Assigned Users</Label>
                                        <p className="text-sm text-muted-foreground">Users currently assigned to this service area</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            router.post('/service-areas/trigger-assignment');
                                        }}
                                    >
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Refresh Assignments
                                    </Button>
                                </div>

                                <div className="rounded-lg border bg-muted/50 p-4">
                                    {serviceArea.ucm_users && serviceArea.ucm_users.length > 0 ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Users className="h-4 w-4" />
                                                {serviceArea.ucm_users.length} users assigned
                                            </div>
                                            <div className="grid gap-2 text-sm">
                                                {serviceArea.ucm_users.slice(0, 10).map((user) => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center justify-between rounded border bg-background px-2 py-1"
                                                    >
                                                        <div>
                                                            <span className="font-medium">{user.userid}</span>
                                                            {user.displayName && (
                                                                <span className="ml-2 text-muted-foreground">({user.displayName})</span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {serviceArea.userFilters?.field === 'mailid' ? user.mailid : user.telephoneNumber}
                                                        </div>
                                                    </div>
                                                ))}
                                                {serviceArea.ucm_users.length > 10 && (
                                                    <div className="pt-2 text-xs text-muted-foreground">
                                                        ... and {serviceArea.ucm_users.length - 10} more users
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="py-4 text-center text-muted-foreground">
                                            <Users className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                            <p>No users currently assigned</p>
                                            <p className="mt-1 text-xs">
                                                Users will be assigned automatically during UCM sync or manually using the refresh button
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Meta Information */}
                            <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                                <h3 className="font-medium">Metadata</h3>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created:</span>
                                        <span>{new Date(serviceArea.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Last Updated:</span>
                                        <span>{new Date(serviceArea.updated_at).toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Updating...' : 'Update Service Area'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Service Areas',
        href: '/service-areas',
    },
    {
        title: 'Add Service Area',
        href: '/service-areas/create',
    },
];

export default function ServiceAreaCreate() {
    useToast();

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        userFilters: {
            field: '',
            regex: '',
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/service-areas');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Service Area" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add Service Area</h1>
                        <p className="text-muted-foreground">Create a new service area for organizing services and locations</p>
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
                        <CardDescription>Enter the details for your new service area.</CardDescription>
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

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Creating...' : 'Create Service Area'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

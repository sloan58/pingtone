import { PhonesTable } from '@/components/PhonesTable';
import { UcmUsersTable } from '@/components/UcmUsersTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Phone, Save, Users } from 'lucide-react';
import * as React from 'react';

interface ServiceArea {
    id: number;
    name: string;
    userFilter?: {
        field: string;
        regex: string;
    } | null;
    ucm_users_count?: number;
    phones_count?: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    serviceArea: ServiceArea;
}

export default function ServiceAreaEdit({ serviceArea }: Props) {
    useToast();
    const { url } = usePage();

    const [currentTab, setCurrentTab] = React.useState(() => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('tab') || 'details';
    });

    // State for managing embedded table data
    const [usersData, setUsersData] = React.useState<any>(null);
    const [phonesData, setPhonesData] = React.useState<any>(null);
    const [loadingUsers, setLoadingUsers] = React.useState(false);
    const [loadingPhones, setLoadingPhones] = React.useState(false);

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
        userFilter: serviceArea.userFilter || {
            field: '',
            regex: '',
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/service-areas/${serviceArea.id}`);
    };

    const handleTabChange = (tab: string) => {
        setCurrentTab(tab);

        // Update URL without full page reload
        const url = new URL(window.location.href);
        if (tab === 'details') {
            url.searchParams.delete('tab');
        } else {
            url.searchParams.set('tab', tab);
        }
        window.history.replaceState({}, '', url.toString());

        // Load data for the active tab
        if (tab === 'users' && !usersData) {
            loadUsersData();
        } else if (tab === 'phones' && !phonesData) {
            loadPhonesData();
        }
    };

    const loadUsersData = () => {
        setLoadingUsers(true);
        router.get(
            '/ucm-users',
            { service_area_id: serviceArea.id },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['users', 'tableState', 'filters'],
                onSuccess: (page) => {
                    setUsersData({
                        users: page.props.users,
                        tableState: page.props.tableState,
                        filters: page.props.filters,
                    });
                    setLoadingUsers(false);
                },
                onError: () => {
                    setLoadingUsers(false);
                },
            },
        );
    };

    const loadPhonesData = () => {
        setLoadingPhones(true);
        router.get(
            '/phones',
            { service_area_id: serviceArea.id },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['phones', 'tableState', 'filters'],
                onSuccess: (page) => {
                    setPhonesData({
                        phones: page.props.phones,
                        tableState: page.props.tableState,
                        filters: page.props.filters,
                    });
                    setLoadingPhones(false);
                },
                onError: () => {
                    setLoadingPhones(false);
                },
            },
        );
    };

    // Load initial tab data
    React.useEffect(() => {
        if (currentTab === 'users') {
            loadUsersData();
        } else if (currentTab === 'phones') {
            loadPhonesData();
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${serviceArea.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Service Area</h1>
                        <p className="text-muted-foreground">Manage details, users, and phones for this service area</p>
                    </div>
                    <Button variant="outline" asChild>
                        <Link href="/service-areas">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Service Areas
                        </Link>
                    </Button>
                </div>

                {/* Tabbed Interface */}
                <Tabs value={currentTab} onValueChange={handleTabChange}>
                    <TabsList>
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="users">
                            <Users className="mr-2 h-4 w-4" />
                            UCM Users
                        </TabsTrigger>
                        <TabsTrigger value="phones">
                            <Phone className="mr-2 h-4 w-4" />
                            Phones
                        </TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details">
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

                                    {/* User Filter */}
                                    <div className="space-y-4">
                                        <div>
                                            <Label className="text-base font-medium">User Filter</Label>
                                            <p className="text-sm text-muted-foreground">Define criteria to group UCM users in this service area</p>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2">
                                            {/* Field Selection */}
                                            <div className="space-y-2">
                                                <Label htmlFor="userFilter.field">Field</Label>
                                                <Select
                                                    value={data.userFilter.field}
                                                    onValueChange={(value) => setData('userFilter', { ...data.userFilter, field: value })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select field to filter by" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="mailid">Email</SelectItem>
                                                        <SelectItem value="telephoneNumber">Telephone Number</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {errors['userFilter.field'] && (
                                                    <p className="text-sm text-destructive">{errors['userFilter.field']}</p>
                                                )}
                                            </div>

                                            {/* Regex Pattern */}
                                            <div className="space-y-2">
                                                <Label htmlFor="userFilter.regex">Regex Pattern</Label>
                                                <Input
                                                    id="userFilter.regex"
                                                    value={data.userFilter.regex}
                                                    onChange={(e) => setData('userFilter', { ...data.userFilter, regex: e.target.value })}
                                                    placeholder="e.g., .*@company\.com$ or ^555.*"
                                                />
                                                {errors['userFilter.regex'] && (
                                                    <p className="text-sm text-destructive">{errors['userFilter.regex']}</p>
                                                )}
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

                                    {/* Meta Information */}
                                    <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                                        <h3 className="font-medium">Metadata</h3>
                                        <div className="grid gap-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Assigned Users:</span>
                                                <span className="font-medium">{serviceArea.ucm_users_count || 0}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Associated Phones:</span>
                                                <span className="font-medium">{serviceArea.phones_count || 0}</span>
                                            </div>
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
                    </TabsContent>

                    {/* UCM Users Tab */}
                    <TabsContent value="users">
                        <Card>
                            <CardHeader>
                                <CardTitle>UCM Users</CardTitle>
                                <CardDescription>Users assigned to this service area based on the configured filters.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingUsers ? (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                        <p>Loading users...</p>
                                    </div>
                                ) : usersData ? (
                                    <UcmUsersTable
                                        users={usersData.users}
                                        tableState={usersData.tableState}
                                        filters={usersData.filters}
                                        baseUrl={`/ucm-users?service_area_id=${serviceArea.id}`}
                                        title="Assigned UCM Users"
                                    />
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                        <p>Click to load users...</p>
                                        <Button variant="outline" onClick={loadUsersData} className="mt-2">
                                            Load Users
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Phones Tab */}
                    <TabsContent value="phones">
                        <Card>
                            <CardHeader>
                                <CardTitle>Phones</CardTitle>
                                <CardDescription>Phone devices associated with users in this service area.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {loadingPhones ? (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Phone className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                        <p>Loading phones...</p>
                                    </div>
                                ) : phonesData ? (
                                    <PhonesTable
                                        phones={phonesData.phones}
                                        tableState={phonesData.tableState}
                                        filters={phonesData.filters}
                                        baseUrl={`/phones?service_area_id=${serviceArea.id}`}
                                        title="Associated Phones"
                                        showActions={false}
                                    />
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Phone className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                        <p>Click to load phones...</p>
                                        <Button variant="outline" onClick={loadPhonesData} className="mt-2">
                                            Load Phones
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}

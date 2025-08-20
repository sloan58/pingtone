import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Head, Link } from '@inertiajs/react';
import { Activity, ArrowLeft, Phone, Server } from 'lucide-react';

interface Phone {
    id: number;
    name: string;
    description: string;
    model: string;
    status: string;
    ucm: {
        id: number;
        name: string;
    };
    lines: Array<{
        id: number;
        directory_number: string;
        description: string;
    }>;
}

interface PhoneShowProps {
    phone: Phone;
}

export default function PhoneShow({ phone }: PhoneShowProps) {
    return (
        <AppLayout>
            <Head title={`Phone - ${phone.name}`} />
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/phones">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Phones
                                    </Link>
                                </Button>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">{phone.name}</h1>
                                    <p className="text-muted-foreground">{phone.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                    Edit
                                </Button>
                                <Button size="sm">
                                    <Phone className="mr-2 h-4 w-4" />
                                    Call
                                </Button>
                            </div>
                        </div>

                        {/* Phone Details */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Basic Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Phone className="mr-2 h-5 w-5" />
                                        Phone Information
                                    </CardTitle>
                                    <CardDescription>Basic phone details and configuration</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Model</label>
                                            <p className="text-sm">{phone.model}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                                            <Badge variant={phone.status === 'Registered' ? 'default' : 'destructive'}>{phone.status}</Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                                        <p className="text-sm">{phone.description}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* UCM Server */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Server className="mr-2 h-5 w-5" />
                                        UCM Server
                                    </CardTitle>
                                    <CardDescription>Associated UCM server information</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Server Name</label>
                                            <p className="text-sm">{phone.ucm.name}</p>
                                        </div>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/ucm/${phone.ucm.id}`}>View Server Details</Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Phone Lines */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Activity className="mr-2 h-5 w-5" />
                                    Phone Lines
                                </CardTitle>
                                <CardDescription>Directory numbers assigned to this phone</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {phone.lines.length > 0 ? (
                                    <div className="space-y-4">
                                        {phone.lines.map((line) => (
                                            <div key={line.id} className="flex items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium">{line.directory_number}</p>
                                                    <p className="text-xs text-muted-foreground">{line.description}</p>
                                                </div>
                                                <Badge variant="outline">Active</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-2 text-sm font-medium">No lines assigned</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">This phone doesn't have any directory numbers assigned.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
        </AppLayout>
    );
}

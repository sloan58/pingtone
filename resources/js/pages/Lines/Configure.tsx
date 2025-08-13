import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { FormSection } from '@/components/ui/form-section';
import { Head, router } from '@inertiajs/react';
import { ChevronRight, Phone, Settings } from 'lucide-react';

interface Line {
    uuid: string;
    pattern: string;
    description?: string;
    routePartitionName?: any;
    callingSearchSpaceName?: any;
    // Add other global line properties as needed
}

interface Phone {
    id: string;
    uuid: string;
    name: string;
    model?: string;
    ucm?: {
        name: string;
    };
}

interface DeviceSpecificLine {
    index?: number;
    dirn?: {
        pattern: string;
        uuid: string;
    };
    display?: string;
    display_ascii?: string;
    e164_alt_num?: string;
    external_phone_number_mask?: string;
    max_num_calls?: number;
    busy_trigger?: number;
    ring_settings?: any;
    // Add other device-specific properties as needed
}

interface Props {
    line: Line;
    phone?: Phone;
    deviceSpecificLine?: DeviceSpecificLine;
}

export default function Configure({ line, phone, deviceSpecificLine }: Props) {
    const isDeviceSpecific = !!phone && !!deviceSpecificLine;

    return (
        <AppShell variant="sidebar">
            <Head title={`Configure Line - ${line.pattern}`} />
            <AppSidebar />
            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />
                <AppContent variant="sidebar" className="p-0">
                    <div className="space-y-4 p-6">
                        {/* Breadcrumbs */}
                        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <button
                                onClick={() => router.visit('/phones')}
                                className="flex items-center space-x-1 transition-colors hover:text-foreground"
                            >
                                <Phone className="h-4 w-4" />
                                <span>Phones</span>
                            </button>
                            <ChevronRight className="h-4 w-4" />
                            {phone ? (
                                <>
                                    <button
                                        onClick={() => router.visit(`/phones/${phone.id}/edit`)}
                                        className="transition-colors hover:text-foreground"
                                    >
                                        {phone.name || phone.id}
                                    </button>
                                    <ChevronRight className="h-4 w-4" />
                                    <div className="flex items-center space-x-1 text-foreground">
                                        <Settings className="h-4 w-4" />
                                        <span>{line.pattern}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => router.visit('/phones')} className="transition-colors hover:text-foreground">
                                        Lines
                                    </button>
                                    <ChevronRight className="h-4 w-4" />
                                    <div className="flex items-center space-x-1 text-foreground">
                                        <Settings className="h-4 w-4" />
                                        <span>{line.pattern}</span>
                                    </div>
                                </>
                            )}
                        </nav>

                        {/* Header */}
                        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                            <div>
                                <h1 className="text-2xl font-bold">{line.pattern}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {line.description || 'Line Configuration'}
                                    {isDeviceSpecific && ` • ${phone.name}`}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Global Configurations */}
                            <div className="overflow-hidden rounded-lg border bg-card shadow">
                                <div className="border-b p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-lg font-semibold">Global Configurations</h2>
                                            <p className="text-sm text-muted-foreground">Line settings that apply to all devices using this line</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <FormSection title="Line Information">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Pattern</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={line.pattern || ''}
                                                    readOnly
                                                    disabled
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Description</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={line.description || ''}
                                                    placeholder="Enter line description"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Route Partition</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={
                                                        typeof line.routePartitionName === 'string'
                                                            ? line.routePartitionName
                                                            : line.routePartitionName?._ || line.routePartitionName?.name || ''
                                                    }
                                                    placeholder="Select route partition"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Calling Search Space</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={
                                                        typeof line.callingSearchSpaceName === 'string'
                                                            ? line.callingSearchSpaceName
                                                            : line.callingSearchSpaceName?._ || line.callingSearchSpaceName?.name || ''
                                                    }
                                                    placeholder="Select calling search space"
                                                />
                                            </div>
                                        </div>
                                    </FormSection>

                                    {/* Add more global configuration sections as needed */}
                                    <div className="mt-6 rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center">
                                        <p className="text-sm text-muted-foreground">Additional global line configurations will be added here</p>
                                    </div>
                                </div>
                            </div>

                            {/* Device-specific Configurations */}
                            {isDeviceSpecific ? (
                                <div className="overflow-hidden rounded-lg border bg-card shadow">
                                    <div className="border-b p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h2 className="text-lg font-semibold">Configurations on {phone.name}</h2>
                                                <p className="text-sm text-muted-foreground">Line settings specific to this device</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <FormSection title="Device-specific Settings">
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Button Index</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-md border bg-background p-2"
                                                        value={deviceSpecificLine.index || ''}
                                                        placeholder="Button position"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Display Name</label>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-md border bg-background p-2"
                                                        value={deviceSpecificLine.display || ''}
                                                        placeholder="Display name on device"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">E.164 Alternate Number</label>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-md border bg-background p-2"
                                                        value={deviceSpecificLine.e164_alt_num || ''}
                                                        placeholder="E.164 alternate number"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">External Phone Number Mask</label>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-md border bg-background p-2"
                                                        value={deviceSpecificLine.external_phone_number_mask || ''}
                                                        placeholder="External phone number mask"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Maximum Number of Calls</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-md border bg-background p-2"
                                                        value={deviceSpecificLine.max_num_calls || ''}
                                                        placeholder="Max calls"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium">Busy Trigger</label>
                                                    <input
                                                        type="number"
                                                        className="w-full rounded-md border bg-background p-2"
                                                        value={deviceSpecificLine.busy_trigger || ''}
                                                        placeholder="Busy trigger"
                                                    />
                                                </div>
                                            </div>
                                        </FormSection>

                                        {/* Add more device-specific configuration sections as needed */}
                                        <div className="mt-6 rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                Additional device-specific configurations will be added here
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-lg border bg-card shadow">
                                    <div className="border-b p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h2 className="text-lg font-semibold">Device-specific Configurations</h2>
                                                <p className="text-sm text-muted-foreground">Line settings specific to individual devices</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
                                            <p className="text-sm text-muted-foreground">
                                                No device context provided. Device-specific configurations will appear here when configuring a line
                                                from a phone.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

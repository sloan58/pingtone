import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { FormSection } from '@/components/ui/form-section';
import { Head, router } from '@inertiajs/react';
import { ChevronRight, Phone, Settings } from 'lucide-react';
import { useState } from 'react';

interface Line {
    uuid: string;
    pattern: string;
    description?: string;
    routePartitionName?: any;
    callingSearchSpaceName?: any;
    patternAndPartition?: string;
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
    lines?: {
        line: any[];
    };
}

interface ButtonConfig {
    index: string;
    dirn: {
        pattern: string;
        uuid: string;
        routePartitionName: any;
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
    phone: Phone;
    buttonIndex: number;
    buttonType: string;
    buttonConfig: ButtonConfig;
    line: Line;
    latestStatus: any;
}

export default function EditButton({ phone, buttonIndex, buttonType, buttonConfig, line, latestStatus }: Props) {
    // State for managing phone data changes
    const [phoneData, setPhoneData] = useState(phone);
    const [hasChanges, setHasChanges] = useState(false);
    const [currentLine, setCurrentLine] = useState(line);
    const [targetLineConfig, setTargetLineConfig] = useState(buttonConfig);
    const [targetLineIndex, setTargetLineIndex] = useState(() => {
        // Find the index of this button in the phone's lines array
        const lines = Array.isArray(phone.lines?.line) ? phone.lines.line : [phone.lines?.line];
        return lines.findIndex((l: any) => l.index === buttonIndex.toString());
    });

    // Function to fetch line options for the async combobox
    const fetchLineOptions = async (query: string): Promise<{ value: string; label: string }[]> => {
        const params = new URLSearchParams();
        if (query) params.append('query', query);
        params.append('limit', '10');

        const response = await fetch(`/api/lines/search?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch line options');
        }

        const data = await response.json();
        return data.options || [];
    };

    // Function to fetch line details by UUID
    const fetchLineDetails = async (lineUuid: string) => {
        try {
            const response = await fetch(`/api/lines/${lineUuid}`);
            if (!response.ok) {
                throw new Error('Failed to fetch line details');
            }
            const lineData = await response.json();
            return lineData;
        } catch (error) {
            console.error('Error fetching line details:', error);
            return null;
        }
    };

    // Function to update phone line assignment in local state
    const updatePhoneLine = async (oldLineUuid: string, newLineUuid: string, selectedOption: any) => {
        if (!phoneData) return;

        // Fetch the new line details
        const newLineData = await fetchLineDetails(newLineUuid);
        if (!newLineData) {
            console.error('Failed to fetch new line details');
            return;
        }

        // Update the current line with the new line data
        setCurrentLine({
            ...newLineData,
            patternAndPartition: selectedOption.label,
        });

        // Update the target line configuration
        const updatedTargetConfig = {
            ...targetLineConfig,
            dirn: {
                pattern: selectedOption.pattern,
                uuid: newLineUuid,
                routePartitionName: selectedOption.routePartition,
            },
        };
        setTargetLineConfig(updatedTargetConfig);

        // Update the phone data
        const updatedPhoneData = JSON.parse(JSON.stringify(phoneData));
        if (targetLineIndex !== -1) {
            updatedPhoneData.lines.line[targetLineIndex] = updatedTargetConfig;
        }
        setPhoneData(updatedPhoneData);
        setHasChanges(true);

        console.log('Line assignment updated in local state:', {
            oldLineUuid,
            newLineUuid,
            newPattern: selectedOption.pattern,
            newRoutePartition: selectedOption.routePartition,
            newLineData,
            updatedTargetConfig,
        });
    };

    // Function to get current display value for the line (reflects any changes made)
    const getCurrentLineDisplayValue = () => {
        return currentLine.patternAndPartition || `${currentLine.pattern} in ${currentLine.routePartitionName?._ || 'None'}`;
    };

    return (
        <AppShell variant="sidebar">
            <Head title={`Edit Button ${buttonIndex} - ${phone.name}`} />
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
                            <button onClick={() => router.visit(`/phones/${phone.id}/edit`)} className="transition-colors hover:text-foreground">
                                {phone.name || phone.id}
                            </button>
                            <ChevronRight className="h-4 w-4" />
                            <div className="flex items-center space-x-1 text-foreground">
                                <Settings className="h-4 w-4" />
                                <span>Button {buttonIndex}</span>
                            </div>
                        </nav>

                        {/* Header */}
                        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                            <div>
                                <h1 className="text-2xl font-bold">Button {buttonIndex}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {phone.name} • {buttonType} configuration
                                    {hasChanges && (
                                        <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                                            Unsaved changes
                                        </span>
                                    )}
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
                                                <label className="mb-1 block text-sm font-medium">Directory Number</label>
                                                <AsyncCombobox
                                                    value={currentLine.uuid}
                                                    onValueChange={(value, selectedOption) => {
                                                        // Handle line assignment - update the phone's line configuration
                                                        if (value && value !== currentLine.uuid && phoneData && selectedOption) {
                                                            updatePhoneLine(currentLine.uuid, value, selectedOption);
                                                        }
                                                    }}
                                                    placeholder="Search for a line..."
                                                    searchPlaceholder="Type to search lines..."
                                                    emptyMessage="No lines found."
                                                    loadingMessage="Searching lines..."
                                                    fetchOptions={fetchLineOptions}
                                                    displayValue={getCurrentLineDisplayValue()}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Description</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={currentLine.description || ''}
                                                    onChange={(e) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            description: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Enter line description"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Calling Search Space</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={
                                                        typeof currentLine.callingSearchSpaceName === 'string'
                                                            ? currentLine.callingSearchSpaceName
                                                            : currentLine.callingSearchSpaceName?._ || currentLine.callingSearchSpaceName?.name || ''
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
                                                    value={buttonConfig.index || ''}
                                                    placeholder="Button position"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Display Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={buttonConfig.display || ''}
                                                    placeholder="Display name on device"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">E.164 Alternate Number</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={buttonConfig.e164_alt_num || ''}
                                                    placeholder="E.164 alternate number"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">External Phone Number Mask</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={buttonConfig.external_phone_number_mask || ''}
                                                    placeholder="External phone number mask"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Maximum Number of Calls</label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={buttonConfig.max_num_calls || ''}
                                                    placeholder="Max calls"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Busy Trigger</label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={buttonConfig.busy_trigger || ''}
                                                    placeholder="Busy trigger"
                                                />
                                            </div>
                                        </div>
                                    </FormSection>

                                    {/* Add more device-specific configuration sections as needed */}
                                    <div className="mt-6 rounded-lg border border-dashed border-muted-foreground/25 p-4 text-center">
                                        <p className="text-sm text-muted-foreground">Additional device-specific configurations will be added here</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Debug Section - Remove this later */}
                        <div className="mt-8 overflow-hidden rounded-lg border bg-card shadow">
                            <div className="border-b p-6">
                                <h3 className="text-lg font-semibold">Debug Information</h3>
                                <p className="text-sm text-muted-foreground">Current line and target line configuration data</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <div>
                                        <h4 className="mb-2 font-medium">Line Data (Global)</h4>
                                        <pre className="max-h-96 overflow-auto rounded border bg-muted p-3 text-xs">
                                            {JSON.stringify(currentLine, null, 2)}
                                        </pre>
                                    </div>
                                    <div>
                                        <h4 className="mb-2 font-medium">Target Line Config (Phone-specific)</h4>
                                        <pre className="max-h-96 overflow-auto rounded border bg-muted p-3 text-xs">
                                            {JSON.stringify(targetLineConfig, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

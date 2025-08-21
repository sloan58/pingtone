import LineConfigurationForm from '@/components/LineConfigurationForm';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ChevronRight, Loader2, Phone, Settings } from 'lucide-react';
import { BreadcrumbItem } from '@/types';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// Reusable collapsible card section - moved outside component to prevent re-creation
const SectionCard = ({
    title,
    description,
    children,
    defaultOpen = true,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) => {
    const storageKey = `editButton.section.${title.replace(/\s+/g, '-').toLowerCase()}`;
    const persisted = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
    const initialOpen = persisted === null ? defaultOpen : persisted === 'open';

    const [isOpen, setIsOpen] = useState(initialOpen);

    const handleOpenChange = useCallback(
        (open: boolean) => {
            setIsOpen(open);
            try {
                window.localStorage.setItem(storageKey, open ? 'open' : 'closed');
            } catch {}
        },
        [storageKey],
    );

    return (
        <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
            <div className="overflow-hidden rounded-lg border bg-card shadow">
                <CollapsibleTrigger className="group flex w-full items-center justify-between border-b p-6 text-left hover:bg-accent/30">
                    <div>
                        <h2 className="text-lg font-semibold">{title}</h2>
                        {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="p-6">{children}</div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
};

interface Line {
    _id: string;
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
    ucm_cluster_id?: string;
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

interface AssociatedDevice {
    id: string;
    name: string;
    class: string;
}

interface Props {
    phone: Phone;
    buttonIndex: number;
    buttonType: string;
    buttonConfig: ButtonConfig;
    line: Line;
    latestStatus: any;
    associatedDevices?: AssociatedDevice[];
}

export default function EditButton({ phone, buttonIndex, buttonType, buttonConfig, line, latestStatus, associatedDevices }: Props) {
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Phones',
            href: '/phones',
        },
        {
            title: phone.name || phone.id,
            href: `/phones/${phone.id}/edit`,
        },
        {
            title: `Button ${buttonIndex}`,
        },
    ];

    // State for managing phone data changes
    const [phoneData, setPhoneData] = useState(phone);
    const [hasChanges, setHasChanges] = useState(false);
    const [currentLine, setCurrentLine] = useState(line);
    const [targetLineConfig, setTargetLineConfig] = useState(buttonConfig);
    const [isSaving, setIsSaving] = useState(false);
    const [targetLineIndex, setTargetLineIndex] = useState(() => {
        // Find the index of this button in the phone's lines array
        const lines = Array.isArray(phone.lines?.line) ? phone.lines.line : [phone.lines?.line];
        return lines.findIndex((l: any) => l.index === buttonIndex.toString());
    });

    // State for device dissociation
    const [dissociatingDevices, setDissociatingDevices] = useState<Set<string>>(new Set());
    const [confirmDialog, setConfirmDialog] = useState<{
        open: boolean;
        deviceId: string | null;
        deviceName: string;
    }>({
        open: false,
        deviceId: null,
        deviceName: '',
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

    // Function to handle save
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await axios.post(`/phones/${phone.id}/lines/${targetLineIndex}`, {
                line: currentLine,
                targetLineConfig: targetLineConfig,
            });

            const result = response.data;

            // Update local state with fresh data from UCM
            if (result.line) {
                setCurrentLine(result.line);
            }
            if (result.targetLineConfig) {
                setTargetLineConfig(result.targetLineConfig);
            }

            setHasChanges(false);

            console.log('Changes saved successfully:', result);

            // Show success toast
            toast.success('Line updated successfully', {
                description: 'The line configuration has been saved to UCM and updated in the database.',
            });
        } catch (error) {
            console.error('Error saving changes:', error);

            // Show error toast
            const errorMessage = error.response?.data?.error || 'An unexpected error occurred while saving changes.';
            toast.error('Failed to save changes', {
                description: errorMessage,
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Function to get current display value for the line (reflects any changes made)
    const getCurrentLineDisplayValue = () => {
        return currentLine.patternAndPartition || `${currentLine.pattern} in ${currentLine.routePartitionName?._ || 'None'}`;
    };

    // Function to handle device dissociation
    const handleDissociateDevice = (deviceId: string, deviceName: string) => {
        setConfirmDialog({
            open: true,
            deviceId,
            deviceName,
        });
    };

    const confirmDissociateDevice = async () => {
        const { deviceId, deviceName } = confirmDialog;
        if (!deviceId || dissociatingDevices.has(deviceId)) return;

        setDissociatingDevices((prev) => new Set(prev).add(deviceId));

        try {
            const response = await axios.post(`/api/devices/${deviceId}/dissociate-line/${line._id}`);

            toast.success('Device dissociated successfully', {
                description: `${deviceName} has been removed from this line.`,
            });

            // Refresh the page to update associated devices
            router.reload({ only: ['associatedDevices'] });
        } catch (error: any) {
            console.error('Error dissociating device:', error);
            toast.error('Failed to dissociate device', {
                description: error.response?.data?.error || 'An error occurred while removing the device from this line.',
            });
        } finally {
            setDissociatingDevices((prev) => {
                const newSet = new Set(prev);
                newSet.delete(deviceId);
                return newSet;
            });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Button ${buttonIndex} - ${phone.name}`} />
            <div className="p-0">
                <div>
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 pt-4 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex items-center gap-6">
                            <div>
                                <h1 className="text-2xl font-bold">Button {buttonIndex}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {phone.name} • {buttonType} configuration
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>

                    <div className="mt-6">
                        <h2 className="mb-4 text-xl font-semibold">Global Line Configuration</h2>
                        <LineConfigurationForm
                            line={currentLine}
                            onLineChange={setCurrentLine}
                            onHasChanges={setHasChanges}
                            associatedDevices={associatedDevices}
                            buttonIndex={buttonIndex}
                            phone={phone}
                            onUpdatePhoneLine={updatePhoneLine}
                            onDissociateDevice={handleDissociateDevice}
                            dissociatingDevices={dissociatingDevices}
                            showDirectoryNumberField={true}
                            showAssociatedDevices={true}
                        />
                    </div>

                    <div className="mt-8">
                        <h2 className="mb-4 text-xl font-semibold">Configuration on {phone.name}</h2>
                        <div className="space-y-4">{/* Device-specific configuration sections will go here */}</div>
                    </div>

                    <div className="mt-6">
                        {/* Debug Section - Remove this later */}
                        <div className="overflow-hidden rounded-lg border bg-card shadow">
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
                </div>
            </div>

            <ConfirmDialog
                open={confirmDialog.open}
                onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
                title="Dissociate Device"
                description={`Are you sure you want to dissociate "${confirmDialog.deviceName}" from this line? This will remove the line from the device.`}
                confirmText="Dissociate"
                cancelText="Cancel"
                variant="destructive"
                onConfirm={confirmDissociateDevice}
            />
        </AppLayout>
    );
}

import LineConfigurationForm from '@/components/LineConfigurationForm';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ChevronRight, Loader2, Phone, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AssociatedDevice {
    id: string;
    name: string;
    class: string;
}

interface Line {
    _id: string;
    uuid: string;
    pattern: string;
    description?: string;
    alertingName?: string;
    asciiAlertingName?: string;
    routePartitionName?: {
        _: string;
        uuid: string;
    };
    usage: string;
    shareLineAppearanceCssName?: {
        _: string;
        uuid: string;
    };
    voiceMailProfileName?: {
        _: string;
        uuid: string;
    };
    presenceGroupName?: {
        _: string;
        uuid: string;
    };
    userHoldMohAudioSourceId?: string;
    networkHoldMohAudioSourceId?: string;
    callingIdPresentationWhenDiverted?: string;
    rejectAnonymousCall?: string | boolean;
    allowCtiControlFlag?: string | boolean;
    externalCallControlProfileName?: {
        _: string;
        uuid: string;
    };
    externalPresentationInfo?: {
        isAnonymous?: string | boolean;
        presentationInfo?: {
            externalPresentationNumber?: string;
            externalPresentationName?: string;
        };
    };
    aarVoiceMailEnabled?: string | boolean;
    aarDestinationMask?: string;
    aarNeighborhoodName?:
        | {
              _: string;
              uuid: string;
          }
        | string;
    aarKeepCallHistory?: string | boolean;
    useEnterpriseAltNum?: string | boolean;
    enterpriseAltNum?: {
        numMask?: string;
        isUrgent?: string | boolean;
        addLocalRoutePartition?: string | boolean;
        routePartition?: {
            _: string;
            uuid: string;
        };
        advertiseGloballyIls?: string | boolean;
    };
    hrDuration?: string;
    hrInterval?: string;
    partyEntranceTone?: string;
    [key: string]: any; // For additional properties
}

interface Props {
    line: Line;
    associatedDevices?: AssociatedDevice[];
}

export default function LineEdit({ line, associatedDevices = [] }: Props) {
    const [currentLine, setCurrentLine] = useState<Line>(line);
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(`/api/lines/${line._id}`, currentLine);
            toast.success('Line configuration saved successfully');
            setHasChanges(false);

            // Optionally refresh the page data
            router.reload({ only: ['line'] });
        } catch (error: any) {
            console.error('Save failed:', error);
            toast.error(error.response?.data?.message || 'Failed to save line configuration');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDissociateDevice = (deviceId: string, deviceName: string) => {
        setConfirmDialog({
            open: true,
            deviceId,
            deviceName,
        });
    };

    const confirmDissociateDevice = async () => {
        const { deviceId, deviceName } = confirmDialog;
        if (!deviceId) return;

        // Add device to dissociating set for loading state
        setDissociatingDevices((prev) => new Set(prev).add(deviceId));

        // Debug: Log the line object to see what's available
        console.log('Line object:', line);
        console.log('Line _id:', line._id);
        console.log('Line id:', (line as any).id);

        try {
            // Try multiple ways to get the line ID
            const lineId = line._id || (line as any).id || line.uuid;
            if (!lineId) {
                console.error('No line ID found in line object:', line);
                toast.error('Line ID not found');
                return;
            }

            console.log('Using line ID:', lineId);

            const response = await axios.post(`/api/devices/${deviceId}/dissociate-line/${lineId}`);
            toast.success(`Device "${deviceName}" dissociated successfully`);

            // Refresh the page to update associated devices
            router.reload({ only: ['associatedDevices'] });
        } catch (error: any) {
            console.error('Dissociation failed:', error);
            toast.error(error.response?.data?.error || 'Failed to dissociate device');
        } finally {
            // Remove device from dissociating set
            setDissociatingDevices((prev) => {
                const newSet = new Set(prev);
                newSet.delete(deviceId);
                return newSet;
            });
        }
    };

    return (
        <AppLayout>
            <Head title={`Edit Line ${line.pattern}`} />
            <div className="p-0">
                <div className="p-6">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <button
                            onClick={() => router.visit('/lines')}
                            className="flex items-center space-x-1 transition-colors hover:text-foreground"
                        >
                            <Phone className="h-4 w-4" />
                            <span>Lines</span>
                        </button>
                        <ChevronRight className="h-4 w-4" />
                        <div className="flex items-center space-x-1 text-foreground">
                            <span>{line.pattern}</span>
                        </div>
                    </nav>

                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 mt-4 flex items-center justify-between border-b bg-background/95 pt-4 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                        <div className="flex items-center gap-6">
                            <div>
                                <h1 className="text-2xl font-bold">Edit Line {line.pattern}</h1>
                                <p className="text-sm text-muted-foreground">
                                    {line.description || 'No description'} • {line.usage}
                                    {associatedDevices.length > 0 && (
                                        <span>
                                            {' '}
                                            • {associatedDevices.length} associated device{associatedDevices.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>

                    {/* Line Configuration Form */}
                    <div className="mt-6">
                        <LineConfigurationForm
                            line={currentLine}
                            onLineChange={setCurrentLine}
                            onHasChanges={setHasChanges}
                            associatedDevices={associatedDevices}
                            onDissociateDevice={handleDissociateDevice}
                            dissociatingDevices={dissociatingDevices}
                            showDirectoryNumberField={false} // Don't show directory number field in line edit
                            showAssociatedDevices={true} // Show associated devices
                        />
                    </div>

                    {/* Additional Line-Specific Sections */}
                    <div className="mt-6 space-y-4">
                        {/* Route Partition Information */}
                        <div className="overflow-hidden rounded-lg border bg-card shadow">
                            <div className="border-b p-6">
                                <h3 className="text-lg font-semibold">Route Partition Information</h3>
                                <p className="text-sm text-muted-foreground">Current route partition assignment</p>
                            </div>
                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Route Partition</label>
                                        <div className="w-full rounded-md border bg-muted p-2 text-sm">
                                            {currentLine.routePartitionName?._ || 'None'}
                                        </div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Route partitions control call routing and access. This is set during line creation.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Pattern Usage</label>
                                        <div className="w-full rounded-md border bg-muted p-2 text-sm">{currentLine.usage}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">Indicates how this pattern is used in the dial plan.</p>
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

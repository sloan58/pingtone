import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import LineConfigurationForm from '@/components/LineConfigurationForm';
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(`/api/lines/${line.uuid}`, currentLine);
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

    const handleDissociateDevice = async (deviceId: string, deviceName: string) => {
        if (!confirm(`Are you sure you want to dissociate "${deviceName}" from this line?`)) {
            return;
        }

        try {
            const response = await axios.post(`/api/devices/${deviceId}/dissociate-line/${line._id}`);
            toast.success(`Device "${deviceName}" dissociated successfully`);

            // Refresh the page to update associated devices
            router.reload({ only: ['associatedDevices'] });
        } catch (error: any) {
            console.error('Dissociation failed:', error);
            toast.error(error.response?.data?.error || 'Failed to dissociate device');
        }
    };

    return (
        <AppShell variant="sidebar">
            <Head title={`Edit Line ${line.pattern}`} />
            <AppSidebar />
            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />
                <AppContent variant="sidebar" className="p-0">
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
                                dissociatingDevices={new Set()}
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
                </AppContent>
            </div>
        </AppShell>
    );
}

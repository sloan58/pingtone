import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { ChevronRight, Loader2, Phone, Settings } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
    ucm_id?: string;
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

    // State for cached options
    const [presenceGroups, setPresenceGroups] = useState<any[]>([]);
    const [externalCallControlProfiles, setExternalCallControlProfiles] = useState<any[]>([]);
    const [voicemailProfiles, setVoicemailProfiles] = useState<any[]>([]);
    const [callingSearchSpaces, setCallingSearchSpaces] = useState<any[]>([]);
    const [mohAudioSources, setMohAudioSources] = useState<any[]>([]);
    const [routePartitions, setRoutePartitions] = useState<any[]>([]);
    const [aarGroups, setAarGroups] = useState<any[]>([]);
    const [callPickupGroups, setCallPickupGroups] = useState<any[]>([]);

    // State for device dissociation
    const [dissociatingDevices, setDissociatingDevices] = useState<Set<string>>(new Set());

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

    // Placeholder fetch functions for AsyncComboboxes
    const fetchPresenceGroupOptions = async (query: string) => {
        // Filter cached presence groups based on query
        const filtered = presenceGroups
            .filter((item: any) => (item.name || item._ || '').toLowerCase().includes(query.toLowerCase()))
            .map((item: any) => ({
                value: item.uuid || item.id,
                label: item.name || item._,
            }));
        return filtered;
    };

    const fetchCallingSearchSpaceOptions = async (query: string) => {
        // Filter cached calling search spaces based on query
        const filtered = callingSearchSpaces
            .filter((item: any) => (item.name || item._ || '').toLowerCase().includes(query.toLowerCase()))
            .map((item: any) => ({
                value: item.uuid || item.id,
                label: item.name || item._,
            }));
        return filtered;
    };

    const fetchVoiceMailProfileOptions = async (query: string) => {
        // Filter cached voicemail profiles based on query
        const filtered = voicemailProfiles
            .filter((item: any) => (item.name || item._ || '').toLowerCase().includes(query.toLowerCase()))
            .map((item: any) => ({
                value: item.uuid || item.id,
                label: item.name || item._,
            }));
        return filtered;
    };

    const fetchMohAudioSourceOptions = async (query: string) => {
        // Filter cached MOH audio sources based on query
        const filtered = mohAudioSources
            .filter((item: any) => (item.name || item._ || '').toLowerCase().includes(query.toLowerCase()))
            .map((item: any) => ({
                value: item.sourceId || item.uuid || item.name,
                label: item.name || item._,
            }));
        return filtered;
    };

    const fetchCallPickupGroupOptions = async (query: string) => {
        // TODO: Implement API call to search for Call Pickup Groups
        console.log('Searching Call Pickup Groups for:', query);
        return Promise.resolve([
            { value: 'uuid1', label: 'None' },
            { value: 'uuid2', label: 'Sales Pickup Group' },
        ]);
    };

    const fetchExternalCallControlProfileOptions = async (query: string) => {
        // Filter cached external call control profiles based on query
        const filtered = externalCallControlProfiles
            .filter((item: any) => (item.name || item._ || '').toLowerCase().includes(query.toLowerCase()))
            .map((item: any) => ({
                value: item.uuid || item.id,
                label: item.name || item._,
            }));
        return filtered;
    };

    // Hover functions for onMouseEnter
    const loadPresenceGroups = async () => {
        if (presenceGroups.length === 0) {
            try {
                const response = await axios.get(`/api/ucm/${phone.ucm_id}/options/presence-groups`);
                setPresenceGroups(response.data);
            } catch (error) {
                console.error('Failed to load presence groups:', error);
            }
        }
    };

    const loadExternalCallControlProfiles = async () => {
        if (externalCallControlProfiles.length === 0) {
            try {
                const response = await axios.get(`/api/ucm/${phone.ucm_id}/options/external-call-control-profiles`);
                setExternalCallControlProfiles(response.data);
            } catch (error) {
                console.error('Failed to load external call control profiles:', error);
            }
        }
    };

    const loadVoicemailProfiles = async () => {
        if (voicemailProfiles.length === 0) {
            try {
                const response = await axios.get(`/api/ucm/${phone.ucm_id}/options/voicemail-profiles`);
                setVoicemailProfiles(response.data);
            } catch (error) {
                console.error('Failed to load voicemail profiles:', error);
            }
        }
    };

    const loadCallingSearchSpaces = async () => {
        if (callingSearchSpaces.length === 0) {
            try {
                const response = await axios.get(`/api/ucm/${phone.ucm_id}/options/calling-search-spaces`);
                setCallingSearchSpaces(response.data);
            } catch (error) {
                console.error('Failed to load calling search spaces:', error);
            }
        }
    };

    const loadMohAudioSources = async () => {
        if (mohAudioSources.length === 0) {
            try {
                const response = await axios.get(`/api/ucm/${phone.ucm_id}/options/moh-audio-sources`);
                setMohAudioSources(response.data);
            } catch (error) {
                console.error('Failed to load MOH audio sources:', error);
            }
        }
    };

    const loadRoutePartitions = async () => {
        if (routePartitions.length === 0) {
            try {
                const response = await axios.get(`/api/ucm/${phone.ucm_id}/options/route-partitions`);
                setRoutePartitions(response.data);
            } catch (error) {
                console.error('Failed to load route partitions:', error);
            }
        }
    };

    const loadAarGroups = async () => {
        if (aarGroups.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${phone.ucm_id}/options/aar-groups`);
                const responseData = await response.json();
                setAarGroups(responseData);
            } catch (error) {
                console.error('Failed to load AAR groups:', error);
            }
        }
    };

    const loadCallPickupGroups = async () => {
        if (callPickupGroups.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${phone.ucm_id}/options/call-pickup-groups`);
                const responseData = await response.json();
                setCallPickupGroups(responseData);
            } catch (error) {
                console.error('Failed to load Call Pickup Groups:', error);
            }
        }
    };

    const fetchRoutePartitionOptions = async (query: string) => {
        // TODO: Implement API call to search for Route Partitions
        console.log('Searching Route Partitions for:', query);
        return Promise.resolve([
            { value: 'uuid1', label: 'None' },
            { value: 'uuid2', label: 'PT_Internal' },
        ]);
    };

    const fetchAarNeighborhoodOptions = async (query: string) => {
        // TODO: Implement API call to search for AAR Neighborhoods
        console.log('Searching AAR Neighborhoods for:', query);
        return Promise.resolve([
            { value: 'uuid1', label: 'None' },
            { value: 'uuid2', label: 'AAR_HQ' },
        ]);
    };

    const fetchCallControlAgentProfileOptions = async (query: string) => {
        // TODO: Implement API call to search for Call Control Agent Profiles
        console.log('Searching Call Control Agent Profiles for:', query);
        return Promise.resolve([
            { value: 'uuid1', label: 'None' },
            { value: 'uuid2', label: 'CCAP_Default' },
        ]);
    };

    // Function to get current display value for the line (reflects any changes made)
    const getCurrentLineDisplayValue = () => {
        return currentLine.patternAndPartition || `${currentLine.pattern} in ${currentLine.routePartitionName?._ || 'None'}`;
    };

    // Function to handle device dissociation
    const handleDissociateDevice = async (deviceId: string, deviceName: string) => {
        if (dissociatingDevices.has(deviceId)) return;

        setDissociatingDevices((prev) => new Set(prev).add(deviceId));

        try {
            // TODO: Implement API call to dissociate device from line
            // This would require an endpoint like: POST /api/phones/{deviceId}/lines/{lineId}/dissociate
            console.log('Dissociating device:', deviceId, 'from line:', line.uuid);

            // Simulate API call for now
            await new Promise((resolve) => setTimeout(resolve, 1000));

            toast.success('Device dissociated successfully', {
                description: `${deviceName} has been removed from this line.`,
            });

            // Remove the device from the local state
            if (associatedDevices) {
                const updatedDevices = associatedDevices.filter((device) => device.id !== deviceId);
                // Note: In a real implementation, you'd want to update the parent component's state
                // or refetch the associated devices from the server
            }
        } catch (error) {
            console.error('Error dissociating device:', error);
            toast.error('Failed to dissociate device', {
                description: 'An error occurred while removing the device from this line.',
            });
        } finally {
            setDissociatingDevices((prev) => {
                const newSet = new Set(prev);
                newSet.delete(deviceId);
                return newSet;
            });
        }
    };

    // Reusable collapsible card section
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
        const handleOpenChange = (open: boolean) => {
            try {
                window.localStorage.setItem(storageKey, open ? 'open' : 'closed');
            } catch {}
        };
        return (
            <Collapsible defaultOpen={initialOpen} onOpenChange={handleOpenChange}>
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

    return (
        <AppShell variant="sidebar">
            <Head title={`Edit Button ${buttonIndex} - ${phone.name}`} />
            <AppSidebar />
            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />
                <AppContent variant="sidebar" className="p-0">
                    <div className="p-6">
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

                        {/* Sticky Header */}
                        <div className="sticky top-0 z-10 mt-4 flex items-center justify-between border-b bg-background/95 pt-4 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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

                        <div className="mt-4 space-y-4">
                            {/* Directory Number Information */}
                            <SectionCard
                                title="Directory Number Information"
                                description="Basic directory number configuration and device associations"
                                defaultOpen
                            >
                                <div className="grid grid-cols-1 gap-6">
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
                                        <label className="mb-1 block text-sm font-medium">Alerting Name</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border bg-background p-2"
                                            value={currentLine.alertingName || ''}
                                            onChange={(e) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    alertingName: e.target.value,
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Enter alerting name"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">ASCII Alerting Name</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border bg-background p-2"
                                            value={currentLine.asciiAlertingName || ''}
                                            onChange={(e) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    asciiAlertingName: e.target.value,
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Enter ASCII alerting name"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">External Call Control Profile</label>
                                        <AsyncCombobox
                                            value={currentLine.externalCallControlProfileName?.uuid || ''}
                                            onValueChange={(value, selectedOption) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    externalCallControlProfileName: {
                                                        _: selectedOption?.label || '',
                                                        uuid: value,
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Search for external call control profile..."
                                            searchPlaceholder="Type to search profiles..."
                                            emptyMessage="No external call control profiles found."
                                            loadingMessage="Searching profiles..."
                                            fetchOptions={fetchExternalCallControlProfileOptions}
                                            displayValue={currentLine.externalCallControlProfileName?._ || ''}
                                            onMouseEnter={loadExternalCallControlProfiles}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Allow Control of Device from CTI</label>
                                        <div className="flex items-center space-x-3">
                                            <Switch
                                                checked={currentLine.allowCtiControlFlag === 'true' || currentLine.allowCtiControlFlag === true}
                                                onCheckedChange={(checked) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        allowCtiControlFlag: checked ? 'true' : 'false',
                                                    });
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {currentLine.allowCtiControlFlag === 'true' || currentLine.allowCtiControlFlag === true
                                                    ? 'Enabled'
                                                    : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* AAR Settings */}
                            <SectionCard title="AAR Settings" description="Automated Alternate Routing settings">
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="flex items-center space-x-3">
                                        <Switch
                                            checked={currentLine.aarVoiceMailEnabled === 'true' || currentLine.aarVoiceMailEnabled === true}
                                            onCheckedChange={(checked) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    aarVoiceMailEnabled: checked ? 'true' : 'false',
                                                });
                                                setHasChanges(true);
                                            }}
                                        />
                                        <span className="text-sm font-medium">Voice Mail</span>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">AAR Destination Mask</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border bg-background p-2"
                                            value={currentLine.aarDestinationMask || ''}
                                            onChange={(e) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    aarDestinationMask: e.target.value,
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Enter AAR destination mask"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">AAR Group</label>
                                        <AsyncCombobox
                                            value={
                                                typeof currentLine.aarNeighborhoodName === 'string' ? '' : currentLine.aarNeighborhoodName?.uuid || ''
                                            }
                                            onValueChange={(value, selectedOption) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    aarNeighborhoodName: {
                                                        _: selectedOption?.label || '',
                                                        uuid: value,
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Select AAR group..."
                                            searchPlaceholder="Search AAR groups..."
                                            emptyMessage="No AAR groups found."
                                            loadingMessage="Loading AAR groups..."
                                            fetchOptions={async (query: string) => {
                                                return aarGroups
                                                    .filter((o: any) => o.name.toLowerCase().includes(query.toLowerCase()))
                                                    .map((o: any) => ({ value: o.uuid, label: o.name }));
                                            }}
                                            displayValue={
                                                typeof currentLine.aarNeighborhoodName === 'string'
                                                    ? currentLine.aarNeighborhoodName
                                                    : currentLine.aarNeighborhoodName?._ || ''
                                            }
                                            onMouseEnter={loadAarGroups}
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 flex items-center space-x-3">
                                    <Switch
                                        checked={currentLine.aarKeepCallHistory === 'true' || currentLine.aarKeepCallHistory === true}
                                        onCheckedChange={(checked) => {
                                            setCurrentLine({
                                                ...currentLine,
                                                aarKeepCallHistory: checked ? 'true' : 'false',
                                            });
                                            setHasChanges(true);
                                        }}
                                    />
                                    <span className="text-sm">Retain this destination in the call forwarding history</span>
                                </div>
                            </SectionCard>

                            {/* Associated Devices */}
                            {associatedDevices && associatedDevices.length > 0 && (
                                <SectionCard title="Associated Devices" description="Other devices using this line">
                                    <div className="space-y-4">
                                        {associatedDevices.map((device) => (
                                            <div
                                                key={device.id}
                                                className={`flex items-center justify-between rounded-lg border p-4 ${
                                                    device.id === phone.id ? 'border-primary bg-primary/5' : 'border-border bg-background'
                                                }`}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div
                                                        className={`h-3 w-3 rounded-full ${
                                                            device.id === phone.id ? 'bg-primary' : 'bg-muted-foreground/20'
                                                        }`}
                                                    />
                                                    <div>
                                                        <h3 className="font-medium">{device.name}</h3>
                                                        <p className="text-sm text-muted-foreground capitalize">{device.class}</p>
                                                    </div>
                                                    {device.id === phone.id && (
                                                        <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                                                            Current Device
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {device.id !== phone.id && (
                                                        <>
                                                            <button
                                                                onClick={() => router.visit(`/phones/${device.id}/edit`)}
                                                                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                                            >
                                                                Edit Device
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    router.visit(`/phones/${device.id}/edit/button/${buttonIndex}?type=line`)
                                                                }
                                                                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                                            >
                                                                Edit Line
                                                            </button>
                                                            <button
                                                                onClick={() => handleDissociateDevice(device.id, device.name)}
                                                                disabled={dissociatingDevices.has(device.id)}
                                                                className="inline-flex items-center justify-center rounded-md border border-destructive bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                                            >
                                                                {dissociatingDevices.has(device.id) ? (
                                                                    <>
                                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                        Dissociating...
                                                                    </>
                                                                ) : (
                                                                    'Dissociate'
                                                                )}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        <div className="mt-4 rounded-lg border border-dashed border-muted-foreground/25 p-4">
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">
                                                    Line sharing allows multiple devices to use the same directory number. Each device can have
                                                    different settings for how the line behaves.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </SectionCard>
                            )}

                            {/* Directory Number Settings */}
                            <SectionCard title="Directory Number Settings" description="Call routing and feature configuration">
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Voice Mail Profile</label>
                                        <AsyncCombobox
                                            value={currentLine.voiceMailProfileName?.uuid || ''}
                                            onValueChange={(value, selectedOption) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    voiceMailProfileName: {
                                                        _: selectedOption?.label || '',
                                                        uuid: value,
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Search for voice mail profile..."
                                            searchPlaceholder="Type to search voice mail profiles..."
                                            emptyMessage="No voice mail profiles found."
                                            loadingMessage="Searching voice mail profiles..."
                                            fetchOptions={fetchVoiceMailProfileOptions}
                                            displayValue={currentLine.voiceMailProfileName?._ || ''}
                                            onMouseEnter={loadVoicemailProfiles}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Calling Search Space</label>
                                        <AsyncCombobox
                                            value={currentLine.shareLineAppearanceCssName?.uuid || ''}
                                            onValueChange={(value, selectedOption) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    shareLineAppearanceCssName: {
                                                        _: selectedOption?.label || '',
                                                        uuid: value,
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Search for calling search space..."
                                            searchPlaceholder="Type to search calling search spaces..."
                                            emptyMessage="No calling search spaces found."
                                            loadingMessage="Searching calling search spaces..."
                                            fetchOptions={fetchCallingSearchSpaceOptions}
                                            displayValue={currentLine.shareLineAppearanceCssName?._ || ''}
                                            onMouseEnter={loadCallingSearchSpaces}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">BLF Presence Group</label>
                                        <AsyncCombobox
                                            value={currentLine.presenceGroupName?.uuid || ''}
                                            onValueChange={(value, selectedOption) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    presenceGroupName: {
                                                        _: selectedOption?.label || '',
                                                        uuid: value,
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Search for presence group..."
                                            searchPlaceholder="Type to search presence groups..."
                                            emptyMessage="No presence groups found."
                                            loadingMessage="Searching presence groups..."
                                            fetchOptions={fetchPresenceGroupOptions}
                                            displayValue={currentLine.presenceGroupName?._ || ''}
                                            onMouseEnter={loadPresenceGroups}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">User Hold MOH Audio Source</label>
                                        <AsyncCombobox
                                            value={currentLine.userHoldMohAudioSourceId || ''}
                                            onValueChange={(value, selectedOption) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    userHoldMohAudioSourceId: value,
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Search for MOH audio source..."
                                            searchPlaceholder="Type to search MOH audio sources..."
                                            emptyMessage="No MOH audio sources found."
                                            loadingMessage="Searching MOH audio sources..."
                                            fetchOptions={fetchMohAudioSourceOptions}
                                            displayValue={(() => {
                                                const selectedAudioSource = (mohAudioSources || []).find(
                                                    (audioSource) =>
                                                        String(audioSource.sourceId || audioSource.uuid || audioSource.name) ===
                                                        String(currentLine.userHoldMohAudioSourceId),
                                                );
                                                return selectedAudioSource ? selectedAudioSource.name : '';
                                            })()}
                                            onMouseEnter={loadMohAudioSources}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Network Hold MOH Audio Source</label>
                                        <AsyncCombobox
                                            value={currentLine.networkHoldMohAudioSourceId || ''}
                                            onValueChange={(value, selectedOption) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    networkHoldMohAudioSourceId: value,
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Search for MOH audio source..."
                                            searchPlaceholder="Type to search MOH audio sources..."
                                            emptyMessage="No MOH audio sources found."
                                            loadingMessage="Searching MOH audio sources..."
                                            fetchOptions={fetchMohAudioSourceOptions}
                                            displayValue={(() => {
                                                const selectedAudioSource = (mohAudioSources || []).find(
                                                    (audioSource) =>
                                                        String(audioSource.sourceId || audioSource.uuid || audioSource.name) ===
                                                        String(currentLine.networkHoldMohAudioSourceId),
                                                );
                                                return selectedAudioSource ? selectedAudioSource.name : '';
                                            })()}
                                            onMouseEnter={loadMohAudioSources}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Calling Line ID Presentation When Diverted</label>
                                        <Select
                                            value={currentLine.callingIdPresentationWhenDiverted || ''}
                                            onValueChange={(value) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    callingIdPresentationWhenDiverted: value,
                                                });
                                                setHasChanges(true);
                                            }}
                                        >
                                            <SelectTrigger className="w-full bg-background">
                                                <SelectValue placeholder="Select option" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Default">Determined by Last Hop</SelectItem>
                                                <SelectItem value="Allowed">Allowed</SelectItem>
                                                <SelectItem value="Restricted">Restricted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Reject Anonymous Calls</label>
                                        <div className="flex items-center space-x-3">
                                            <Switch
                                                checked={currentLine.rejectAnonymousCall === 'true' || currentLine.rejectAnonymousCall === true}
                                                onCheckedChange={(checked) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        rejectAnonymousCall: checked ? 'true' : 'false',
                                                    });
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {currentLine.rejectAnonymousCall === 'true' || currentLine.rejectAnonymousCall === true
                                                    ? 'Enabled'
                                                    : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* External Presentation Information */}
                            <SectionCard
                                title="External Presentation Information"
                                description="How caller information is presented to external parties"
                            >
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Anonymous External Presentation</label>
                                        <div className="flex items-center space-x-3">
                                            <Switch
                                                checked={
                                                    currentLine.externalPresentationInfo?.isAnonymous === 't' ||
                                                    currentLine.externalPresentationInfo?.isAnonymous === true
                                                }
                                                onCheckedChange={(checked) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        externalPresentationInfo: checked
                                                            ? { isAnonymous: 't' }
                                                            : {
                                                                  presentationInfo: {
                                                                      externalPresentationNumber: '',
                                                                      externalPresentationName: '',
                                                                  },
                                                              },
                                                    });
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {currentLine.externalPresentationInfo?.isAnonymous === 't' ||
                                                currentLine.externalPresentationInfo?.isAnonymous === true
                                                    ? 'Enabled'
                                                    : 'Disabled'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">External Presentation Number</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border bg-background p-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={currentLine.externalPresentationInfo?.presentationInfo?.externalPresentationNumber || ''}
                                            onChange={(e) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    externalPresentationInfo: {
                                                        ...currentLine.externalPresentationInfo,
                                                        presentationInfo: {
                                                            ...currentLine.externalPresentationInfo?.presentationInfo,
                                                            externalPresentationNumber: e.target.value,
                                                        },
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Enter external presentation number"
                                            disabled={
                                                currentLine.externalPresentationInfo?.isAnonymous === 't' ||
                                                currentLine.externalPresentationInfo?.isAnonymous === true
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">External Presentation Name</label>
                                        <input
                                            type="text"
                                            className="w-full rounded-md border bg-background p-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={currentLine.externalPresentationInfo?.presentationInfo?.externalPresentationName || ''}
                                            onChange={(e) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    externalPresentationInfo: {
                                                        ...currentLine.externalPresentationInfo,
                                                        presentationInfo: {
                                                            ...currentLine.externalPresentationInfo?.presentationInfo,
                                                            externalPresentationName: e.target.value,
                                                        },
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Enter external presentation name"
                                            disabled={
                                                currentLine.externalPresentationInfo?.isAnonymous === 't' ||
                                                currentLine.externalPresentationInfo?.isAnonymous === true
                                            }
                                        />
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Enterprise Alternate Number */}
                            <SectionCard title="Enterprise Alternate Number" description="Configure enterprise alternate number settings">
                                {currentLine.useEnterpriseAltNum === 'true' || currentLine.useEnterpriseAltNum === true ? (
                                    // Show the enterprise alt num form when enabled
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Number Mask</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-md border bg-background p-2"
                                                value={currentLine.enterpriseAltNum?.numMask || ''}
                                                onChange={(e) => {
                                                    const mask = e.target.value;
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        enterpriseAltNum: {
                                                            ...currentLine.enterpriseAltNum,
                                                            numMask: mask,
                                                        },
                                                    });
                                                    setHasChanges(true);
                                                }}
                                                placeholder="Enter number mask (e.g., 2XXX, +1234)"
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Use digits 0-9, X for wildcards, or + for E.164. + must be first character.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Alternate Number</label>
                                            <div className="w-full rounded-md border bg-muted p-2 text-sm text-muted-foreground">
                                                {(() => {
                                                    const mask = currentLine.enterpriseAltNum?.numMask || '';
                                                    const directoryNumber = currentLine.pattern || '1002';

                                                    if (!mask) return directoryNumber;

                                                    // Handle E.164 format (starts with +)
                                                    if (mask.startsWith('+')) {
                                                        return mask;
                                                    }

                                                    // Validate mask format
                                                    const validMask = /^[0-9X]+$/.test(mask);
                                                    if (!validMask) {
                                                        return <span className="font-medium text-red-500">Invalid mask format</span>;
                                                    }

                                                    // Apply mask to directory number
                                                    let result = '';
                                                    const dirNumStr = directoryNumber.toString();

                                                    // Process each character in the mask
                                                    for (let i = 0; i < mask.length; i++) {
                                                        const maskChar = mask[i];
                                                        const dirNumChar = dirNumStr[i];

                                                        if (maskChar === 'X') {
                                                            // Keep original digit if available
                                                            result += dirNumChar || '';
                                                        } else if (maskChar && /[0-9]/.test(maskChar)) {
                                                            // Use mask digit
                                                            result += maskChar;
                                                        }
                                                    }

                                                    return result || 'Invalid mask';
                                                })()}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Route Partition</label>
                                                <AsyncCombobox
                                                    value={currentLine.enterpriseAltNum?.routePartition?.uuid || ''}
                                                    onValueChange={(value, selectedOption) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            enterpriseAltNum: {
                                                                ...currentLine.enterpriseAltNum,
                                                                routePartition: {
                                                                    _: selectedOption?.label || '',
                                                                    uuid: value,
                                                                },
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Search for route partition..."
                                                    searchPlaceholder="Type to search route partitions..."
                                                    emptyMessage="No route partitions found."
                                                    loadingMessage="Searching route partitions..."
                                                    fetchOptions={async (query: string) => {
                                                        // Filter cached route partitions
                                                        return routePartitions
                                                            .filter((option) => option.name.toLowerCase().includes(query.toLowerCase()))
                                                            .map((option) => ({
                                                                value: option.uuid,
                                                                label: option.name,
                                                            }));
                                                    }}
                                                    displayValue={currentLine.enterpriseAltNum?.routePartition?._ || ''}
                                                    onMouseEnter={loadRoutePartitions}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Switch
                                                    checked={
                                                        currentLine.enterpriseAltNum?.isUrgent === 'true' ||
                                                        currentLine.enterpriseAltNum?.isUrgent === true
                                                    }
                                                    onCheckedChange={(checked) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            enterpriseAltNum: {
                                                                ...currentLine.enterpriseAltNum,
                                                                isUrgent: checked ? 'true' : 'false',
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                />
                                                <span className="text-sm font-medium">Is Urgent</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Switch
                                                checked={
                                                    currentLine.enterpriseAltNum?.addLocalRoutePartition === 'true' ||
                                                    currentLine.enterpriseAltNum?.addLocalRoutePartition === true
                                                }
                                                onCheckedChange={(checked) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        enterpriseAltNum: {
                                                            ...currentLine.enterpriseAltNum,
                                                            addLocalRoutePartition: checked ? 'true' : 'false',
                                                        },
                                                    });
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <span className="text-sm font-medium">Add to Local Route Partition</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Switch
                                                checked={
                                                    currentLine.enterpriseAltNum?.advertiseGloballyIls === 'true' ||
                                                    currentLine.enterpriseAltNum?.advertiseGloballyIls === true
                                                }
                                                onCheckedChange={(checked) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        enterpriseAltNum: {
                                                            ...currentLine.enterpriseAltNum,
                                                            advertiseGloballyIls: checked ? 'true' : 'false',
                                                        },
                                                    });
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <span className="text-sm font-medium">Advertise Globally via ILS</span>
                                        </div>
                                        <div className="pt-4">
                                            <button
                                                onClick={() => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        useEnterpriseAltNum: 'false',
                                                        enterpriseAltNum: undefined,
                                                    });
                                                    setHasChanges(true);
                                                }}
                                                className="inline-flex items-center justify-center rounded-md border border-destructive bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                            >
                                                Remove Enterprise Alternate Number
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // Show add button when disabled
                                    <div>
                                        <button
                                            onClick={() => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    useEnterpriseAltNum: 'true',
                                                    enterpriseAltNum: {
                                                        numMask: '',
                                                        isUrgent: 'false',
                                                        addLocalRoutePartition: 'false',
                                                        routePartition: { _: '', uuid: '' },
                                                        advertiseGloballyIls: 'false',
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        >
                                            Add Enterprise Alternate Number
                                        </button>
                                    </div>
                                )}
                            </SectionCard>

                            {/* +E.164 Alternate Number */}
                            <SectionCard title="+E.164 Alternate Number" description="Configure +E.164 alternate number settings" defaultOpen={false}>
                                {currentLine.useE164AltNum === 'true' || currentLine.useE164AltNum === true ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Number Mask</label>
                                            <input
                                                type="text"
                                                className="w-full rounded-md border bg-background p-2"
                                                value={currentLine.e164AltNum?.numMask || ''}
                                                onChange={(e) => {
                                                    const mask = e.target.value;
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        e164AltNum: {
                                                            ...currentLine.e164AltNum,
                                                            numMask: mask,
                                                        },
                                                    });
                                                    setHasChanges(true);
                                                }}
                                                placeholder="Enter number mask (e.g., +1234)"
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Use digits 0-9, X for wildcards, or + for E.164. + must be first character.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Alternate Number</label>
                                            <div className="w-full rounded-md border bg-muted p-2 text-sm text-muted-foreground">
                                                {(() => {
                                                    const mask = currentLine.e164AltNum?.numMask || '';
                                                    const directoryNumber = currentLine.pattern || '1002';

                                                    if (!mask) return directoryNumber;

                                                    // Handle E.164 format (starts with +)
                                                    if (mask.startsWith('+')) {
                                                        return mask;
                                                    }

                                                    // Validate mask format
                                                    const validMask = /^[0-9X]+$/.test(mask);
                                                    if (!validMask) {
                                                        return <span className="font-medium text-red-500">Invalid mask format</span>;
                                                    }

                                                    // Apply mask to directory number
                                                    let result = '';
                                                    const dirNumStr = directoryNumber.toString();

                                                    // Process each character in the mask
                                                    for (let i = 0; i < mask.length; i++) {
                                                        const maskChar = mask[i];
                                                        const dirNumChar = dirNumStr[i];

                                                        if (maskChar === 'X') {
                                                            // Keep original digit if available
                                                            result += dirNumChar || '';
                                                        } else if (maskChar && /[0-9]/.test(maskChar)) {
                                                            // Use mask digit
                                                            result += maskChar;
                                                        }
                                                    }

                                                    return result || 'Invalid mask';
                                                })()}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Route Partition</label>
                                                <AsyncCombobox
                                                    value={currentLine.e164AltNum?.routePartition?.uuid || ''}
                                                    onValueChange={(value, selectedOption) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            e164AltNum: {
                                                                ...currentLine.e164AltNum,
                                                                routePartition: {
                                                                    _: selectedOption?.label || '',
                                                                    uuid: value,
                                                                },
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Search for route partition..."
                                                    searchPlaceholder="Type to search route partitions..."
                                                    emptyMessage="No route partitions found."
                                                    loadingMessage="Searching route partitions..."
                                                    fetchOptions={async (query: string) => {
                                                        // Filter cached route partitions
                                                        return routePartitions
                                                            .filter((option) => option.name.toLowerCase().includes(query.toLowerCase()))
                                                            .map((option) => ({
                                                                value: option.uuid,
                                                                label: option.name,
                                                            }));
                                                    }}
                                                    displayValue={currentLine.e164AltNum?.routePartition?._ || ''}
                                                    onMouseEnter={loadRoutePartitions}
                                                />
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <Switch
                                                    checked={currentLine.e164AltNum?.isUrgent === 'true' || currentLine.e164AltNum?.isUrgent === true}
                                                    onCheckedChange={(checked) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            e164AltNum: {
                                                                ...currentLine.e164AltNum,
                                                                isUrgent: checked ? 'true' : 'false',
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                />
                                                <span className="text-sm font-medium">Is Urgent</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Switch
                                                checked={
                                                    currentLine.e164AltNum?.addLocalRoutePartition === 'true' ||
                                                    currentLine.e164AltNum?.addLocalRoutePartition === true
                                                }
                                                onCheckedChange={(checked) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        e164AltNum: {
                                                            ...currentLine.e164AltNum,
                                                            addLocalRoutePartition: checked ? 'true' : 'false',
                                                        },
                                                    });
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <span className="text-sm font-medium">Add to Local Route Partition</span>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <Switch
                                                checked={
                                                    currentLine.e164AltNum?.advertiseGloballyIls === 'true' ||
                                                    currentLine.e164AltNum?.advertiseGloballyIls === true
                                                }
                                                onCheckedChange={(checked) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        e164AltNum: {
                                                            ...currentLine.e164AltNum,
                                                            advertiseGloballyIls: checked ? 'true' : 'false',
                                                        },
                                                    });
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <span className="text-sm font-medium">Advertise Globally via ILS</span>
                                        </div>
                                        <div className="pt-4">
                                            <button
                                                onClick={() => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        useE164AltNum: 'false',
                                                        e164AltNum: undefined,
                                                    });
                                                    setHasChanges(true);
                                                }}
                                                className="inline-flex items-center justify-center rounded-md border border-destructive bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                            >
                                                Remove +E.164 Alternate Number
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <button
                                            onClick={() => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    useE164AltNum: 'true',
                                                    e164AltNum: {
                                                        numMask: '',
                                                        isUrgent: 'false',
                                                        addLocalRoutePartition: 'false',
                                                        routePartition: { _: '', uuid: '' },
                                                        advertiseGloballyIls: 'false',
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                        >
                                            Add +E.164 Alternate Number
                                        </button>
                                    </div>
                                )}
                            </SectionCard>

                            {/* Directory URIs */}
                            <SectionCard title="Directory URIs" description="Configure directory URI settings">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse border border-border">
                                        <thead>
                                            <tr className="bg-muted">
                                                <th className="border border-border p-2 text-left text-sm font-medium">Primary</th>
                                                <th className="border border-border p-2 text-left text-sm font-medium">URI</th>
                                                <th className="border border-border p-2 text-left text-sm font-medium">Partition</th>
                                                <th className="border border-border p-2 text-left text-sm font-medium">Advertise Globally via ILS</th>
                                                <th className="border border-border p-2 text-left text-sm font-medium">Remove</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(currentLine.directoryURIs?.directoryUri || []).map((uri, index) => (
                                                <tr key={index} className="border-b border-border">
                                                    <td className="border border-border p-2">
                                                        <input
                                                            type="radio"
                                                            name="primaryUri"
                                                            checked={uri.isPrimary === 't' || uri.isPrimary === true}
                                                            onChange={() => {
                                                                const updatedUris = (currentLine.directoryURIs?.directoryUri || []).map((u, i) => ({
                                                                    ...u,
                                                                    isPrimary: i === index ? 't' : 'f',
                                                                }));
                                                                setCurrentLine({
                                                                    ...currentLine,
                                                                    directoryURIs: {
                                                                        directoryUri: updatedUris,
                                                                    },
                                                                });
                                                                setHasChanges(true);
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                    </td>
                                                    <td className="border border-border p-2">
                                                        <input
                                                            type="text"
                                                            value={uri.uri || ''}
                                                            onChange={(e) => {
                                                                const updatedUris = [...(currentLine.directoryURIs?.directoryUri || [])];
                                                                updatedUris[index] = {
                                                                    ...updatedUris[index],
                                                                    uri: e.target.value,
                                                                };
                                                                setCurrentLine({
                                                                    ...currentLine,
                                                                    directoryURIs: {
                                                                        directoryUri: updatedUris,
                                                                    },
                                                                });
                                                                setHasChanges(true);
                                                            }}
                                                            className="w-full rounded border bg-background p-1 text-sm"
                                                            placeholder="Enter URI"
                                                        />
                                                    </td>
                                                    <td className="border border-border p-2">
                                                        <AsyncCombobox
                                                            value={uri.partition?.uuid || ''}
                                                            onValueChange={(value, selectedOption) => {
                                                                const updatedUris = [...(currentLine.directoryURIs?.directoryUri || [])];
                                                                updatedUris[index] = {
                                                                    ...updatedUris[index],
                                                                    partition: {
                                                                        _: selectedOption?.label || '',
                                                                        uuid: value,
                                                                    },
                                                                };
                                                                setCurrentLine({
                                                                    ...currentLine,
                                                                    directoryURIs: {
                                                                        directoryUri: updatedUris,
                                                                    },
                                                                });
                                                                setHasChanges(true);
                                                            }}
                                                            placeholder="Search for partition..."
                                                            searchPlaceholder="Type to search partitions..."
                                                            emptyMessage="No partitions found."
                                                            loadingMessage="Searching partitions..."
                                                            fetchOptions={async (query: string) => {
                                                                // Filter cached route partitions
                                                                return routePartitions
                                                                    .filter((option) => option.name.toLowerCase().includes(query.toLowerCase()))
                                                                    .map((option) => ({
                                                                        value: option.uuid,
                                                                        label: option.name,
                                                                    }));
                                                            }}
                                                            displayValue={uri.partition?._ || ''}
                                                            onMouseEnter={loadRoutePartitions}
                                                        />
                                                    </td>
                                                    <td className="border border-border p-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={uri.advertiseGloballyViaIls === 't' || uri.advertiseGloballyViaIls === true}
                                                            onChange={(e) => {
                                                                const updatedUris = [...(currentLine.directoryURIs?.directoryUri || [])];
                                                                updatedUris[index] = {
                                                                    ...updatedUris[index],
                                                                    advertiseGloballyViaIls: e.target.checked ? 't' : 'f',
                                                                };
                                                                setCurrentLine({
                                                                    ...currentLine,
                                                                    directoryURIs: {
                                                                        directoryUri: updatedUris,
                                                                    },
                                                                });
                                                                setHasChanges(true);
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                    </td>
                                                    <td className="border border-border p-2">
                                                        <button
                                                            onClick={() => {
                                                                const updatedUris = (currentLine.directoryURIs?.directoryUri || []).filter(
                                                                    (_, i) => i !== index,
                                                                );
                                                                setCurrentLine({
                                                                    ...currentLine,
                                                                    directoryURIs: {
                                                                        directoryUri: updatedUris,
                                                                    },
                                                                });
                                                                setHasChanges(true);
                                                            }}
                                                            className="inline-flex items-center justify-center rounded border border-destructive bg-background px-2 py-1 text-xs font-medium shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={() => {
                                            const newUri = {
                                                isPrimary: (currentLine.directoryURIs?.directoryUri || []).length === 0 ? 't' : 'f',
                                                uri: '',
                                                partition: { _: '', uuid: '' },
                                                advertiseGloballyViaIls: 'f',
                                            };
                                            const updatedUris = [...(currentLine.directoryURIs?.directoryUri || []), newUri];
                                            setCurrentLine({
                                                ...currentLine,
                                                directoryURIs: {
                                                    directoryUri: updatedUris,
                                                },
                                            });
                                            setHasChanges(true);
                                        }}
                                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                    >
                                        Add Row
                                    </button>
                                </div>
                            </SectionCard>

                            {/* PSTN Failover */}
                            <SectionCard
                                title="PSTN Failover for Enterprise Alternate Number, +E.164 Alternate Number, and URI Dialing"
                                description="Configure PSTN failover settings"
                            >
                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Advertised Failover Number</label>
                                        <Select
                                            value={(() => {
                                                const value = currentLine.pstnFailover;
                                                if (!value || value === '') return 'None';
                                                if (value === '100') return '100';
                                                if (value === '200') return '200';
                                                return 'None';
                                            })()}
                                            onValueChange={(value) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    pstnFailover: value === 'None' ? '' : value,
                                                });
                                                setHasChanges(true);
                                            }}
                                        >
                                            <SelectTrigger className="w-full bg-background">
                                                <SelectValue placeholder="Select failover number" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="None">None</SelectItem>
                                                <SelectItem value="100">Enterprise Number</SelectItem>
                                                <SelectItem value="200">+E.164 Number</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Call Forward and Call Pickup Settings */}
                            <SectionCard
                                title="Call Forward and Call Pickup Settings"
                                description="Calling Search Space, Voicemail, and reversion timers"
                            >
                                <div className="space-y-6">
                                    {/* Calling Search Space Activation Policy */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Calling Search Space Activation Policy</label>
                                        <Select
                                            value={currentLine.callingSearchSpaceActivationPolicy || 'Use System Default'}
                                            onValueChange={(value) => {
                                                setCurrentLine({ ...currentLine, callingSearchSpaceActivationPolicy: value });
                                                setHasChanges(true);
                                            }}
                                        >
                                            <SelectTrigger className="w-full bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Use System Default">Use System Default</SelectItem>
                                                <SelectItem value="With Configured CSS">With Configured CSS</SelectItem>
                                                <SelectItem value="With Originating Device CSS">With Originating Device CSS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Helper to render a single forward row */}
                                    {(
                                        [
                                            { key: 'callForwardAll', label: 'Forward All', hasDuration: false, hasSecondaryCss: true },
                                            { key: 'callForwardBusyInt', label: 'Forward Busy Internal', hasDuration: false },
                                            { key: 'callForwardBusy', label: 'Forward Busy External', hasDuration: false },
                                            { key: 'callForwardNoAnswerInt', label: 'Forward No Answer Internal', hasDuration: true },
                                            { key: 'callForwardNoAnswer', label: 'Forward No Answer External', hasDuration: true },
                                            { key: 'callForwardNoCoverageInt', label: 'Forward No Coverage Internal', hasDuration: false },
                                            { key: 'callForwardNoCoverage', label: 'Forward No Coverage External', hasDuration: false },
                                            { key: 'callForwardOnFailure', label: 'Forward on CTI Failure', hasDuration: false },
                                            { key: 'callForwardNotRegisteredInt', label: 'Forward Unregistered Internal', hasDuration: false },
                                            { key: 'callForwardNotRegistered', label: 'Forward Unregistered External', hasDuration: false },
                                        ] as const
                                    ).map((cfg) => {
                                        const cf: any = (currentLine as any)[cfg.key] || {};
                                        return (
                                            <div key={cfg.key} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                                <div className="flex items-center space-x-3">
                                                    <Switch
                                                        checked={cf.forwardToVoiceMail === 'true' || cf.forwardToVoiceMail === true}
                                                        onCheckedChange={(checked) => {
                                                            setCurrentLine({
                                                                ...currentLine,
                                                                [cfg.key]: {
                                                                    ...cf,
                                                                    forwardToVoiceMail: checked ? 'true' : 'false',
                                                                },
                                                            });
                                                            setHasChanges(true);
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium">{cfg.label}</span>
                                                </div>
                                                <div>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-md border bg-background p-2"
                                                        value={cf.destination || ''}
                                                        onChange={(e) => {
                                                            setCurrentLine({
                                                                ...currentLine,
                                                                [cfg.key]: { ...cf, destination: e.target.value },
                                                            });
                                                            setHasChanges(true);
                                                        }}
                                                        placeholder="Destination"
                                                    />
                                                    {cfg.hasDuration && (
                                                        <input
                                                            type="number"
                                                            className="mt-2 w-full rounded-md border bg-background p-2"
                                                            value={cf.duration || ''}
                                                            onChange={(e) => {
                                                                setCurrentLine({
                                                                    ...currentLine,
                                                                    [cfg.key]: { ...cf, duration: e.target.value },
                                                                });
                                                                setHasChanges(true);
                                                            }}
                                                            placeholder="Duration (seconds)"
                                                        />
                                                    )}
                                                </div>
                                                <div>
                                                    <AsyncCombobox
                                                        value={cf.callingSearchSpaceName?.uuid || ''}
                                                        onValueChange={(value, selectedOption) => {
                                                            setCurrentLine({
                                                                ...currentLine,
                                                                [cfg.key]: {
                                                                    ...cf,
                                                                    callingSearchSpaceName: { _: selectedOption?.label || '', uuid: value },
                                                                },
                                                            });
                                                            setHasChanges(true);
                                                        }}
                                                        placeholder="Select CSS"
                                                        searchPlaceholder="Search calling search spaces..."
                                                        emptyMessage="No calling search spaces found."
                                                        loadingMessage="Loading calling search spaces..."
                                                        fetchOptions={async (query: string) => {
                                                            return callingSearchSpaces
                                                                .filter((o: any) => o.name.toLowerCase().includes(query.toLowerCase()))
                                                                .map((o: any) => ({ value: o.uuid, label: o.name }));
                                                        }}
                                                        displayValue={cf.callingSearchSpaceName?._ || ''}
                                                        onMouseEnter={loadCallingSearchSpaces}
                                                    />
                                                    {cfg.hasSecondaryCss && (
                                                        <div className="mt-2">
                                                            <label className="mb-1 block text-xs text-muted-foreground">
                                                                Secondary Calling Search Space
                                                            </label>
                                                            <AsyncCombobox
                                                                value={cf.secondaryCallingSearchSpaceName?.uuid || ''}
                                                                onValueChange={(value, selectedOption) => {
                                                                    setCurrentLine({
                                                                        ...currentLine,
                                                                        [cfg.key]: {
                                                                            ...cf,
                                                                            secondaryCallingSearchSpaceName: {
                                                                                _: selectedOption?.label || '',
                                                                                uuid: value,
                                                                            },
                                                                        },
                                                                    });
                                                                    setHasChanges(true);
                                                                }}
                                                                placeholder="Select secondary CSS"
                                                                searchPlaceholder="Search calling search spaces..."
                                                                emptyMessage="No calling search spaces found."
                                                                loadingMessage="Loading calling search spaces..."
                                                                fetchOptions={async (query: string) => {
                                                                    return callingSearchSpaces
                                                                        .filter((o: any) => o.name.toLowerCase().includes(query.toLowerCase()))
                                                                        .map((o: any) => ({ value: o.uuid, label: o.name }));
                                                                }}
                                                                displayValue={cf.secondaryCallingSearchSpaceName?._ || ''}
                                                                onMouseEnter={loadCallingSearchSpaces}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* No Answer Ring Duration */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">No Answer Ring Duration (seconds)</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border bg-background p-2"
                                            value={currentLine.callForwardNoAnswer?.duration || ''}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setCurrentLine({
                                                    ...currentLine,
                                                    callForwardNoAnswer: {
                                                        ...(currentLine as any).callForwardNoAnswer,
                                                        duration: v,
                                                    },
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Duration (seconds)"
                                        />
                                    </div>

                                    {/* Call Pickup Group */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Call Pickup Group</label>
                                        <AsyncCombobox
                                            value={currentLine.callPickupGroupName?.uuid || ''}
                                            onValueChange={(value, selectedOption) => {
                                                setCurrentLine({
                                                    ...currentLine,
                                                    callPickupGroupName: { _: selectedOption?.label || '', uuid: value },
                                                });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Select call pickup group"
                                            searchPlaceholder="Search call pickup groups..."
                                            emptyMessage="No call pickup groups found."
                                            loadingMessage="Loading call pickup groups..."
                                            fetchOptions={async (query: string) => {
                                                return callPickupGroups
                                                    .filter((o: any) => o.name.toLowerCase().includes(query.toLowerCase()))
                                                    .map((o: any) => ({ value: o.uuid, label: o.name }));
                                            }}
                                            displayValue={currentLine.callPickupGroupName?._ || ''}
                                            onMouseEnter={loadCallPickupGroups}
                                        />
                                    </div>
                                </div>
                            </SectionCard>

                            {/* Park Monitoring */}
                            <SectionCard title="Park Monitoring" description="Configure park monitoring forwarding and reversion timer">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* External */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="flex items-center space-x-3">
                                            <Switch
                                                checked={
                                                    currentLine.parkMonForwardNoRetrieveVmEnabled === 'true' ||
                                                    currentLine.parkMonForwardNoRetrieveVmEnabled === true
                                                }
                                                onCheckedChange={(checked) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        parkMonForwardNoRetrieveVmEnabled: checked ? 'true' : 'false',
                                                    });
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <span className="text-sm font-medium">Voice Mail</span>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                Park Monitoring Forward No Retrieve Destination External
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full rounded-md border bg-background p-2"
                                                value={currentLine.parkMonForwardNoRetrieveDn || ''}
                                                onChange={(e) => {
                                                    setCurrentLine({ ...currentLine, parkMonForwardNoRetrieveDn: e.target.value });
                                                    setHasChanges(true);
                                                }}
                                                placeholder="Destination (external)"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Calling Search Space</label>
                                            <AsyncCombobox
                                                value={currentLine.parkMonForwardNoRetrieveCssName?.uuid || ''}
                                                onValueChange={(value, selectedOption) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        parkMonForwardNoRetrieveCssName: { _: selectedOption?.label || '', uuid: value },
                                                    });
                                                    setHasChanges(true);
                                                }}
                                                placeholder="Select CSS"
                                                searchPlaceholder="Search calling search spaces..."
                                                emptyMessage="No calling search spaces found."
                                                loadingMessage="Loading calling search spaces..."
                                                fetchOptions={async (query: string) =>
                                                    callingSearchSpaces
                                                        .filter((o: any) => o.name.toLowerCase().includes(query.toLowerCase()))
                                                        .map((o: any) => ({ value: o.uuid, label: o.name }))
                                                }
                                                displayValue={currentLine.parkMonForwardNoRetrieveCssName?._ || ''}
                                                onMouseEnter={loadCallingSearchSpaces}
                                            />
                                        </div>
                                    </div>

                                    {/* Internal */}
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                        <div className="flex items-center space-x-3">
                                            <Switch
                                                checked={
                                                    currentLine.parkMonForwardNoRetrieveIntVmEnabled === 'true' ||
                                                    currentLine.parkMonForwardNoRetrieveIntVmEnabled === true
                                                }
                                                onCheckedChange={(checked) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        parkMonForwardNoRetrieveIntVmEnabled: checked ? 'true' : 'false',
                                                    });
                                                    setHasChanges(true);
                                                }}
                                            />
                                            <span className="text-sm font-medium">Voice Mail</span>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                Park Monitoring Forward No Retrieve Destination Internal
                                            </label>
                                            <input
                                                type="text"
                                                className="w-full rounded-md border bg-background p-2"
                                                value={currentLine.parkMonForwardNoRetrieveIntDn || ''}
                                                onChange={(e) => {
                                                    setCurrentLine({ ...currentLine, parkMonForwardNoRetrieveIntDn: e.target.value });
                                                    setHasChanges(true);
                                                }}
                                                placeholder="Destination (internal)"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Calling Search Space</label>
                                            <AsyncCombobox
                                                value={currentLine.parkMonForwardNoRetrieveIntCssName?.uuid || ''}
                                                onValueChange={(value, selectedOption) => {
                                                    setCurrentLine({
                                                        ...currentLine,
                                                        parkMonForwardNoRetrieveIntCssName: { _: selectedOption?.label || '', uuid: value },
                                                    });
                                                    setHasChanges(true);
                                                }}
                                                placeholder="Select CSS"
                                                searchPlaceholder="Search calling search spaces..."
                                                emptyMessage="No calling search spaces found."
                                                loadingMessage="Loading calling search spaces..."
                                                fetchOptions={async (query: string) =>
                                                    callingSearchSpaces
                                                        .filter((o: any) => o.name.toLowerCase().includes(query.toLowerCase()))
                                                        .map((o: any) => ({ value: o.uuid, label: o.name }))
                                                }
                                                displayValue={currentLine.parkMonForwardNoRetrieveIntCssName?._ || ''}
                                                onMouseEnter={loadCallingSearchSpaces}
                                            />
                                        </div>
                                    </div>

                                    {/* Reversion Timer */}
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Park Monitoring Reversion Timer</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border bg-background p-2"
                                            value={currentLine.parkMonReversionTimer || ''}
                                            onChange={(e) => {
                                                setCurrentLine({ ...currentLine, parkMonReversionTimer: e.target.value });
                                                setHasChanges(true);
                                            }}
                                            placeholder="Seconds"
                                        />
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            A blank value will use the Park Monitoring Reversion Timer service parameter.
                                        </p>
                                    </div>
                                </div>
                            </SectionCard>

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
                </AppContent>
            </div>
        </AppShell>
    );
}

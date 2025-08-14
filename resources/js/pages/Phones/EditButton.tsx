import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AsyncCombobox } from '@/components/ui/async-combobox';
import { FormSection } from '@/components/ui/form-section';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    const [isSaving, setIsSaving] = useState(false);
    const [targetLineIndex, setTargetLineIndex] = useState(() => {
        // Find the index of this button in the phone's lines array
        const lines = Array.isArray(phone.lines?.line) ? phone.lines.line : [phone.lines?.line];
        return lines.findIndex((l: any) => l.index === buttonIndex.toString());
    });

    // State for cached options
    const [presenceGroups, setPresenceGroups] = useState<any[]>([]);
    const [externalCallControlProfiles, setExternalCallControlProfiles] = useState<any[]>([]);

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
        // TODO: Implement API call to search for Calling Search Spaces
        console.log('Searching Calling Search Spaces for:', query);
        return Promise.resolve([
            { value: 'uuid1', label: 'None' },
            { value: 'uuid2', label: 'CSS_Internal' },
        ]);
    };

    const fetchVoiceMailProfileOptions = async (query: string) => {
        // TODO: Implement API call to search for Voice Mail Profiles
        console.log('Searching Voice Mail Profiles for:', query);
        return Promise.resolve([
            { value: 'uuid1', label: 'None' },
            { value: 'uuid2', label: 'Standard Voicemail' },
        ]);
    };

    const fetchMohAudioSourceOptions = async (query: string) => {
        // TODO: Implement API call to search for MOH Audio Sources
        console.log('Searching MOH Audio Sources for:', query);
        return Promise.resolve([
            { value: 'uuid1', label: 'None' },
            { value: 'uuid2', label: 'Music On Hold 1' },
        ]);
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
                                </p>
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

                        <div className="grid grid-cols-1 gap-6">
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
                                                    value={currentLine.externalCallControlProfile?.uuid || ''}
                                                    onValueChange={(value, selectedOption) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            externalCallControlProfile: {
                                                                _: selectedOption?.label || '',
                                                                uuid: value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Search for external call control profile..."
                                                    searchPlaceholder="Type to search external call control profiles..."
                                                    emptyMessage="No external call control profiles found."
                                                    loadingMessage="Searching external call control profiles..."
                                                    fetchOptions={fetchExternalCallControlProfileOptions}
                                                    displayValue={currentLine.externalCallControlProfile?._ || ''}
                                                    onMouseEnter={loadExternalCallControlProfiles}
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Presence Group</label>
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
                                                <label className="mb-1 block text-sm font-medium">Share Line Appearance CSS Name *guess</label>
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
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Voice Mail Profile Name *guess</label>
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
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Pattern Precedence</label>
                                                <Select
                                                    value={currentLine.patternPrecedence || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            patternPrecedence: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select pattern precedence" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Default">Default</SelectItem>
                                                        <SelectItem value="Highest">Highest</SelectItem>
                                                        <SelectItem value="Lowest">Lowest</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Release Clause</label>
                                                <Select
                                                    value={currentLine.releaseClause || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            releaseClause: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select release clause" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="No Error">No Error</SelectItem>
                                                        <SelectItem value="Error">Error</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Allow CTI Control Flag</label>
                                                <Select
                                                    value={currentLine.allowCtiControlFlag || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            allowCtiControlFlag: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Reject Anonymous Call</label>
                                                <Select
                                                    value={currentLine.rejectAnonymousCall || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            rejectAnonymousCall: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Pattern Urgency</label>
                                                <Select
                                                    value={currentLine.patternUrgency || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            patternUrgency: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Auto Answer</label>
                                                <Select
                                                    value={currentLine.autoAnswer || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            autoAnswer: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select auto answer" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Auto Answer Off">Auto Answer Off</SelectItem>
                                                        <SelectItem value="Auto Answer On">Auto Answer On</SelectItem>
                                                        <SelectItem value="Auto Answer with Headset">Auto Answer with Headset</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Network Hold MOH Audio Source ID *guess</label>
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
                                                    displayValue={currentLine.networkHoldMohAudioSourceId || ''}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">User Hold MOH Audio Source ID *guess</label>
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
                                                    displayValue={currentLine.userHoldMohAudioSourceId || ''}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Calling ID Presentation When Diverted</label>
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
                                                        <SelectItem value="Default">Default</SelectItem>
                                                        <SelectItem value="Allow">Allow</SelectItem>
                                                        <SelectItem value="Restrict">Restrict</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </FormSection>

                                    <FormSection title="External Presentation Information">
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">External Presentation Number</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
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
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">External Presentation Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
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
                                                />
                                            </div>
                                        </div>
                                    </FormSection>

                                    <FormSection title="Enterprise Alternate Number">
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Use Enterprise Alt Num</label>
                                                <Select
                                                    value={currentLine.useEnterpriseAltNum || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            useEnterpriseAltNum: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Num Mask</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={currentLine.enterpriseAltNum?.numMask || ''}
                                                    onChange={(e) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            enterpriseAltNum: {
                                                                ...currentLine.enterpriseAltNum,
                                                                numMask: e.target.value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Enter number mask"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Is Urgent</label>
                                                <Select
                                                    value={currentLine.enterpriseAltNum?.isUrgent || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            enterpriseAltNum: {
                                                                ...currentLine.enterpriseAltNum,
                                                                isUrgent: value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="t">True</SelectItem>
                                                        <SelectItem value="f">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Add Local Route Partition</label>
                                                <Select
                                                    value={currentLine.enterpriseAltNum?.addLocalRoutePartition || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            enterpriseAltNum: {
                                                                ...currentLine.enterpriseAltNum,
                                                                addLocalRoutePartition: value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="t">True</SelectItem>
                                                        <SelectItem value="f">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Route Partition *guess</label>
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
                                                    fetchOptions={fetchRoutePartitionOptions}
                                                    displayValue={currentLine.enterpriseAltNum?.routePartition?._ || ''}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Advertise Globally ILS</label>
                                                <Select
                                                    value={currentLine.enterpriseAltNum?.advertiseGloballyIls || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            enterpriseAltNum: {
                                                                ...currentLine.enterpriseAltNum,
                                                                advertiseGloballyIls: value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="t">True</SelectItem>
                                                        <SelectItem value="f">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </FormSection>

                                    <FormSection title="E.164 Alternate Number">
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Use E.164 Alt Num</label>
                                                <Select
                                                    value={currentLine.useE164AltNum || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            useE164AltNum: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Num Mask</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={currentLine.e164AltNum?.numMask || ''}
                                                    onChange={(e) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            e164AltNum: {
                                                                ...currentLine.e164AltNum,
                                                                numMask: e.target.value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Enter number mask"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Is Urgent</label>
                                                <Select
                                                    value={currentLine.e164AltNum?.isUrgent || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            e164AltNum: {
                                                                ...currentLine.e164AltNum,
                                                                isUrgent: value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="t">True</SelectItem>
                                                        <SelectItem value="f">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Add Local Route Partition</label>
                                                <Select
                                                    value={currentLine.e164AltNum?.addLocalRoutePartition || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            e164AltNum: {
                                                                ...currentLine.e164AltNum,
                                                                addLocalRoutePartition: value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="t">True</SelectItem>
                                                        <SelectItem value="f">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Route Partition *guess</label>
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
                                                    fetchOptions={fetchRoutePartitionOptions}
                                                    displayValue={currentLine.e164AltNum?.routePartition?._ || ''}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Advertise Globally ILS</label>
                                                <Select
                                                    value={currentLine.e164AltNum?.advertiseGloballyIls || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            e164AltNum: {
                                                                ...currentLine.e164AltNum,
                                                                advertiseGloballyIls: value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="t">True</SelectItem>
                                                        <SelectItem value="f">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </FormSection>

                                    <FormSection title="AAR Settings">
                                        <div className="grid grid-cols-1 gap-6">
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
                                                <label className="mb-1 block text-sm font-medium">AAR Keep Call History</label>
                                                <Select
                                                    value={currentLine.aarKeepCallHistory || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            aarKeepCallHistory: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">AAR Voice Mail Enabled</label>
                                                <Select
                                                    value={currentLine.aarVoiceMailEnabled || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            aarVoiceMailEnabled: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">AAR Neighborhood Name *guess</label>
                                                <AsyncCombobox
                                                    value={currentLine.aarNeighborhoodName?.uuid || ''}
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
                                                    placeholder="Search for AAR neighborhood..."
                                                    searchPlaceholder="Type to search AAR neighborhoods..."
                                                    emptyMessage="No AAR neighborhoods found."
                                                    loadingMessage="Searching AAR neighborhoods..."
                                                    fetchOptions={fetchAarNeighborhoodOptions}
                                                    displayValue={currentLine.aarNeighborhoodName?._ || ''}
                                                />
                                            </div>
                                        </div>
                                    </FormSection>

                                    <FormSection title="Call Forward And Call Pickup Settings">
                                        <div className="grid grid-cols-1 gap-6">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Call Pickup Group Name *guess</label>
                                                <AsyncCombobox
                                                    value={currentLine.callPickupGroupName?.uuid || ''}
                                                    onValueChange={(value, selectedOption) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            callPickupGroupName: {
                                                                _: selectedOption?.label || '',
                                                                uuid: value,
                                                            },
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Search for call pickup group..."
                                                    searchPlaceholder="Type to search call pickup groups..."
                                                    emptyMessage="No call pickup groups found."
                                                    loadingMessage="Searching call pickup groups..."
                                                    fetchOptions={fetchCallPickupGroupOptions}
                                                    displayValue={currentLine.callPickupGroupName?._ || ''}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">PSTN Failover</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={currentLine.pstnFailover || ''}
                                                    onChange={(e) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            pstnFailover: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Enter PSTN failover"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Call Control Agent Profile *guess</label>
                                                <AsyncCombobox
                                                    value={currentLine.callControlAgentProfile || ''}
                                                    onValueChange={(value, selectedOption) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            callControlAgentProfile: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Search for call control agent profile..."
                                                    searchPlaceholder="Type to search call control agent profiles..."
                                                    emptyMessage="No call control agent profiles found."
                                                    loadingMessage="Searching call control agent profiles..."
                                                    fetchOptions={fetchCallControlAgentProfileOptions}
                                                    displayValue={currentLine.callControlAgentProfile || ''}
                                                />
                                            </div>
                                        </div>
                                    </FormSection>

                                    <FormSection title="Park Monitoring">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Park Mon Reversion Timer</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={currentLine.parkMonReversionTimer || ''}
                                                    onChange={(e) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            parkMonReversionTimer: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Enter park monitoring reversion timer"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Party Entrance Tone</label>
                                                <Select
                                                    value={currentLine.partyEntranceTone || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            partyEntranceTone: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select party entrance tone" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Default">Default</SelectItem>
                                                        <SelectItem value="None">None</SelectItem>
                                                        <SelectItem value="Single Beep">Single Beep</SelectItem>
                                                        <SelectItem value="Double Beep">Double Beep</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Park Mon Forward No Retrieve Dn</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={currentLine.parkMonForwardNoRetrieveDn || ''}
                                                    onChange={(e) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            parkMonForwardNoRetrieveDn: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Enter park monitoring forward DN"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Park Mon Forward No Retrieve Int Dn</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={currentLine.parkMonForwardNoRetrieveIntDn || ''}
                                                    onChange={(e) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            parkMonForwardNoRetrieveIntDn: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Enter park monitoring forward international DN"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Park Mon Forward No Retrieve Vm Enabled</label>
                                                <Select
                                                    value={currentLine.parkMonForwardNoRetrieveVmEnabled || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            parkMonForwardNoRetrieveVmEnabled: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Park Mon Forward No Retrieve Int Vm Enabled</label>
                                                <Select
                                                    value={currentLine.parkMonForwardNoRetrieveIntVmEnabled || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            parkMonForwardNoRetrieveIntVmEnabled: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select option" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="true">True</SelectItem>
                                                        <SelectItem value="false">False</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Park Mon Forward No Retrieve CSS Name *guess</label>
                                                <AsyncCombobox
                                                    value={currentLine.parkMonForwardNoRetrieveCssName?.uuid || ''}
                                                    onValueChange={(value, selectedOption) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            parkMonForwardNoRetrieveCssName: {
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
                                                    displayValue={currentLine.parkMonForwardNoRetrieveCssName?._ || ''}
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    Park Mon Forward No Retrieve Int CSS Name *guess
                                                </label>
                                                <AsyncCombobox
                                                    value={currentLine.parkMonForwardNoRetrieveIntCssName?.uuid || ''}
                                                    onValueChange={(value, selectedOption) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            parkMonForwardNoRetrieveIntCssName: {
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
                                                    displayValue={currentLine.parkMonForwardNoRetrieveIntCssName?._ || ''}
                                                />
                                            </div>
                                        </div>
                                    </FormSection>

                                    <FormSection title="Line Settings for All Devices">
                                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">HR Duration</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={currentLine.hrDuration || ''}
                                                    onChange={(e) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            hrDuration: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Enter HR duration"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">HR Interval</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={currentLine.hrInterval || ''}
                                                    onChange={(e) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            hrInterval: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Enter HR interval"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">CFA CSS Policy</label>
                                                <Select
                                                    value={currentLine.cfaCssPolicy || ''}
                                                    onValueChange={(value) => {
                                                        setCurrentLine({
                                                            ...currentLine,
                                                            cfaCssPolicy: value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                >
                                                    <SelectTrigger className="w-full bg-background">
                                                        <SelectValue placeholder="Select CFA CSS policy" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Use System Default">Use System Default</SelectItem>
                                                        <SelectItem value="Use Device CSS">Use Device CSS</SelectItem>
                                                        <SelectItem value="Use Line CSS">Use Line CSS</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </FormSection>
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
                                                    value={targetLineConfig.index || ''}
                                                    onChange={(e) => {
                                                        setTargetLineConfig({
                                                            ...targetLineConfig,
                                                            index: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Button position"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Display Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={targetLineConfig.display || ''}
                                                    onChange={(e) => {
                                                        setTargetLineConfig({
                                                            ...targetLineConfig,
                                                            display: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Display name on device"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">E.164 Alternate Number</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={targetLineConfig.e164_alt_num || ''}
                                                    onChange={(e) => {
                                                        setTargetLineConfig({
                                                            ...targetLineConfig,
                                                            e164_alt_num: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="E.164 alternate number"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">External Phone Number Mask</label>
                                                <input
                                                    type="text"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={targetLineConfig.external_phone_number_mask || ''}
                                                    onChange={(e) => {
                                                        setTargetLineConfig({
                                                            ...targetLineConfig,
                                                            external_phone_number_mask: e.target.value,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="External phone number mask"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Maximum Number of Calls</label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={targetLineConfig.max_num_calls || ''}
                                                    onChange={(e) => {
                                                        setTargetLineConfig({
                                                            ...targetLineConfig,
                                                            max_num_calls: parseInt(e.target.value) || 0,
                                                        });
                                                        setHasChanges(true);
                                                    }}
                                                    placeholder="Max calls"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Busy Trigger</label>
                                                <input
                                                    type="number"
                                                    className="w-full rounded-md border bg-background p-2"
                                                    value={targetLineConfig.busy_trigger || ''}
                                                    onChange={(e) => {
                                                        setTargetLineConfig({
                                                            ...targetLineConfig,
                                                            busy_trigger: parseInt(e.target.value) || 0,
                                                        });
                                                        setHasChanges(true);
                                                    }}
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

import { AsyncCombobox } from '@/components/ui/async-combobox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';

// Reusable collapsible card section
const SectionCard = ({
    title,
    description,
    children,
    defaultOpen = true,
    storageKey,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    storageKey?: string;
}) => {
    const [isOpen, setIsOpen] = useState(() => {
        if (!storageKey) return defaultOpen;

        try {
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : defaultOpen;
        } catch {
            return defaultOpen;
        }
    });

    const handleOpenChange = useCallback(
        (open: boolean) => {
            setIsOpen(open);
            if (storageKey) {
                try {
                    localStorage.setItem(storageKey, JSON.stringify(open));
                } catch {}
            }
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
                    <div className="transition-transform group-data-[state=open]:rotate-180">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                            <path
                                d="m4.18179 6.18181 3.31821 3.31818 3.31821-3.31818"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-6">{children}</CollapsibleContent>
            </div>
        </Collapsible>
    );
};

interface LineConfigurationFormProps {
    line: any;
    onLineChange: (updatedLine: any) => void;
    onHasChanges?: (hasChanges: boolean) => void;
    associatedDevices?: any[];
    buttonIndex?: number;
    phone?: any;
    onUpdatePhoneLine?: (currentLineUuid: string, newLineUuid: string, selectedOption: any) => void;
    onDissociateDevice?: (deviceId: string, deviceName: string) => void;
    dissociatingDevices?: Set<string>;
    showDirectoryNumberField?: boolean;
    showAssociatedDevices?: boolean;
}

export default function LineConfigurationForm({
    line,
    onLineChange,
    onHasChanges,
    associatedDevices,
    buttonIndex,
    phone,
    onUpdatePhoneLine,
    onDissociateDevice,
    dissociatingDevices = new Set(),
    showDirectoryNumberField = true,
    showAssociatedDevices = true,
}: LineConfigurationFormProps) {
    // State for cached data
    const [aarGroups, setAarGroups] = useState<any[]>([]);
    const [callingSearchSpaces, setCallingSearchSpaces] = useState<any[]>([]);
    const [voicemailProfiles, setVoicemailProfiles] = useState<any[]>([]);
    const [presenceGroups, setPresenceGroups] = useState<any[]>([]);
    const [mohAudioSources, setMohAudioSources] = useState<any[]>([]);
    const [externalCallControlProfiles, setExternalCallControlProfiles] = useState<any[]>([]);
    const [routePartitions, setRoutePartitions] = useState<any[]>([]);
    const [callPickupGroups, setCallPickupGroups] = useState<any[]>([]);

    // Helper function to handle line changes
    const handleLineChange = (updatedLine: any) => {
        onLineChange(updatedLine);
        onHasChanges?.(true);
    };

    // Note: Load functions removed - data arrays will remain empty until proper API endpoints are implemented

    // Note: Data arrays start empty and will be populated when needed via API calls

    // Cache to prevent repeated API calls with same query - using useRef to avoid dependency issues
    const queryCacheRef = useRef<Record<string, any[]>>({});

    // Fetch options functions for AsyncCombobox - memoized with empty deps to prevent recreation
    const fetchLineOptions = useCallback(async (query: string) => {
        const cacheKey = query || '__empty__';

        // Return cached result if we have it
        if (queryCacheRef.current[cacheKey]) {
            return queryCacheRef.current[cacheKey];
        }

        try {
            const response = await axios.get(`/api/lines/search?q=${encodeURIComponent(query)}`);
            const data = response.data || [];

            // Always return the mapped array, even if empty
            const result = data.map((item: any) => ({
                value: item.uuid,
                label: `${item.pattern} - ${item.routePartitionName || 'No Partition'}`,
            }));

            // Cache the result to prevent repeated calls
            queryCacheRef.current[cacheKey] = result;

            return result;
        } catch (error) {
            console.error('Failed to fetch line options:', error);
            // Cache empty result for errors too
            const emptyResult: any[] = [];
            queryCacheRef.current[cacheKey] = emptyResult;
            return emptyResult;
        }
    }, []);

    const fetchExternalCallControlProfileOptions = useCallback(async (query: string) => {
        return externalCallControlProfiles
            .filter((profile) => profile.name.toLowerCase().includes(query.toLowerCase()))
            .map((profile) => ({ value: profile.uuid, label: profile.name }));
    }, []);

    const fetchVoiceMailProfileOptions = useCallback(async (query: string) => {
        return voicemailProfiles
            .filter((profile) => profile.name.toLowerCase().includes(query.toLowerCase()))
            .map((profile) => ({ value: profile.uuid, label: profile.name }));
    }, []);

    const fetchCallingSearchSpaceOptions = useCallback(async (query: string) => {
        return callingSearchSpaces
            .filter((css) => css.name.toLowerCase().includes(query.toLowerCase()))
            .map((css) => ({ value: css.uuid, label: css.name }));
    }, []);

    const fetchPresenceGroupOptions = useCallback(async (query: string) => {
        return presenceGroups
            .filter((group) => group.name.toLowerCase().includes(query.toLowerCase()))
            .map((group) => ({ value: group.uuid, label: group.name }));
    }, []);

    const fetchMohAudioSourceOptions = useCallback(async (query: string) => {
        return mohAudioSources
            .filter((source) => source.name.toLowerCase().includes(query.toLowerCase()))
            .map((source) => ({ value: source.sourceId || source.uuid || source.name, label: source.name }));
    }, []);

    const fetchRoutePartitionOptions = useCallback(async (query: string) => {
        return routePartitions
            .filter((partition) => partition.name.toLowerCase().includes(query.toLowerCase()))
            .map((partition) => ({ value: partition.uuid, label: partition.name }));
    }, []);

    const fetchAarGroupOptions = useCallback(async (query: string) => {
        return aarGroups
            .filter((group) => group.name.toLowerCase().includes(query.toLowerCase()))
            .map((group) => ({ value: group.uuid, label: group.name }));
    }, []);

    const fetchCallPickupGroupOptions = useCallback(async (query: string) => {
        return callPickupGroups
            .filter((group) => group.name.toLowerCase().includes(query.toLowerCase()))
            .map((group) => ({ value: group.uuid, label: group.name }));
    }, []);

    // Create a stable display value using useCallback to prevent re-renders
    const currentLineDisplayValue = useCallback(() => {
        if (!line?.pattern) return '';
        // Get route partition name from the line object
        const routePartition = line.routePartitionName?._ || line.route_partition_name || 'No Partition';
        return `${line.pattern} - ${routePartition}`;
    }, [line?.pattern, line?.routePartitionName?._, line?.route_partition_name]);

    return (
        <div className="space-y-4">
            {/* Directory Number Information */}
            <SectionCard
                title="Directory Number Information"
                description="Basic directory number configuration and device associations"
                defaultOpen
                storageKey="line-config-directory-number"
            >
                <div className="grid grid-cols-1 gap-6">
                    {showDirectoryNumberField && (
                        <div>
                            <label className="mb-1 block text-sm font-medium">Directory Number</label>
                            <AsyncCombobox
                                value={line.uuid}
                                onValueChange={(value, selectedOption) => {
                                    // Handle line assignment - update the phone's line configuration
                                    if (value && value !== line.uuid && onUpdatePhoneLine && selectedOption) {
                                        onUpdatePhoneLine(line.uuid, value, selectedOption);
                                    }
                                }}
                                placeholder="Search for a line..."
                                searchPlaceholder="Type to search lines..."
                                emptyMessage="No results found."
                                loadingMessage="Searching lines..."
                                fetchOptions={fetchLineOptions}
                                displayValue={currentLineDisplayValue()}
                            />
                        </div>
                    )}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Description</label>
                        <input
                            type="text"
                            className="w-full rounded-md border bg-background p-2"
                            value={line.description || ''}
                            onChange={(e) => {
                                handleLineChange({
                                    ...line,
                                    description: e.target.value,
                                });
                            }}
                            placeholder="Enter line description"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Alerting Name</label>
                        <input
                            type="text"
                            className="w-full rounded-md border bg-background p-2"
                            value={line.alertingName || ''}
                            onChange={(e) => {
                                handleLineChange({
                                    ...line,
                                    alertingName: e.target.value,
                                });
                            }}
                            placeholder="Enter alerting name"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">ASCII Alerting Name</label>
                        <input
                            type="text"
                            className="w-full rounded-md border bg-background p-2"
                            value={line.asciiAlertingName || ''}
                            onChange={(e) => {
                                handleLineChange({
                                    ...line,
                                    asciiAlertingName: e.target.value,
                                });
                            }}
                            placeholder="Enter ASCII alerting name"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">External Call Control Profile</label>
                        <AsyncCombobox
                            value={line.externalCallControlProfileName?.uuid || ''}
                            onValueChange={(value, selectedOption) => {
                                handleLineChange({
                                    ...line,
                                    externalCallControlProfileName: {
                                        _: selectedOption?.label || '',
                                        uuid: value,
                                    },
                                });
                            }}
                            placeholder="Search for external call control profile..."
                            searchPlaceholder="Type to search profiles..."
                            emptyMessage="No external call control profiles found."
                            loadingMessage="Searching profiles..."
                            fetchOptions={fetchExternalCallControlProfileOptions}
                            displayValue={line.externalCallControlProfileName?._ || ''}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Allow Control of Device from CTI</label>
                        <div className="flex items-center space-x-3">
                            <Switch
                                checked={line.allowCtiControlFlag === 'true' || line.allowCtiControlFlag === true}
                                onCheckedChange={(checked) => {
                                    handleLineChange({
                                        ...line,
                                        allowCtiControlFlag: checked ? 'true' : 'false',
                                    });
                                }}
                            />
                            <span className="text-sm text-muted-foreground">
                                {line.allowCtiControlFlag === 'true' || line.allowCtiControlFlag === true ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* Associated Devices */}
            {showAssociatedDevices && associatedDevices && associatedDevices.length > 0 && (
                <SectionCard title="Associated Devices" description="Other devices using this line" storageKey="line-config-associated-devices">
                    <div className="space-y-4">
                        {associatedDevices.map((device) => (
                            <div
                                key={device.id}
                                className={`flex items-center justify-between rounded-lg border p-4 ${
                                    device.id === phone?.id ? 'border-primary bg-primary/5' : 'border-border bg-background'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`h-3 w-3 rounded-full ${device.id === phone?.id ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
                                    <div>
                                        <h3 className="font-medium">{device.name}</h3>
                                        <p className="text-sm text-muted-foreground capitalize">{device.class}</p>
                                    </div>
                                    {device.id === phone?.id && (
                                        <span className="rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                                            Current Device
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2">
                                    {device.id !== phone?.id && onDissociateDevice && (
                                        <>
                                            <button
                                                onClick={() => (window.location.href = `/phones/${device.id}/edit`)}
                                                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                            >
                                                Edit Device
                                            </button>
                                            <button
                                                onClick={() => (window.location.href = `/phones/${device.id}/edit/button/${buttonIndex}?type=line`)}
                                                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                            >
                                                Edit Line
                                            </button>
                                            <button
                                                onClick={() => onDissociateDevice(device.id, device.name)}
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
                                    Line sharing allows multiple devices to use the same directory number. Each device can have different settings for
                                    how the line behaves.
                                </p>
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}

            {/* Directory Number Settings */}
            <SectionCard
                title="Directory Number Settings"
                description="Call routing and feature configuration"
                storageKey="line-config-directory-settings"
            >
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Voice Mail Profile</label>
                        <AsyncCombobox
                            value={line.voiceMailProfileName?.uuid || ''}
                            onValueChange={(value, selectedOption) => {
                                handleLineChange({
                                    ...line,
                                    voiceMailProfileName: {
                                        _: selectedOption?.label || '',
                                        uuid: value,
                                    },
                                });
                            }}
                            placeholder="Search for voice mail profile..."
                            searchPlaceholder="Type to search voice mail profiles..."
                            emptyMessage="No voice mail profiles found."
                            loadingMessage="Searching voice mail profiles..."
                            fetchOptions={fetchVoiceMailProfileOptions}
                            displayValue={line.voiceMailProfileName?._ || ''}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Calling Search Space</label>
                        <AsyncCombobox
                            value={line.shareLineAppearanceCssName?.uuid || ''}
                            onValueChange={(value, selectedOption) => {
                                handleLineChange({
                                    ...line,
                                    shareLineAppearanceCssName: {
                                        _: selectedOption?.label || '',
                                        uuid: value,
                                    },
                                });
                            }}
                            placeholder="Search for calling search space..."
                            searchPlaceholder="Type to search calling search spaces..."
                            emptyMessage="No calling search spaces found."
                            loadingMessage="Searching calling search spaces..."
                            fetchOptions={fetchCallingSearchSpaceOptions}
                            displayValue={line.shareLineAppearanceCssName?._ || ''}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">BLF Presence Group</label>
                        <AsyncCombobox
                            value={line.presenceGroupName?.uuid || ''}
                            onValueChange={(value, selectedOption) => {
                                handleLineChange({
                                    ...line,
                                    presenceGroupName: {
                                        _: selectedOption?.label || '',
                                        uuid: value,
                                    },
                                });
                            }}
                            placeholder="Search for presence group..."
                            searchPlaceholder="Type to search presence groups..."
                            emptyMessage="No presence groups found."
                            loadingMessage="Searching presence groups..."
                            fetchOptions={fetchPresenceGroupOptions}
                            displayValue={line.presenceGroupName?._ || ''}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">User Hold MOH Audio Source</label>
                        <AsyncCombobox
                            value={line.userHoldMohAudioSourceId || ''}
                            onValueChange={(value, selectedOption) => {
                                handleLineChange({
                                    ...line,
                                    userHoldMohAudioSourceId: value,
                                });
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
                                        String(line.userHoldMohAudioSourceId),
                                );
                                return selectedAudioSource ? selectedAudioSource.name : '';
                            })()}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Network Hold MOH Audio Source</label>
                        <AsyncCombobox
                            value={line.networkHoldMohAudioSourceId || ''}
                            onValueChange={(value, selectedOption) => {
                                handleLineChange({
                                    ...line,
                                    networkHoldMohAudioSourceId: value,
                                });
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
                                        String(line.networkHoldMohAudioSourceId),
                                );
                                return selectedAudioSource ? selectedAudioSource.name : '';
                            })()}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">Calling Line ID Presentation When Diverted</label>
                        <Select
                            value={line.callingIdPresentationWhenDiverted || ''}
                            onValueChange={(value) => {
                                handleLineChange({
                                    ...line,
                                    callingIdPresentationWhenDiverted: value,
                                });
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
                                checked={line.rejectAnonymousCall === 'true' || line.rejectAnonymousCall === true}
                                onCheckedChange={(checked) => {
                                    handleLineChange({
                                        ...line,
                                        rejectAnonymousCall: checked ? 'true' : 'false',
                                    });
                                }}
                            />
                            <span className="text-sm text-muted-foreground">
                                {line.rejectAnonymousCall === 'true' || line.rejectAnonymousCall === true ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                    </div>
                </div>
            </SectionCard>

            {/* External Presentation Information */}
            <SectionCard
                title="External Presentation Information"
                description="How caller information is presented to external parties"
                storageKey="line-config-external-presentation"
            >
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Anonymous External Presentation</label>
                        <div className="flex items-center space-x-3">
                            <Switch
                                checked={line.externalPresentationInfo?.isAnonymous === 't' || line.externalPresentationInfo?.isAnonymous === true}
                                onCheckedChange={(checked) => {
                                    handleLineChange({
                                        ...line,
                                        externalPresentationInfo: checked
                                            ? { isAnonymous: 't' }
                                            : {
                                                  presentationInfo: {
                                                      externalPresentationNumber: '',
                                                      externalPresentationName: '',
                                                  },
                                              },
                                    });
                                }}
                            />
                            <span className="text-sm text-muted-foreground">
                                {line.externalPresentationInfo?.isAnonymous === 't' || line.externalPresentationInfo?.isAnonymous === true
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
                            value={line.externalPresentationInfo?.presentationInfo?.externalPresentationNumber || ''}
                            onChange={(e) => {
                                handleLineChange({
                                    ...line,
                                    externalPresentationInfo: {
                                        ...line.externalPresentationInfo,
                                        presentationInfo: {
                                            ...line.externalPresentationInfo?.presentationInfo,
                                            externalPresentationNumber: e.target.value,
                                        },
                                    },
                                });
                            }}
                            placeholder="Enter external presentation number"
                            disabled={line.externalPresentationInfo?.isAnonymous === 't' || line.externalPresentationInfo?.isAnonymous === true}
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">External Presentation Name</label>
                        <input
                            type="text"
                            className="w-full rounded-md border bg-background p-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={line.externalPresentationInfo?.presentationInfo?.externalPresentationName || ''}
                            onChange={(e) => {
                                handleLineChange({
                                    ...line,
                                    externalPresentationInfo: {
                                        ...line.externalPresentationInfo,
                                        presentationInfo: {
                                            ...line.externalPresentationInfo?.presentationInfo,
                                            externalPresentationName: e.target.value,
                                        },
                                    },
                                });
                            }}
                            placeholder="Enter external presentation name"
                            disabled={line.externalPresentationInfo?.isAnonymous === 't' || line.externalPresentationInfo?.isAnonymous === true}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Enterprise Alternate Number */}
            <SectionCard
                title="Enterprise Alternate Number"
                description="Configure enterprise alternate number settings"
                storageKey="line-config-enterprise-alt-num"
            >
                {line.useEnterpriseAltNum === 'true' || line.useEnterpriseAltNum === true ? (
                    // Show the enterprise alt num form when enabled
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Number Mask</label>
                            <input
                                type="text"
                                className="w-full rounded-md border bg-background p-2"
                                value={line.enterpriseAltNum?.numMask || ''}
                                onChange={(e) => {
                                    const mask = e.target.value;
                                    handleLineChange({
                                        ...line,
                                        enterpriseAltNum: {
                                            ...line.enterpriseAltNum,
                                            numMask: mask,
                                        },
                                    });
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
                                    const mask = line.enterpriseAltNum?.numMask || '';
                                    const directoryNumber = line.pattern || '1002';

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
                                    value={line.enterpriseAltNum?.routePartition?.uuid || ''}
                                    onValueChange={(value, selectedOption) => {
                                        handleLineChange({
                                            ...line,
                                            enterpriseAltNum: {
                                                ...line.enterpriseAltNum,
                                                routePartition: {
                                                    _: selectedOption?.label || '',
                                                    uuid: value,
                                                },
                                            },
                                        });
                                    }}
                                    placeholder="Search for route partition..."
                                    searchPlaceholder="Type to search route partitions..."
                                    emptyMessage="No route partitions found."
                                    loadingMessage="Searching route partitions..."
                                    fetchOptions={fetchRoutePartitionOptions}
                                    displayValue={line.enterpriseAltNum?.routePartition?._ || ''}
                                />
                            </div>
                            <div className="flex items-center space-x-3">
                                <Switch
                                    checked={line.enterpriseAltNum?.isUrgent === 'true' || line.enterpriseAltNum?.isUrgent === true}
                                    onCheckedChange={(checked) => {
                                        handleLineChange({
                                            ...line,
                                            enterpriseAltNum: {
                                                ...line.enterpriseAltNum,
                                                isUrgent: checked ? 'true' : 'false',
                                            },
                                        });
                                    }}
                                />
                                <span className="text-sm font-medium">Is Urgent</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                checked={
                                    line.enterpriseAltNum?.addLocalRoutePartition === 'true' || line.enterpriseAltNum?.addLocalRoutePartition === true
                                }
                                onCheckedChange={(checked) => {
                                    handleLineChange({
                                        ...line,
                                        enterpriseAltNum: {
                                            ...line.enterpriseAltNum,
                                            addLocalRoutePartition: checked ? 'true' : 'false',
                                        },
                                    });
                                }}
                            />
                            <span className="text-sm font-medium">Add to Local Route Partition</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                checked={
                                    line.enterpriseAltNum?.advertiseGloballyIls === 'true' || line.enterpriseAltNum?.advertiseGloballyIls === true
                                }
                                onCheckedChange={(checked) => {
                                    handleLineChange({
                                        ...line,
                                        enterpriseAltNum: {
                                            ...line.enterpriseAltNum,
                                            advertiseGloballyIls: checked ? 'true' : 'false',
                                        },
                                    });
                                }}
                            />
                            <span className="text-sm font-medium">Advertise Globally via ILS</span>
                        </div>
                        <div className="pt-4">
                            <button
                                onClick={() => {
                                    handleLineChange({
                                        ...line,
                                        useEnterpriseAltNum: 'false',
                                        enterpriseAltNum: undefined,
                                    });
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
                                handleLineChange({
                                    ...line,
                                    useEnterpriseAltNum: 'true',
                                    enterpriseAltNum: {
                                        numMask: '',
                                        isUrgent: 'false',
                                        addLocalRoutePartition: 'false',
                                        routePartition: { _: '', uuid: '' },
                                        advertiseGloballyIls: 'false',
                                    },
                                });
                            }}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            Add Enterprise Alternate Number
                        </button>
                    </div>
                )}
            </SectionCard>

            {/* +E.164 Alternate Number */}
            <SectionCard
                title="+E.164 Alternate Number"
                description="Configure +E.164 alternate number settings"
                defaultOpen={false}
                storageKey="line-config-e164-alt-num"
            >
                {line.useE164AltNum === 'true' || line.useE164AltNum === true ? (
                    <div className="space-y-6">
                        <div>
                            <label className="mb-1 block text-sm font-medium">Number Mask</label>
                            <input
                                type="text"
                                className="w-full rounded-md border bg-background p-2"
                                value={line.e164AltNum?.numMask || ''}
                                onChange={(e) => {
                                    const mask = e.target.value;
                                    handleLineChange({
                                        ...line,
                                        e164AltNum: {
                                            ...line.e164AltNum,
                                            numMask: mask,
                                        },
                                    });
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
                                    const mask = line.e164AltNum?.numMask || '';
                                    const directoryNumber = line.pattern || '1002';

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
                                    value={line.e164AltNum?.routePartition?.uuid || ''}
                                    onValueChange={(value, selectedOption) => {
                                        handleLineChange({
                                            ...line,
                                            e164AltNum: {
                                                ...line.e164AltNum,
                                                routePartition: {
                                                    _: selectedOption?.label || '',
                                                    uuid: value,
                                                },
                                            },
                                        });
                                    }}
                                    placeholder="Search for route partition..."
                                    searchPlaceholder="Type to search route partitions..."
                                    emptyMessage="No route partitions found."
                                    loadingMessage="Searching route partitions..."
                                    fetchOptions={fetchRoutePartitionOptions}
                                    displayValue={line.e164AltNum?.routePartition?._ || ''}
                                />
                            </div>
                            <div className="flex items-center space-x-3">
                                <Switch
                                    checked={line.e164AltNum?.isUrgent === 'true' || line.e164AltNum?.isUrgent === true}
                                    onCheckedChange={(checked) => {
                                        handleLineChange({
                                            ...line,
                                            e164AltNum: {
                                                ...line.e164AltNum,
                                                isUrgent: checked ? 'true' : 'false',
                                            },
                                        });
                                    }}
                                />
                                <span className="text-sm font-medium">Is Urgent</span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                checked={line.e164AltNum?.addLocalRoutePartition === 'true' || line.e164AltNum?.addLocalRoutePartition === true}
                                onCheckedChange={(checked) => {
                                    handleLineChange({
                                        ...line,
                                        e164AltNum: {
                                            ...line.e164AltNum,
                                            addLocalRoutePartition: checked ? 'true' : 'false',
                                        },
                                    });
                                }}
                            />
                            <span className="text-sm font-medium">Add to Local Route Partition</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Switch
                                checked={line.e164AltNum?.advertiseGloballyIls === 'true' || line.e164AltNum?.advertiseGloballyIls === true}
                                onCheckedChange={(checked) => {
                                    handleLineChange({
                                        ...line,
                                        e164AltNum: {
                                            ...line.e164AltNum,
                                            advertiseGloballyIls: checked ? 'true' : 'false',
                                        },
                                    });
                                }}
                            />
                            <span className="text-sm font-medium">Advertise Globally via ILS</span>
                        </div>
                        <div className="pt-4">
                            <button
                                onClick={() => {
                                    handleLineChange({
                                        ...line,
                                        useE164AltNum: 'false',
                                        e164AltNum: undefined,
                                    });
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
                                handleLineChange({
                                    ...line,
                                    useE164AltNum: 'true',
                                    e164AltNum: {
                                        numMask: '',
                                        isUrgent: 'false',
                                        addLocalRoutePartition: 'false',
                                        routePartition: { _: '', uuid: '' },
                                        advertiseGloballyIls: 'false',
                                    },
                                });
                            }}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                        >
                            Add +E.164 Alternate Number
                        </button>
                    </div>
                )}
            </SectionCard>

            {/* Directory URIs */}
            <SectionCard title="Directory URIs" description="Configure directory URI settings" storageKey="line-config-directory-uris">
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
                            {(line.directoryURIs?.directoryUri || []).map((uri, index) => (
                                <tr key={index} className="border-b border-border">
                                    <td className="border border-border p-2">
                                        <input
                                            type="radio"
                                            name="primaryUri"
                                            checked={uri.isPrimary === 't' || uri.isPrimary === true}
                                            onChange={() => {
                                                const updatedUris = (line.directoryURIs?.directoryUri || []).map((u, i) => ({
                                                    ...u,
                                                    isPrimary: i === index ? 't' : 'f',
                                                }));
                                                handleLineChange({
                                                    ...line,
                                                    directoryURIs: {
                                                        directoryUri: updatedUris,
                                                    },
                                                });
                                            }}
                                            className="h-4 w-4"
                                        />
                                    </td>
                                    <td className="border border-border p-2">
                                        <input
                                            type="text"
                                            value={uri.uri || ''}
                                            onChange={(e) => {
                                                const updatedUris = [...(line.directoryURIs?.directoryUri || [])];
                                                updatedUris[index] = {
                                                    ...updatedUris[index],
                                                    uri: e.target.value,
                                                };
                                                handleLineChange({
                                                    ...line,
                                                    directoryURIs: {
                                                        directoryUri: updatedUris,
                                                    },
                                                });
                                            }}
                                            className="w-full rounded border bg-background p-1 text-sm"
                                            placeholder="Enter URI"
                                        />
                                    </td>
                                    <td className="border border-border p-2">
                                        <AsyncCombobox
                                            value={uri.partition?.uuid || ''}
                                            onValueChange={(value, selectedOption) => {
                                                const updatedUris = [...(line.directoryURIs?.directoryUri || [])];
                                                updatedUris[index] = {
                                                    ...updatedUris[index],
                                                    partition: {
                                                        _: selectedOption?.label || '',
                                                        uuid: value,
                                                    },
                                                };
                                                handleLineChange({
                                                    ...line,
                                                    directoryURIs: {
                                                        directoryUri: updatedUris,
                                                    },
                                                });
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
                                        />
                                    </td>
                                    <td className="border border-border p-2">
                                        <input
                                            type="checkbox"
                                            checked={uri.advertiseGloballyViaIls === 't' || uri.advertiseGloballyViaIls === true}
                                            onChange={(e) => {
                                                const updatedUris = [...(line.directoryURIs?.directoryUri || [])];
                                                updatedUris[index] = {
                                                    ...updatedUris[index],
                                                    advertiseGloballyViaIls: e.target.checked ? 't' : 'f',
                                                };
                                                handleLineChange({
                                                    ...line,
                                                    directoryURIs: {
                                                        directoryUri: updatedUris,
                                                    },
                                                });
                                            }}
                                            className="h-4 w-4"
                                        />
                                    </td>
                                    <td className="border border-border p-2">
                                        <button
                                            onClick={() => {
                                                const updatedUris = (line.directoryURIs?.directoryUri || []).filter((_, i) => i !== index);
                                                handleLineChange({
                                                    ...line,
                                                    directoryURIs: {
                                                        directoryUri: updatedUris,
                                                    },
                                                });
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
                                isPrimary: (line.directoryURIs?.directoryUri || []).length === 0 ? 't' : 'f',
                                uri: '',
                                partition: { _: '', uuid: '' },
                                advertiseGloballyViaIls: 'f',
                            };
                            const updatedUris = [...(line.directoryURIs?.directoryUri || []), newUri];
                            handleLineChange({
                                ...line,
                                directoryURIs: {
                                    directoryUri: updatedUris,
                                },
                            });
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
                storageKey="line-config-pstn-failover"
            >
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="mb-1 block text-sm font-medium">Advertised Failover Number</label>
                        <Select
                            value={(() => {
                                const value = line.pstnFailover;
                                if (!value || value === '') return 'None';
                                if (value === '100') return '100';
                                if (value === '200') return '200';
                                return 'None';
                            })()}
                            onValueChange={(value) => {
                                handleLineChange({
                                    ...line,
                                    pstnFailover: value === 'None' ? '' : value,
                                });
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

            {/* AAR Settings */}
            <SectionCard title="AAR Settings" description="Automated Alternate Routing settings" storageKey="line-config-aar-settings">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="flex items-center space-x-3">
                        <Switch
                            checked={line.aarVoiceMailEnabled === 'true' || line.aarVoiceMailEnabled === true}
                            onCheckedChange={(checked) => {
                                handleLineChange({
                                    ...line,
                                    aarVoiceMailEnabled: checked ? 'true' : 'false',
                                });
                            }}
                        />
                        <span className="text-sm font-medium">Voice Mail</span>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">AAR Destination Mask</label>
                        <input
                            type="text"
                            className="w-full rounded-md border bg-background p-2"
                            value={line.aarDestinationMask || ''}
                            onChange={(e) => {
                                handleLineChange({
                                    ...line,
                                    aarDestinationMask: e.target.value,
                                });
                            }}
                            placeholder="Enter AAR destination mask"
                        />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium">AAR Group</label>
                        <AsyncCombobox
                            value={typeof line.aarNeighborhoodName === 'string' ? '' : line.aarNeighborhoodName?.uuid || ''}
                            onValueChange={(value, selectedOption) => {
                                handleLineChange({
                                    ...line,
                                    aarNeighborhoodName: {
                                        _: selectedOption?.label || '',
                                        uuid: value,
                                    },
                                });
                            }}
                            placeholder="Select AAR group..."
                            searchPlaceholder="Search AAR groups..."
                            emptyMessage="No AAR groups found."
                            loadingMessage="Loading AAR groups..."
                            fetchOptions={fetchAarGroupOptions}
                            displayValue={typeof line.aarNeighborhoodName === 'string' ? line.aarNeighborhoodName : line.aarNeighborhoodName?._ || ''}
                        />
                    </div>
                </div>
                <div className="mt-6 flex items-center space-x-3">
                    <Switch
                        checked={line.aarKeepCallHistory === 'true' || line.aarKeepCallHistory === true}
                        onCheckedChange={(checked) => {
                            handleLineChange({
                                ...line,
                                aarKeepCallHistory: checked ? 'true' : 'false',
                            });
                        }}
                    />
                    <span className="text-sm">Retain this destination in the call forwarding history</span>
                </div>
            </SectionCard>

            {/* Call Forward and Call Pickup Settings */}
            <SectionCard
                title="Call Forward and Call Pickup Settings"
                description="Calling Search Space, Voicemail, and reversion timers"
                storageKey="line-config-call-forward"
            >
                <div className="space-y-6">
                    {/* Calling Search Space Activation Policy */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Calling Search Space Activation Policy</label>
                        <Select
                            value={line.callingSearchSpaceActivationPolicy || 'Use System Default'}
                            onValueChange={(value) => {
                                handleLineChange({ ...line, callingSearchSpaceActivationPolicy: value });
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
                            {
                                key: 'callForwardNotRegisteredInt',
                                label: 'Forward Unregistered Internal',
                                hasDuration: false,
                            },
                            { key: 'callForwardNotRegistered', label: 'Forward Unregistered External', hasDuration: false },
                        ] as const
                    ).map((cfg) => {
                        const cf: any = (line as any)[cfg.key] || {};
                        return (
                            <div key={cfg.key} className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="flex items-center space-x-3">
                                    <Switch
                                        checked={cf.forwardToVoiceMail === 'true' || cf.forwardToVoiceMail === true}
                                        onCheckedChange={(checked) => {
                                            handleLineChange({
                                                ...line,
                                                [cfg.key]: {
                                                    ...cf,
                                                    forwardToVoiceMail: checked ? 'true' : 'false',
                                                },
                                            });
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
                                            handleLineChange({
                                                ...line,
                                                [cfg.key]: { ...cf, destination: e.target.value },
                                            });
                                        }}
                                        placeholder="Destination"
                                    />
                                    {cfg.hasDuration && (
                                        <input
                                            type="number"
                                            className="mt-2 w-full rounded-md border bg-background p-2"
                                            value={cf.duration || ''}
                                            onChange={(e) => {
                                                handleLineChange({
                                                    ...line,
                                                    [cfg.key]: { ...cf, duration: e.target.value },
                                                });
                                            }}
                                            placeholder="Duration (seconds)"
                                        />
                                    )}
                                </div>
                                <div>
                                    <AsyncCombobox
                                        value={cf.callingSearchSpaceName?.uuid || ''}
                                        onValueChange={(value, selectedOption) => {
                                            handleLineChange({
                                                ...line,
                                                [cfg.key]: {
                                                    ...cf,
                                                    callingSearchSpaceName: { _: selectedOption?.label || '', uuid: value },
                                                },
                                            });
                                        }}
                                        placeholder="Select CSS"
                                        searchPlaceholder="Search calling search spaces..."
                                        emptyMessage="No calling search spaces found."
                                        loadingMessage="Loading calling search spaces..."
                                        fetchOptions={fetchCallingSearchSpaceOptions}
                                        displayValue={cf.callingSearchSpaceName?._ || ''}
                                    />
                                    {cfg.hasSecondaryCss && (
                                        <div className="mt-2">
                                            <label className="mb-1 block text-xs text-muted-foreground">Secondary Calling Search Space</label>
                                            <AsyncCombobox
                                                value={cf.secondaryCallingSearchSpaceName?.uuid || ''}
                                                onValueChange={(value, selectedOption) => {
                                                    handleLineChange({
                                                        ...line,
                                                        [cfg.key]: {
                                                            ...cf,
                                                            secondaryCallingSearchSpaceName: {
                                                                _: selectedOption?.label || '',
                                                                uuid: value,
                                                            },
                                                        },
                                                    });
                                                }}
                                                placeholder="Select secondary CSS"
                                                searchPlaceholder="Search calling search spaces..."
                                                emptyMessage="No calling search spaces found."
                                                loadingMessage="Loading calling search spaces..."
                                                fetchOptions={fetchCallingSearchSpaceOptions}
                                                displayValue={cf.secondaryCallingSearchSpaceName?._ || ''}
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
                            value={line.callForwardNoAnswer?.duration || ''}
                            onChange={(e) => {
                                const v = e.target.value;
                                handleLineChange({
                                    ...line,
                                    callForwardNoAnswer: {
                                        ...(line as any).callForwardNoAnswer,
                                        duration: v,
                                    },
                                });
                            }}
                            placeholder="Duration (seconds)"
                        />
                    </div>

                    {/* Call Pickup Group */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Call Pickup Group</label>
                        <AsyncCombobox
                            value={line.callPickupGroupName?.uuid || ''}
                            onValueChange={(value, selectedOption) => {
                                handleLineChange({
                                    ...line,
                                    callPickupGroupName: { _: selectedOption?.label || '', uuid: value },
                                });
                            }}
                            placeholder="Select call pickup group"
                            searchPlaceholder="Search call pickup groups..."
                            emptyMessage="No call pickup groups found."
                            loadingMessage="Loading call pickup groups..."
                            fetchOptions={fetchCallPickupGroupOptions}
                            displayValue={line.callPickupGroupName?._ || ''}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Park Monitoring */}
            <SectionCard
                title="Park Monitoring"
                description="Configure park monitoring forwarding and reversion timer"
                storageKey="line-config-park-monitoring"
            >
                <div className="grid grid-cols-1 gap-6">
                    {/* External */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex items-center space-x-3">
                            <Switch
                                checked={line.parkMonForwardNoRetrieveVmEnabled === 'true' || line.parkMonForwardNoRetrieveVmEnabled === true}
                                onCheckedChange={(checked) => {
                                    handleLineChange({
                                        ...line,
                                        parkMonForwardNoRetrieveVmEnabled: checked ? 'true' : 'false',
                                    });
                                }}
                            />
                            <span className="text-sm font-medium">Voice Mail</span>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Park Monitoring Forward No Retrieve Destination External</label>
                            <input
                                type="text"
                                className="w-full rounded-md border bg-background p-2"
                                value={line.parkMonForwardNoRetrieveDn || ''}
                                onChange={(e) => {
                                    handleLineChange({ ...line, parkMonForwardNoRetrieveDn: e.target.value });
                                }}
                                placeholder="Destination (external)"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Calling Search Space</label>
                            <AsyncCombobox
                                value={line.parkMonForwardNoRetrieveCssName?.uuid || ''}
                                onValueChange={(value, selectedOption) => {
                                    handleLineChange({
                                        ...line,
                                        parkMonForwardNoRetrieveCssName: { _: selectedOption?.label || '', uuid: value },
                                    });
                                }}
                                placeholder="Select CSS"
                                searchPlaceholder="Search calling search spaces..."
                                emptyMessage="No calling search spaces found."
                                loadingMessage="Loading calling search spaces..."
                                fetchOptions={fetchCallingSearchSpaceOptions}
                                displayValue={line.parkMonForwardNoRetrieveCssName?._ || ''}
                            />
                        </div>
                    </div>

                    {/* Internal */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="flex items-center space-x-3">
                            <Switch
                                checked={line.parkMonForwardNoRetrieveIntVmEnabled === 'true' || line.parkMonForwardNoRetrieveIntVmEnabled === true}
                                onCheckedChange={(checked) => {
                                    handleLineChange({
                                        ...line,
                                        parkMonForwardNoRetrieveIntVmEnabled: checked ? 'true' : 'false',
                                    });
                                }}
                            />
                            <span className="text-sm font-medium">Voice Mail</span>
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Park Monitoring Forward No Retrieve Destination Internal</label>
                            <input
                                type="text"
                                className="w-full rounded-md border bg-background p-2"
                                value={line.parkMonForwardNoRetrieveIntDn || ''}
                                onChange={(e) => {
                                    handleLineChange({ ...line, parkMonForwardNoRetrieveIntDn: e.target.value });
                                }}
                                placeholder="Destination (internal)"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium">Calling Search Space</label>
                            <AsyncCombobox
                                value={line.parkMonForwardNoRetrieveIntCssName?.uuid || ''}
                                onValueChange={(value, selectedOption) => {
                                    handleLineChange({
                                        ...line,
                                        parkMonForwardNoRetrieveIntCssName: { _: selectedOption?.label || '', uuid: value },
                                    });
                                }}
                                placeholder="Select CSS"
                                searchPlaceholder="Search calling search spaces..."
                                emptyMessage="No calling search spaces found."
                                loadingMessage="Loading calling search spaces..."
                                fetchOptions={fetchCallingSearchSpaceOptions}
                                displayValue={line.parkMonForwardNoRetrieveIntCssName?._ || ''}
                            />
                        </div>
                    </div>

                    {/* Reversion Timer */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Park Monitoring Reversion Timer</label>
                        <input
                            type="number"
                            className="w-full rounded-md border bg-background p-2"
                            value={line.parkMonReversionTimer || ''}
                            onChange={(e) => {
                                handleLineChange({ ...line, parkMonReversionTimer: e.target.value });
                            }}
                            placeholder="Seconds"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            A blank value will use the Park Monitoring Reversion Timer service parameter.
                        </p>
                    </div>
                </div>
            </SectionCard>

            {/* Line Settings for All Devices */}
            <SectionCard
                title="Line Settings for All Devices"
                description="Configure hold reversion settings and party entrance tone"
                storageKey="line-config-line-settings"
            >
                <div className="grid grid-cols-1 gap-6">
                    {/* Hold Reversion Ring Duration */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Hold Reversion Ring Duration (seconds)</label>
                        <input
                            type="number"
                            className="w-full rounded-md border bg-background p-2"
                            value={line.hrDuration || ''}
                            onChange={(e) => {
                                handleLineChange({ ...line, hrDuration: e.target.value });
                            }}
                            placeholder="69"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Setting the Hold Reversion Ring Duration to zero will disable the feature
                        </p>
                    </div>

                    {/* Hold Reversion Notification Interval */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Hold Reversion Notification Interval (seconds)</label>
                        <input
                            type="number"
                            className="w-full rounded-md border bg-background p-2"
                            value={line.hrInterval || ''}
                            onChange={(e) => {
                                handleLineChange({ ...line, hrInterval: e.target.value });
                            }}
                            placeholder="79"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            Setting the Hold Reversion Notification Interval to zero will disable the feature
                        </p>
                    </div>

                    {/* Party Entrance Tone */}
                    <div>
                        <label className="mb-1 block text-sm font-medium">Party Entrance Tone</label>
                        <select
                            className="w-full rounded-md border bg-background p-2"
                            value={line.partyEntranceTone || 'Default'}
                            onChange={(e) => {
                                handleLineChange({ ...line, partyEntranceTone: e.target.value });
                            }}
                        >
                            <option value="Default">Default</option>
                            <option value="Off">Off</option>
                            <option value="On">On</option>
                        </select>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}

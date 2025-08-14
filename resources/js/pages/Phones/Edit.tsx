import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { PhoneApiData } from '@/components/phone-edit/phone-api-data';
import { PhoneButtonLayout } from '@/components/phone-edit/phone-button-layout';
import { PhoneScreenCaptures } from '@/components/phone-edit/phone-screen-captures';
import { PhoneStats } from '@/components/phone-edit/phone-stats';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { FormSection } from '@/components/ui/form-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { ChevronRight, Phone, Settings } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type PhoneForm = {
    _id?: string;
    id: string;
    uuid?: string;
    ucm_id: string;
    name: string;
    description?: string;
    model?: string;
    protocol?: string;
    devicePoolName?: any;
    commonDeviceConfigName?: any;
    phoneTemplateName?: any;
    commonPhoneConfigName?: any;
    callingSearchSpaceName?: any;
    locationName?: any;
    mediaResourceListName?: any;
    automatedAlternateRoutingCssName?: any;
    userHoldMohAudioSourceId?: string;
    networkHoldMohAudioSourceId?: string;
    aarNeighborhoodName?: any;
    userLocale?: string;
    geoLocationName?: any;
    builtInBridgeStatus?: string;
    callInfoPrivacyStatus?: string;
    deviceMobilityMode?: string;
    ownerUserName?: any;
    mobilityUserIdName?: any;
    primaryPhoneName?: any;
    useTrustedRelayPoint?: string;
    ringSettingIdleBlfAudibleAlert?: string;
    ringSettingBusyBlfAudibleAlert?: string;
    alwaysUsePrimeLine?: string;
    alwaysUsePrimeLineForVoiceMessage?: string;
    ignorePresentationIndicators?: boolean | string;
    allowCtiControlFlag?: boolean | string;
    hlogStatus?: boolean | string;
    remoteDevice?: boolean | string;
    requireOffPremiseLocation?: boolean | string;
    cgpnIngressDN?: any;
    useDevicePoolCgpnIngressDN?: boolean | string;
    cgpnTransformationCssName?: any;
    useDevicePoolCgpnTransformCss?: boolean | string;
    buttons?: any[];
    lines?: any;
    speedDials?: any[];
    blfs?: any[];
    globalLineData?: any[];
    // Do Not Disturb fields
    dndStatus?: boolean | string;
    dndOption?: string;
    dndRingSetting?: string;
    // Extension Mobility fields
    enableExtensionMobility?: boolean | string;
    defaultProfileName?: any;
    // Protocol Specific Information fields
    packetCaptureMode?: string;
    packetCaptureDuration?: number;
    presenceGroupName?: any;
    dialRulesName?: any;
    mtpPreferedCodec?: string;
    securityProfileName?: any;
    rerouteCallingSearchSpaceName?: any;
    subscribeCallingSearchSpaceName?: any;
    sipProfileName?: any;
    digestUser?: string;
    mtpRequired?: boolean | string;
    unattendedPort?: boolean | string;
    requireDtmfReception?: boolean | string;
    // API Data fields
    api_data?: any;
};

type Option = { id: string; name: string; uuid?: string; sourceId?: string; userid?: string };

interface Props {
    phone: PhoneForm;
    globalLineData?: any[]; // Global line data from the backend
    phoneButtonTemplate?: any; // The phone button template data from the API
    mohAudioSources?: any[]; // MOH audio sources data from the backend
    screenCaptures?: any[]; // Screen captures data from the backend
}

export default function Edit({ phone, globalLineData, phoneButtonTemplate, mohAudioSources, screenCaptures }: Props) {
    const { data, setData, patch, processing, errors } = useForm<PhoneForm>(phone as any);
    const isSaving = useRef(false);

    // Re-initialize form data when phone prop changes (e.g., after redirect with fresh data)
    useEffect(() => {
        setData(phone as any);
    }, [phone, setData]);

    // Helper function to convert string/boolean values to proper booleans for UI display
    const toBoolean = (value: boolean | string | undefined): boolean => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            // Handle "true"/"false" strings
            if (value.toLowerCase() === 'true') return true;
            if (value.toLowerCase() === 'false') return false;
            // Handle "t"/"f" strings (Cisco UCM format)
            if (value.toLowerCase() === 't') return true;
            if (value.toLowerCase() === 'f') return false;
            // Handle "On"/"Off" strings
            if (value === 'On') return true;
            if (value === 'Off') return false;
            // Handle "Default" as false for display purposes
            if (value === 'Default') return false;
        }
        return false;
    };

    // Handle toast messages from backend
    const page = usePage<any>();
    useEffect(() => {
        if (page.props.flash?.toast) {
            const toastData = page.props.flash.toast;
            if (toastData.type === 'success') {
                toast.success(toastData.message);
            } else if (toastData.type === 'error') {
                toast.error(toastData.message);
            }
        }
    }, [page.props.flash?.toast]);

    const [devicePools, setDevicePools] = useState<Option[]>([]);
    const [phoneModels, setPhoneModels] = useState<Option[]>([]);
    const [commonDeviceConfigs, setCommonDeviceConfigs] = useState<Option[]>([]);
    const [phoneButtonTemplates, setPhoneButtonTemplates] = useState<Option[]>([]);
    const [commonPhoneConfigs, setCommonPhoneConfigs] = useState<Option[]>([]);
    const [callingSearchSpaces, setCallingSearchSpaces] = useState<Option[]>([]);
    const [locations, setLocations] = useState<Option[]>([]);
    const [mediaResourceGroupLists, setMediaResourceGroupLists] = useState<Option[]>([]);
    const [aarCallingSearchSpaces, setAarCallingSearchSpaces] = useState<Option[]>([]);
    const [aarGroups, setAarGroups] = useState<Option[]>([]);
    const [userLocales, setUserLocales] = useState<Option[]>([]);
    const [geoLocations, setGeoLocations] = useState<Option[]>([]);
    const [ucmUsers, setUcmUsers] = useState<Option[]>([]);
    const [mobilityUsers, setMobilityUsers] = useState<Option[]>([]);
    const [phones, setPhones] = useState<Option[]>([]);
    const [presenceGroups, setPresenceGroups] = useState<Option[]>([]);
    const [sipDialRules, setSipDialRules] = useState<Option[]>([]);
    const [phoneSecurityProfiles, setPhoneSecurityProfiles] = useState<Option[]>([]);
    const [sipProfiles, setSipProfiles] = useState<Option[]>([]);
    const [deviceProfiles, setDeviceProfiles] = useState<Option[]>([]);
    const [extensionMobilityData, setExtensionMobilityData] = useState<any>(null);
    const [extensionMobilityLoading, setExtensionMobilityLoading] = useState(false);
    const [updatedApiData, setUpdatedApiData] = useState<any>((phone as any).api_data);
    const [isSavingState, setIsSavingState] = useState(false);
    const [activeTab, setActiveTab] = useState('configuration');

    // Function to map phone button template to phone configuration
    const mapTemplateToPhoneButtons = useCallback(() => {
        if (!phoneButtonTemplate?.buttons || !Array.isArray(phoneButtonTemplate.buttons)) {
            return [];
        }

        // Sort template buttons by buttonnum
        const sortedTemplateButtons = [...phoneButtonTemplate.buttons].sort((a, b) => {
            const aNum = parseInt(a.buttonnum) || 0;
            const bNum = parseInt(b.buttonnum) || 0;
            return aNum - bNum;
        });

        // Create arrays from phone data for each feature type
        const availableLines = phone.lines?.line ? [...phone.lines.line] : [];
        const availableSpeedDials = phone.speedDials || [];
        const availableBlfs = phone.blfs || [];

        // Map template buttons to phone configuration
        const mappedButtons = sortedTemplateButtons.map((templateButton: any) => {
            const buttonNum = parseInt(templateButton.buttonnum) || 1;
            const button: any = {
                index: buttonNum,
                type: templateButton.feature?.toLowerCase() || 'line',
                label: '',
                target: '',
                feature: templateButton.feature || 'Line',
                isShared: false,
            };

            // Map based on feature type
            switch (templateButton.feature?.toLowerCase()) {
                case 'line':
                    // Find the line that matches this buttonnum position
                    const matchingLine = availableLines.find((line: any) => parseInt(line.index) === buttonNum);
                    if (matchingLine) {
                        button.label = matchingLine?.dirn?.pattern || matchingLine?.label || 'Line';
                        button.target = matchingLine?.dirn?.uuid || matchingLine?.dirn?.pattern || '';

                        // Check if line is shared by looking in globalLineData
                        const globalLine = globalLineData?.find((line: any) => line.uuid === matchingLine.dirn?.uuid);
                        button.isShared = globalLine?.isShared || false;

                        // Build subtitle with route partition and description (skip pattern since it's already the label)
                        const subtitleParts = [];
                        if (matchingLine?.dirn?.routePartitionName?._) {
                            subtitleParts.push(matchingLine.dirn.routePartitionName._);
                        }
                        if (globalLine?.description) {
                            subtitleParts.push(globalLine.description);
                        }
                        button.subtitle = subtitleParts.length > 0 ? subtitleParts.join(' • ') : undefined;
                    } else {
                        button.label = 'Add Line';
                        button.target = '';
                        button.isShared = false;
                    }
                    break;
                case 'speed_dial':
                case 'speeddial':
                case 'speed dial':
                    // Find the speed dial that matches this buttonnum position
                    const matchingSpeedDial = availableSpeedDials.find((sd: any) => parseInt(sd.index) === buttonNum);
                    if (matchingSpeedDial) {
                        button.label = matchingSpeedDial?.label || matchingSpeedDial?.dirn?.pattern || 'Speed Dial';
                        button.target = matchingSpeedDial?.dirn?.pattern || '';
                    } else {
                        button.label = 'Add Speed Dial';
                        button.target = '';
                    }
                    break;
                case 'blf':
                case 'speed dial blf':
                    // Find the BLF that matches this buttonnum position
                    const matchingBlf = availableBlfs.find((blf: any) => parseInt(blf.index) === buttonNum);
                    if (matchingBlf) {
                        button.label = matchingBlf?.label || matchingBlf?.dirn?.pattern || 'BLF';
                        button.target = matchingBlf?.dirn?.pattern || '';
                    } else {
                        button.label = 'Add BLF';
                        button.target = '';
                    }
                    break;
                default:
                    button.label = templateButton.label || 'Add Button';
                    button.target = '';
            }

            return button;
        });

        return mappedButtons;
    }, [phoneButtonTemplate, phone]);

    // Function to rebuild button arrays when template changes
    const rebuildButtonArrays = useCallback(() => {
        // If no template buttons, build from phone's actual data
        if (!phoneButtonTemplate?.buttons || phoneButtonTemplate.buttons.length === 0) {
            // Build buttons directly from phone's lines, speedDials, and blfs
            const buttonsFromPhone: any[] = [];

            // Add lines
            if (phone.lines?.line) {
                const lines = Array.isArray(phone.lines.line) ? phone.lines.line : [phone.lines.line];
                lines.forEach((line: any) => {
                    // Build subtitle with route partition (skip pattern since it's already the label)
                    const subtitleParts = [];
                    if (line.dirn?.routePartitionName?._) {
                        subtitleParts.push(line.dirn.routePartitionName._);
                    }

                    // Check if line is shared by looking in globalLineData
                    const globalLine = globalLineData?.find((gl: any) => gl.uuid === line.dirn?.uuid);

                    buttonsFromPhone.push({
                        index: parseInt(line.index) || buttonsFromPhone.length + 1,
                        type: 'line',
                        label: line.dirn?.pattern || line.label || 'Line',
                        target: line.dirn?.uuid || line.dirn?.pattern || '',
                        subtitle: subtitleParts.length > 0 ? subtitleParts.join(' • ') : undefined,
                        feature: 'Line',
                        isShared: globalLine?.isShared || false,
                    });
                });
            }

            // Add speed dials
            if (phone.speedDials && phone.speedDials.length > 0) {
                phone.speedDials.forEach((sd: any) => {
                    buttonsFromPhone.push({
                        index: parseInt(sd.index) || buttonsFromPhone.length + 1,
                        type: 'speed_dial',
                        label: sd.label || sd.dirn?.pattern || 'Speed Dial',
                        target: sd.dirn?.pattern || '',
                        feature: 'Speed Dial',
                    });
                });
            }

            // Add BLFs
            if (phone.blfs && phone.blfs.length > 0) {
                phone.blfs.forEach((blf: any) => {
                    buttonsFromPhone.push({
                        index: parseInt(blf.index) || buttonsFromPhone.length + 1,
                        type: 'blf',
                        label: blf.label || blf.dirn?.pattern || 'BLF',
                        target: blf.dirn?.pattern || '',
                        feature: 'BLF',
                    });
                });
            }

            // Sort by index
            buttonsFromPhone.sort((a, b) => a.index - b.index);
            setData('buttons', buttonsFromPhone);
            return;
        }

        const mappedButtons = mapTemplateToPhoneButtons();
        setData('buttons', mappedButtons);
    }, [phoneButtonTemplate, mapTemplateToPhoneButtons, setData, phone]);

    // Function to handle button reordering and update underlying phone data
    const handleButtonReorder = useCallback(
        (reorderedButtons: any[]) => {
            // Update the buttons state
            setData('buttons', reorderedButtons);

            // Create a mapping of button positions to their new order
            const buttonPositionMap = new Map();

            // Group buttons by type and create position mappings
            const lineButtons = reorderedButtons.filter((btn) => btn.type?.toLowerCase() === 'line');
            const speedDialButtons = reorderedButtons.filter(
                (btn) =>
                    btn.type?.toLowerCase() === 'speed_dial' || btn.type?.toLowerCase() === 'speeddial' || btn.type?.toLowerCase() === 'speed dial',
            );
            const blfButtons = reorderedButtons.filter((btn) => btn.type?.toLowerCase() === 'blf' || btn.type?.toLowerCase() === 'speed dial blf');

            // Update lines - map button positions to line indices
            if (lineButtons.length > 0 && data.lines?.line) {
                const newLines = { ...data.lines };
                const updatedLines = [...data.lines.line];

                lineButtons.forEach((button, sequenceIndex) => {
                    // Find the line that matches this button's target/label
                    const lineIndex = updatedLines.findIndex((line: any) => line.dirn?.pattern === button.target || line.label === button.label);

                    if (lineIndex !== -1) {
                        // Update the line's index to match the new button position
                        updatedLines[lineIndex] = {
                            ...updatedLines[lineIndex],
                            index: button.index, // This is the new position from the button
                        };
                    }
                });

                newLines.line = updatedLines;
                setData('lines', newLines);
            }

            // Update speed dials - similar logic
            if (speedDialButtons.length > 0 && data.speedDials) {
                const updatedSpeedDials = [...data.speedDials];

                speedDialButtons.forEach((button) => {
                    const speedDialIndex = updatedSpeedDials.findIndex((sd: any) => sd.dirn?.pattern === button.target || sd.label === button.label);

                    if (speedDialIndex !== -1) {
                        updatedSpeedDials[speedDialIndex] = {
                            ...updatedSpeedDials[speedDialIndex],
                            index: button.index,
                        };
                    }
                });

                setData('speedDials', updatedSpeedDials);
            }

            // Update BLFs - similar logic
            if (blfButtons.length > 0 && data.blfs) {
                const updatedBlfs = [...data.blfs];

                blfButtons.forEach((button) => {
                    const blfIndex = updatedBlfs.findIndex((blf: any) => blf.dirn?.pattern === button.target || blf.label === button.label);

                    if (blfIndex !== -1) {
                        updatedBlfs[blfIndex] = {
                            ...updatedBlfs[blfIndex],
                            index: button.index,
                        };
                    }
                });

                setData('blfs', updatedBlfs);
            }
        },
        [data.lines, data.speedDials, data.blfs, setData],
    );

    // Set initial buttons when phone button template changes
    useEffect(() => {
        rebuildButtonArrays();
    }, [rebuildButtonArrays]);

    // Reload phone security profiles when phone model changes
    useEffect(() => {
        if (data.model) {
            // Clear existing profiles and reload with new model filter
            setPhoneSecurityProfiles([]);
            loadPhoneSecurityProfiles();
        }
    }, [data.model]);

    // Set default values for Number Presentation Transformation fields if not present
    useEffect(() => {
        if (data.useDevicePoolCgpnIngressDN === undefined) {
            setData('useDevicePoolCgpnIngressDN', true);
        }
        if (data.useDevicePoolCgpnTransformCss === undefined) {
            setData('useDevicePoolCgpnTransformCss', true);
        }
    }, []);

    // Load extension mobility data when component mounts
    useEffect(() => {
        if (data.ucm_id && (phone as any).uuid) {
            loadExtensionMobilityData();
        }
    }, [data.ucm_id, (phone as any).uuid]);

    // Function to handle phone button template changes
    const handlePhoneButtonTemplateChange = (value: string) => {
        // This would be called when the user selects a different phone button template
        // For now, we'll just rebuild the arrays
        rebuildButtonArrays();
    };

    // Lazy load functions
    const loadDevicePools = async () => {
        if (devicePools.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/device-pools`);
                const responseData = await response.json();
                setDevicePools(responseData);
            } catch (error) {
                console.error('Failed to load device pools:', error);
            }
        }
    };

    const loadPhoneModels = async () => {
        if (phoneModels.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/phone-models`);
                const responseData = await response.json();
                setPhoneModels(responseData);
            } catch (error) {
                console.error('Failed to load phone models:', error);
            }
        }
    };

    const loadCommonDeviceConfigs = async () => {
        if (commonDeviceConfigs.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/common-device-configs`);
                const responseData = await response.json();
                setCommonDeviceConfigs(responseData);
            } catch (error) {
                console.error('Failed to load common device configs:', error);
            }
        }
    };

    const loadPhoneButtonTemplates = async () => {
        if (phoneButtonTemplates.length === 0) {
            try {
                const protocol = data.protocol || '';
                const model = data.model || '';

                const params = new URLSearchParams();
                if (protocol) params.append('protocol', protocol);
                if (model) params.append('model', model);

                const url = `/api/ucm/${data.ucm_id}/options/phone-button-templates${params.toString() ? '?' + params.toString() : ''}`;

                const response = await fetch(url);
                const responseData = await response.json();
                setPhoneButtonTemplates(responseData);
            } catch (error) {
                console.error('Failed to load phone button templates:', error);
            }
        }
    };

    const loadCommonPhoneConfigs = async () => {
        if (commonPhoneConfigs.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/common-phone-configs`);
                const responseData = await response.json();
                setCommonPhoneConfigs(responseData);
            } catch (error) {
                console.error('Failed to load common phone configs:', error);
            }
        }
    };

    const loadCallingSearchSpaces = async () => {
        if (callingSearchSpaces.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/calling-search-spaces`);
                const responseData = await response.json();
                setCallingSearchSpaces(responseData);
            } catch (error) {
                console.error('Failed to load calling search spaces:', error);
            }
        }
    };

    const loadLocations = async () => {
        if (locations.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/locations`);
                const responseData = await response.json();
                setLocations(responseData);
            } catch (error) {
                console.error('Failed to load locations:', error);
            }
        }
    };

    const loadMediaResourceGroupLists = async () => {
        if (mediaResourceGroupLists.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/media-resource-group-lists`);
                const responseData = await response.json();
                setMediaResourceGroupLists(responseData);
            } catch (error) {
                console.error('Failed to load media resource group lists:', error);
            }
        }
    };

    const loadAarCallingSearchSpaces = async () => {
        if (aarCallingSearchSpaces.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/calling-search-spaces`);
                const responseData = await response.json();
                setAarCallingSearchSpaces(responseData);
            } catch (error) {
                console.error('Failed to load AAR calling search spaces:', error);
            }
        }
    };

    const loadAarGroups = async () => {
        if (aarGroups.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/aar-groups`);
                const responseData = await response.json();
                setAarGroups(responseData);
            } catch (error) {
                console.error('Failed to load AAR groups:', error);
            }
        }
    };

    const loadUserLocales = async () => {
        if (userLocales.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/user-locales`);
                const responseData = await response.json();
                setUserLocales(responseData);
            } catch (error) {
                console.error('Failed to load user locales:', error);
            }
        }
    };

    const loadGeoLocations = async () => {
        if (geoLocations.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/geo-locations`);
                const responseData = await response.json();
                setGeoLocations(responseData);
            } catch (error) {
                console.error('Failed to load geo locations:', error);
            }
        }
    };

    const loadUcmUsers = async () => {
        if (ucmUsers.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/ucm-users`);
                const responseData = await response.json();
                setUcmUsers(responseData);
            } catch (error) {
                console.error('Failed to load UCM users:', error);
            }
        }
    };

    const loadMobilityUsers = async () => {
        if (mobilityUsers.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/mobility-users`);
                const responseData = await response.json();
                setMobilityUsers(responseData);
            } catch (error) {
                console.error('Failed to load mobility users:', error);
            }
        }
    };

    const loadPhones = async () => {
        if (phones.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/phones`);
                const responseData = await response.json();
                setPhones(responseData);
            } catch (error) {
                console.error('Failed to load phones:', error);
            }
        }
    };

    const loadPresenceGroups = async () => {
        if (presenceGroups.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/presence-groups`);
                const responseData = await response.json();
                setPresenceGroups(responseData);
            } catch (error) {
                console.error('Failed to load presence groups:', error);
            }
        }
    };

    const loadSipDialRules = async () => {
        if (sipDialRules.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/sip-dial-rules`);
                const responseData = await response.json();
                setSipDialRules(responseData);
            } catch (error) {
                console.error('Failed to load SIP dial rules:', error);
            }
        }
    };

    const loadPhoneSecurityProfiles = async () => {
        if (phoneSecurityProfiles.length === 0) {
            try {
                const phoneType = data.model || '';
                const params = new URLSearchParams();
                if (phoneType) params.append('phoneType', phoneType);

                const url = `/api/ucm/${data.ucm_id}/options/phone-security-profiles${params.toString() ? '?' + params.toString() : ''}`;

                console.log('Loading phone security profiles with phoneType:', phoneType);
                const response = await fetch(url);
                const responseData = await response.json();
                console.log('Phone security profiles loaded:', responseData.length, 'profiles');
                setPhoneSecurityProfiles(responseData);
            } catch (error) {
                console.error('Failed to load phone security profiles:', error);
            }
        }
    };

    const loadSipProfiles = async () => {
        if (sipProfiles.length === 0) {
            try {
                const response = await fetch(`/api/ucm/${data.ucm_id}/options/sip-profiles`);
                const responseData = await response.json();
                setSipProfiles(responseData);
            } catch (error) {
                console.error('Failed to load SIP profiles:', error);
            }
        }
    };

    const loadDeviceProfiles = async () => {
        if (deviceProfiles.length === 0) {
            try {
                const model = data.model || '';
                const params = new URLSearchParams();
                if (model) params.append('model', model);

                const url = `/api/ucm/${data.ucm_id}/options/device-profiles${params.toString() ? '?' + params.toString() : ''}`;

                const response = await fetch(url);
                const responseData = await response.json();
                setDeviceProfiles(responseData);
            } catch (error) {
                console.error('Failed to load device profiles:', error);
            }
        }
    };

    const loadExtensionMobilityData = async () => {
        if (!extensionMobilityLoading) {
            setExtensionMobilityLoading(true);
            try {
                const phoneId = (phone as any).id || data.id;
                if (phoneId) {
                    const params = new URLSearchParams();
                    params.append('phoneId', phoneId);

                    const url = `/api/ucm/${data.ucm_id}/options/extension-mobility-dynamic?${params.toString()}`;

                    const response = await fetch(url);
                    const responseData = await response.json();
                    setExtensionMobilityData(responseData);
                }
            } catch (error) {
                console.error('Failed to load extension mobility data:', error);
            } finally {
                setExtensionMobilityLoading(false);
            }
        }
    };

    return (
        <AppShell variant="sidebar">
            <Head title={`Edit Phone - ${data.name}`} />
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
                            <div className="flex items-center space-x-1 text-foreground">
                                <Settings className="h-4 w-4" />
                                <span>{data.name || data.id}</span>
                            </div>
                        </nav>

                        {/* Consolidated Header with Tabs */}
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 pt-4 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <h1 className="text-2xl font-bold">{data.name}</h1>
                                        <p className="text-sm text-muted-foreground">
                                            {data.model} • {(phone as any).ucm?.name}
                                        </p>
                                    </div>
                                    <TabsList className="grid w-full grid-cols-3">
                                        <TabsTrigger value="configuration">Configuration</TabsTrigger>
                                        <TabsTrigger value="api-data">API Data</TabsTrigger>
                                        <TabsTrigger value="screen-captures">Screen Captures</TabsTrigger>
                                    </TabsList>
                                </div>
                                {activeTab === 'configuration' && (
                                    <Button
                                        onClick={() => {
                                            if (isSavingState) {
                                                return;
                                            }
                                            setIsSavingState(true);

                                            // Data is already in the correct MongoDB object structure from the combobox handlers
                                            const transformedData = { ...data } as any;

                                            router.patch(`/phones/${data.id}`, transformedData, {
                                                preserveScroll: true,
                                                onFinish: () => {
                                                    setIsSavingState(false);
                                                },
                                            });
                                        }}
                                        disabled={isSavingState}
                                        className="ml-4"
                                    >
                                        {isSavingState ? 'Saving...' : 'Save'}
                                    </Button>
                                )}
                            </div>

                            <TabsContent value="configuration" className="mt-6">
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                    {/* Left Column - Phone Button Configuration */}
                                    <div className="lg:col-span-1">
                                        <div className="overflow-hidden rounded-lg border bg-card shadow">
                                            <div className="p-6">
                                                <PhoneButtonLayout
                                                    buttons={data.buttons || []}
                                                    onButtonClick={(button) => {
                                                        if (button.type?.toLowerCase() === 'line' && button.target) {
                                                            // Navigate to button editing page
                                                            router.visit(`/phones/${(phone as any).id}/edit/button/${button.index}?type=line`);
                                                        }
                                                    }}
                                                    onAddButton={() => {
                                                        // TODO: Open add button modal
                                                    }}
                                                    onReorderButtons={(reorderedButtons) => {
                                                        handleButtonReorder(reorderedButtons);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column - Device Settings */}
                                    <div className="lg:col-span-2">
                                        <div className="overflow-hidden rounded-lg border bg-card shadow">
                                            <div className="border-b p-6">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <h2 className="text-lg font-semibold">Device Settings</h2>
                                                        <p className="text-sm text-muted-foreground">Update basic phone configuration</p>
                                                    </div>
                                                    <PhoneStats lastx={(phone as any).lastx} latestStatus={(phone as any).latestStatus} />
                                                </div>
                                            </div>
                                            <form className="space-y-8 p-6">
                                                {/* Device Information Section */}
                                                <FormSection title="Device Information">
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Name</label>
                                                            <input
                                                                className="w-full rounded-md border bg-background p-2"
                                                                value={data.name}
                                                                onChange={(e) => setData('name', e.target.value)}
                                                            />
                                                            {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Description</label>
                                                            <input
                                                                className="w-full rounded-md border bg-background p-2"
                                                                value={data.description || ''}
                                                                onChange={(e) => setData('description', e.target.value)}
                                                            />
                                                            {errors.description && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.description}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Model</label>
                                                            <input
                                                                type="text"
                                                                className="w-full rounded-md border bg-muted p-2 text-muted-foreground"
                                                                value={data.model || ''}
                                                                readOnly
                                                                disabled
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Protocol</label>
                                                            <input
                                                                type="text"
                                                                className="w-full rounded-md border bg-muted p-2 text-muted-foreground"
                                                                value={data.protocol || ''}
                                                                readOnly
                                                                disabled
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Device Pool</label>
                                                            <Combobox
                                                                options={devicePools.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.devicePoolName === 'string'
                                                                        ? data.devicePoolName
                                                                        : data.devicePoolName?._ || data.devicePoolName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedPool = devicePools.find((pool) => pool.name === value);
                                                                    if (selectedPool) {
                                                                        setData('devicePoolName', {
                                                                            _: selectedPool.name,
                                                                            uuid: selectedPool.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('devicePoolName', { _: '', uuid: '' });
                                                                    }
                                                                }}
                                                                placeholder="Select a device pool..."
                                                                searchPlaceholder="Search device pools..."
                                                                emptyMessage="No device pools found."
                                                                onMouseEnter={loadDevicePools}
                                                                displayValue={
                                                                    typeof data.devicePoolName === 'string'
                                                                        ? data.devicePoolName
                                                                        : data.devicePoolName?._ || data.devicePoolName?.name || ''
                                                                }
                                                            />
                                                            {errors.devicePoolName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.devicePoolName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Common Device Configuration</label>
                                                            <Combobox
                                                                options={commonDeviceConfigs.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.commonDeviceConfigName === 'string'
                                                                        ? data.commonDeviceConfigName
                                                                        : data.commonDeviceConfigName?._ || data.commonDeviceConfigName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedConfig = commonDeviceConfigs.find(
                                                                        (config) => config.name === value,
                                                                    );
                                                                    if (selectedConfig) {
                                                                        setData('commonDeviceConfigName', {
                                                                            _: selectedConfig.name,
                                                                            uuid: selectedConfig.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('commonDeviceConfigName', { _: '', uuid: '' });
                                                                    }
                                                                }}
                                                                placeholder="Select a common device configuration..."
                                                                searchPlaceholder="Search common device configurations..."
                                                                emptyMessage="No common device configurations found."
                                                                onMouseEnter={loadCommonDeviceConfigs}
                                                                displayValue={
                                                                    typeof data.commonDeviceConfigName === 'string'
                                                                        ? data.commonDeviceConfigName
                                                                        : data.commonDeviceConfigName?._ || data.commonDeviceConfigName?.name || ''
                                                                }
                                                            />
                                                            {errors.commonDeviceConfigName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.commonDeviceConfigName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Phone Button Template</label>
                                                            <Combobox
                                                                options={phoneButtonTemplates.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.phoneTemplateName === 'string'
                                                                        ? data.phoneTemplateName
                                                                        : data.phoneTemplateName?._ || data.phoneTemplateName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedTemplate = phoneButtonTemplates.find(
                                                                        (template) => template.name === value,
                                                                    );
                                                                    if (selectedTemplate) {
                                                                        setData('phoneTemplateName', {
                                                                            _: selectedTemplate.name,
                                                                            uuid: selectedTemplate.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('phoneTemplateName', { _: '', uuid: '' });
                                                                    }
                                                                }}
                                                                placeholder="Select a phone button template..."
                                                                searchPlaceholder="Search phone button templates..."
                                                                emptyMessage="No phone button templates found."
                                                                onMouseEnter={loadPhoneButtonTemplates}
                                                                displayValue={
                                                                    typeof data.phoneTemplateName === 'string'
                                                                        ? data.phoneTemplateName
                                                                        : data.phoneTemplateName?._ || data.phoneTemplateName?.name || ''
                                                                }
                                                            />
                                                            {errors.phoneTemplateName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.phoneTemplateName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Common Phone Profile</label>
                                                            <Combobox
                                                                options={commonPhoneConfigs.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.commonPhoneConfigName === 'string'
                                                                        ? data.commonPhoneConfigName
                                                                        : data.commonPhoneConfigName?._ || data.commonPhoneConfigName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedConfig = commonPhoneConfigs.find((config) => config.name === value);
                                                                    if (selectedConfig) {
                                                                        setData('commonPhoneConfigName', {
                                                                            _: selectedConfig.name,
                                                                            uuid: selectedConfig.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('commonPhoneConfigName', { _: '', uuid: '' });
                                                                    }
                                                                }}
                                                                placeholder="Select a common phone profile..."
                                                                searchPlaceholder="Search common phone profiles..."
                                                                emptyMessage="No common phone profiles found."
                                                                onMouseEnter={loadCommonPhoneConfigs}
                                                                displayValue={
                                                                    typeof data.commonPhoneConfigName === 'string'
                                                                        ? data.commonPhoneConfigName
                                                                        : data.commonPhoneConfigName?._ || data.commonPhoneConfigName?.name || ''
                                                                }
                                                            />
                                                            {errors.commonPhoneConfigName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.commonPhoneConfigName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Calling Search Space</label>
                                                            <Combobox
                                                                options={callingSearchSpaces.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.callingSearchSpaceName === 'string'
                                                                        ? data.callingSearchSpaceName
                                                                        : data.callingSearchSpaceName?._ || data.callingSearchSpaceName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedCss = callingSearchSpaces.find((css) => css.name === value);
                                                                    if (selectedCss) {
                                                                        setData('callingSearchSpaceName', {
                                                                            _: selectedCss.name,
                                                                            uuid: selectedCss.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('callingSearchSpaceName', null);
                                                                    }
                                                                }}
                                                                placeholder="Select Calling Search Space"
                                                                searchPlaceholder="Search calling search spaces..."
                                                                emptyMessage="No calling search spaces found."
                                                                onMouseEnter={loadCallingSearchSpaces}
                                                                displayValue={
                                                                    typeof data.callingSearchSpaceName === 'string'
                                                                        ? data.callingSearchSpaceName
                                                                        : data.callingSearchSpaceName?._ || data.callingSearchSpaceName?.name || ''
                                                                }
                                                            />
                                                            {errors.callingSearchSpaceName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.callingSearchSpaceName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">AAR Calling Search Space</label>
                                                            <Combobox
                                                                options={aarCallingSearchSpaces.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.automatedAlternateRoutingCssName === 'string'
                                                                        ? data.automatedAlternateRoutingCssName
                                                                        : data.automatedAlternateRoutingCssName?._ ||
                                                                          data.automatedAlternateRoutingCssName?.name ||
                                                                          ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedCss = aarCallingSearchSpaces.find((css) => css.name === value);
                                                                    if (selectedCss) {
                                                                        setData('automatedAlternateRoutingCssName', {
                                                                            _: selectedCss.name,
                                                                            uuid: selectedCss.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('automatedAlternateRoutingCssName', null);
                                                                    }
                                                                }}
                                                                placeholder="Select AAR Calling Search Space"
                                                                searchPlaceholder="Search AAR calling search spaces..."
                                                                emptyMessage="No AAR calling search spaces found."
                                                                onMouseEnter={loadAarCallingSearchSpaces}
                                                                displayValue={
                                                                    typeof data.automatedAlternateRoutingCssName === 'string'
                                                                        ? data.automatedAlternateRoutingCssName
                                                                        : data.automatedAlternateRoutingCssName?._ ||
                                                                          data.automatedAlternateRoutingCssName?.name ||
                                                                          ''
                                                                }
                                                            />
                                                            {errors.automatedAlternateRoutingCssName && (
                                                                <p className="mt-1 text-sm text-destructive">
                                                                    {errors.automatedAlternateRoutingCssName}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Media Resource Group List</label>
                                                            <Combobox
                                                                options={mediaResourceGroupLists.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.mediaResourceListName === 'string'
                                                                        ? data.mediaResourceListName
                                                                        : data.mediaResourceListName?._ || data.mediaResourceListName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedMrgl = mediaResourceGroupLists.find((mrgl) => mrgl.name === value);
                                                                    if (selectedMrgl) {
                                                                        setData('mediaResourceListName', {
                                                                            _: selectedMrgl.name,
                                                                            uuid: selectedMrgl.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('mediaResourceListName', { _: '', uuid: '' });
                                                                    }
                                                                }}
                                                                placeholder="Select a media resource group list..."
                                                                searchPlaceholder="Search media resource group lists..."
                                                                emptyMessage="No media resource group lists found."
                                                                onMouseEnter={loadMediaResourceGroupLists}
                                                                displayValue={
                                                                    typeof data.mediaResourceListName === 'string'
                                                                        ? data.mediaResourceListName
                                                                        : data.mediaResourceListName?._ || data.mediaResourceListName?.name || ''
                                                                }
                                                            />
                                                            {errors.mediaResourceListName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.mediaResourceListName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">User Hold MOH Audio Source</label>
                                                            <Combobox
                                                                options={(mohAudioSources || []).map((o) => ({
                                                                    value: o.sourceId || o.uuid || o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={data.userHoldMohAudioSourceId || ''}
                                                                onValueChange={(value) => {
                                                                    const selectedAudioSource = (mohAudioSources || []).find(
                                                                        (audioSource) =>
                                                                            String(audioSource.sourceId || audioSource.uuid || audioSource.name) ===
                                                                            value,
                                                                    );
                                                                    if (selectedAudioSource) {
                                                                        setData(
                                                                            'userHoldMohAudioSourceId',
                                                                            selectedAudioSource.sourceId ||
                                                                                selectedAudioSource.uuid ||
                                                                                selectedAudioSource.name,
                                                                        );
                                                                    } else {
                                                                        setData('userHoldMohAudioSourceId', '');
                                                                    }
                                                                }}
                                                                placeholder="Select a user hold MOH audio source..."
                                                                searchPlaceholder="Search MOH audio sources..."
                                                                emptyMessage="No MOH audio sources found."
                                                                displayValue={(() => {
                                                                    const selectedAudioSource = (mohAudioSources || []).find(
                                                                        (audioSource) =>
                                                                            String(audioSource.sourceId || audioSource.uuid || audioSource.name) ===
                                                                            String(data.userHoldMohAudioSourceId),
                                                                    );
                                                                    return selectedAudioSource ? selectedAudioSource.name : '';
                                                                })()}
                                                            />
                                                            {errors.userHoldMohAudioSourceId && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.userHoldMohAudioSourceId}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Network Hold MOH Audio Source</label>
                                                            <Combobox
                                                                options={(mohAudioSources || []).map((o) => ({
                                                                    value: o.sourceId || o.uuid || o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={data.networkHoldMohAudioSourceId || ''}
                                                                onValueChange={(value) => {
                                                                    const selectedAudioSource = (mohAudioSources || []).find(
                                                                        (audioSource) =>
                                                                            String(audioSource.sourceId || audioSource.uuid || audioSource.name) ===
                                                                            value,
                                                                    );
                                                                    if (selectedAudioSource) {
                                                                        setData(
                                                                            'networkHoldMohAudioSourceId',
                                                                            selectedAudioSource.sourceId ||
                                                                                selectedAudioSource.uuid ||
                                                                                selectedAudioSource.name,
                                                                        );
                                                                    } else {
                                                                        setData('networkHoldMohAudioSourceId', '');
                                                                    }
                                                                }}
                                                                placeholder="Select a network hold MOH audio source..."
                                                                searchPlaceholder="Search MOH audio sources..."
                                                                emptyMessage="No MOH audio sources found."
                                                                displayValue={(() => {
                                                                    const selectedAudioSource = (mohAudioSources || []).find(
                                                                        (audioSource) =>
                                                                            String(audioSource.sourceId || audioSource.uuid || audioSource.name) ===
                                                                            String(data.networkHoldMohAudioSourceId),
                                                                    );
                                                                    return selectedAudioSource ? selectedAudioSource.name : '';
                                                                })()}
                                                            />
                                                            {errors.networkHoldMohAudioSourceId && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.networkHoldMohAudioSourceId}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Location</label>
                                                            <Combobox
                                                                options={locations.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.locationName === 'string'
                                                                        ? data.locationName
                                                                        : data.locationName?._ || data.locationName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedLocation = locations.find((location) => location.name === value);
                                                                    if (selectedLocation) {
                                                                        setData('locationName', {
                                                                            _: selectedLocation.name,
                                                                            uuid: selectedLocation.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('locationName', { _: '', uuid: '' });
                                                                    }
                                                                }}
                                                                placeholder="Select a location..."
                                                                searchPlaceholder="Search locations..."
                                                                emptyMessage="No locations found."
                                                                onMouseEnter={loadLocations}
                                                                displayValue={
                                                                    typeof data.locationName === 'string'
                                                                        ? data.locationName
                                                                        : data.locationName?._ || data.locationName?.name || ''
                                                                }
                                                            />
                                                            {errors.locationName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.locationName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">AAR Group</label>
                                                            <Combobox
                                                                options={aarGroups.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.aarNeighborhoodName === 'string'
                                                                        ? data.aarNeighborhoodName
                                                                        : data.aarNeighborhoodName?._ || data.aarNeighborhoodName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedAarGroup = aarGroups.find((aarGroup) => aarGroup.name === value);
                                                                    if (selectedAarGroup) {
                                                                        setData('aarNeighborhoodName', {
                                                                            _: selectedAarGroup.name,
                                                                            uuid: selectedAarGroup.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('aarNeighborhoodName', { _: '', uuid: '' });
                                                                    }
                                                                }}
                                                                placeholder="Select an AAR group..."
                                                                searchPlaceholder="Search AAR groups..."
                                                                emptyMessage="No AAR groups found."
                                                                onMouseEnter={loadAarGroups}
                                                                displayValue={
                                                                    typeof data.aarNeighborhoodName === 'string'
                                                                        ? data.aarNeighborhoodName
                                                                        : data.aarNeighborhoodName?._ || data.aarNeighborhoodName?.name || ''
                                                                }
                                                            />
                                                            {errors.aarNeighborhoodName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.aarNeighborhoodName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">User Locale</label>
                                                            <Combobox
                                                                options={userLocales.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={data.userLocale || ''}
                                                                onValueChange={(value) => {
                                                                    setData('userLocale', value);
                                                                }}
                                                                placeholder="Select a user locale..."
                                                                searchPlaceholder="Search user locales..."
                                                                emptyMessage="No user locales found."
                                                                onMouseEnter={loadUserLocales}
                                                                displayValue={data.userLocale || ''}
                                                            />
                                                            {errors.userLocale && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.userLocale}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Built In Bridge</label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'Off', label: 'Off' },
                                                                    { value: 'On', label: 'On' },
                                                                    { value: 'Default', label: 'Default' },
                                                                ]}
                                                                value={data.builtInBridgeStatus || ''}
                                                                onValueChange={(value) => setData('builtInBridgeStatus', value || undefined)}
                                                                placeholder="Select Built-in Bridge Status"
                                                                searchPlaceholder="Search options..."
                                                                emptyMessage="No options found."
                                                                displayValue={data.builtInBridgeStatus || ''}
                                                            />
                                                            {errors.builtInBridgeStatus && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.builtInBridgeStatus}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Privacy</label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'Off', label: 'Off' },
                                                                    { value: 'On', label: 'On' },
                                                                    { value: 'Default', label: 'Default' },
                                                                ]}
                                                                value={data.callInfoPrivacyStatus || ''}
                                                                onValueChange={(value) => setData('callInfoPrivacyStatus', value || undefined)}
                                                                placeholder="Select Call Info Privacy Status"
                                                                searchPlaceholder="Search options..."
                                                                emptyMessage="No options found."
                                                                displayValue={data.callInfoPrivacyStatus || ''}
                                                            />
                                                            {errors.callInfoPrivacyStatus && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.callInfoPrivacyStatus}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Device Mobility Mode</label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'Off', label: 'Off' },
                                                                    { value: 'On', label: 'On' },
                                                                    { value: 'Default', label: 'Default' },
                                                                ]}
                                                                value={data.deviceMobilityMode || ''}
                                                                onValueChange={(value) => setData('deviceMobilityMode', value)}
                                                                placeholder="Select device mobility mode..."
                                                                searchPlaceholder="Search options..."
                                                                emptyMessage="No options found."
                                                                displayValue={data.deviceMobilityMode || ''}
                                                            />
                                                            {errors.deviceMobilityMode && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.deviceMobilityMode}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Owner</label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'anonymous', label: 'Anonymous (Public/Shared Space)' },
                                                                    ...ucmUsers.map((o) => ({
                                                                        value: o.uuid || o.id,
                                                                        label: o.userid || o.name || '',
                                                                    })),
                                                                ]}
                                                                value={data.ownerUserName?._ || 'anonymous'}
                                                                onValueChange={(value) => {
                                                                    if (value === 'anonymous') {
                                                                        setData('ownerUserName', { _: '', uuid: '' });
                                                                    } else {
                                                                        const selectedUser = ucmUsers.find((u) => (u.uuid || u.id) === value);
                                                                        if (selectedUser) {
                                                                            setData('ownerUserName', {
                                                                                _: selectedUser.userid,
                                                                                uuid: selectedUser.uuid || selectedUser.id,
                                                                            });
                                                                        }
                                                                    }
                                                                }}
                                                                placeholder="Select owner..."
                                                                searchPlaceholder="Search users..."
                                                                emptyMessage="No users found."
                                                                onMouseEnter={loadUcmUsers}
                                                                displayValue={data.ownerUserName?._ || 'Anonymous (Public/Shared Space)'}
                                                            />
                                                            {errors.ownerUserName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.ownerUserName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Mobility User ID</label>
                                                            <Combobox
                                                                options={mobilityUsers.map((o) => ({
                                                                    value: o.uuid || o.id,
                                                                    label: o.userid || o.name || '',
                                                                }))}
                                                                value={data.mobilityUserIdName?._ || ''}
                                                                onValueChange={(value) => {
                                                                    const selectedUser = mobilityUsers.find((u) => (u.uuid || u.id) === value);
                                                                    if (selectedUser) {
                                                                        setData('mobilityUserIdName', {
                                                                            _: selectedUser.userid || selectedUser.name || '',
                                                                            uuid: selectedUser.uuid || selectedUser.id,
                                                                        });
                                                                    }
                                                                }}
                                                                placeholder="Select a mobility user..."
                                                                searchPlaceholder="Search mobility users..."
                                                                emptyMessage="No mobility users found."
                                                                onMouseEnter={loadMobilityUsers}
                                                                displayValue={data.mobilityUserIdName?._ || ''}
                                                            />
                                                            {errors.mobilityUserIdName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.mobilityUserIdName}</p>
                                                            )}
                                                        </div>
                                                        {data.model === 'Cisco Unified Client Services Framework' && (
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">Primary Phone</label>
                                                                <Combobox
                                                                    options={phones.map((o) => ({
                                                                        value: o.uuid || o.id,
                                                                        label: o.name || '',
                                                                    }))}
                                                                    value={data.primaryPhoneName?._ || ''}
                                                                    onValueChange={(value) => {
                                                                        const selectedPhone = phones.find((p) => (p.uuid || p.id) === value);
                                                                        if (selectedPhone) {
                                                                            setData('primaryPhoneName', {
                                                                                _: selectedPhone.name || '',
                                                                                uuid: selectedPhone.uuid || selectedPhone.id,
                                                                            });
                                                                        } else {
                                                                            setData('primaryPhoneName', { _: '', uuid: '' });
                                                                        }
                                                                    }}
                                                                    placeholder="Select a primary phone..."
                                                                    searchPlaceholder="Search phones..."
                                                                    emptyMessage="No phones found."
                                                                    onMouseEnter={loadPhones}
                                                                    displayValue={data.primaryPhoneName?._ || ''}
                                                                />
                                                                {errors.primaryPhoneName && (
                                                                    <p className="mt-1 text-sm text-destructive">{errors.primaryPhoneName}</p>
                                                                )}
                                                            </div>
                                                        )}
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Use Trusted Relay Point*</label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'Off', label: 'Off' },
                                                                    { value: 'On', label: 'On' },
                                                                    { value: 'Default', label: 'Default' },
                                                                ]}
                                                                value={data.useTrustedRelayPoint || ''}
                                                                onValueChange={(value) => setData('useTrustedRelayPoint', value)}
                                                                placeholder="Select trusted relay point setting..."
                                                                searchPlaceholder="Search options..."
                                                                emptyMessage="No options found."
                                                                displayValue={data.useTrustedRelayPoint || ''}
                                                            />
                                                            {errors.useTrustedRelayPoint && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.useTrustedRelayPoint}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">
                                                                BLF Audible Alert Setting (Phone Idle)*
                                                            </label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'Off', label: 'Off' },
                                                                    { value: 'On', label: 'On' },
                                                                    { value: 'Default', label: 'Default' },
                                                                ]}
                                                                value={data.ringSettingIdleBlfAudibleAlert || ''}
                                                                onValueChange={(value) => setData('ringSettingIdleBlfAudibleAlert', value)}
                                                                placeholder="Select BLF audible alert setting..."
                                                                searchPlaceholder="Search options..."
                                                                emptyMessage="No options found."
                                                                displayValue={data.ringSettingIdleBlfAudibleAlert || ''}
                                                            />
                                                            {errors.ringSettingIdleBlfAudibleAlert && (
                                                                <p className="mt-1 text-sm text-destructive">
                                                                    {errors.ringSettingIdleBlfAudibleAlert}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">
                                                                BLF Audible Alert Setting (Phone Busy)*
                                                            </label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'Off', label: 'Off' },
                                                                    { value: 'On', label: 'On' },
                                                                    { value: 'Default', label: 'Default' },
                                                                ]}
                                                                value={data.ringSettingBusyBlfAudibleAlert || ''}
                                                                onValueChange={(value) => setData('ringSettingBusyBlfAudibleAlert', value)}
                                                                placeholder="Select BLF audible alert setting..."
                                                                searchPlaceholder="Search options..."
                                                                emptyMessage="No options found."
                                                                displayValue={data.ringSettingBusyBlfAudibleAlert || ''}
                                                            />
                                                            {errors.ringSettingBusyBlfAudibleAlert && (
                                                                <p className="mt-1 text-sm text-destructive">
                                                                    {errors.ringSettingBusyBlfAudibleAlert}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Always Use Prime Line*</label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'Off', label: 'Off' },
                                                                    { value: 'On', label: 'On' },
                                                                    { value: 'Default', label: 'Default' },
                                                                ]}
                                                                value={data.alwaysUsePrimeLine || ''}
                                                                onValueChange={(value) => setData('alwaysUsePrimeLine', value)}
                                                                placeholder="Select always use prime line setting..."
                                                                searchPlaceholder="Search options..."
                                                                emptyMessage="No options found."
                                                                displayValue={data.alwaysUsePrimeLine || ''}
                                                            />
                                                            {errors.alwaysUsePrimeLine && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.alwaysUsePrimeLine}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">
                                                                Always Use Prime Line for Voice Message*
                                                            </label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'Off', label: 'Off' },
                                                                    { value: 'On', label: 'On' },
                                                                    { value: 'Default', label: 'Default' },
                                                                ]}
                                                                value={data.alwaysUsePrimeLineForVoiceMessage || ''}
                                                                onValueChange={(value) => setData('alwaysUsePrimeLineForVoiceMessage', value)}
                                                                placeholder="Select always use prime line for voice message setting..."
                                                                searchPlaceholder="Search options..."
                                                                emptyMessage="No options found."
                                                                displayValue={data.alwaysUsePrimeLineForVoiceMessage || ''}
                                                            />
                                                            {errors.alwaysUsePrimeLineForVoiceMessage && (
                                                                <p className="mt-1 text-sm text-destructive">
                                                                    {errors.alwaysUsePrimeLineForVoiceMessage}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Geo Location</label>
                                                            <Combobox
                                                                options={geoLocations.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.geoLocationName === 'string'
                                                                        ? data.geoLocationName
                                                                        : data.geoLocationName?._ || data.geoLocationName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedGeoLocation = geoLocations.find(
                                                                        (geoLocation) => geoLocation.name === value,
                                                                    );
                                                                    if (selectedGeoLocation) {
                                                                        setData('geoLocationName', {
                                                                            _: selectedGeoLocation.name,
                                                                            uuid: selectedGeoLocation.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('geoLocationName', { _: '', uuid: '' });
                                                                    }
                                                                }}
                                                                placeholder="Select a geo location..."
                                                                searchPlaceholder="Search geo locations..."
                                                                emptyMessage="No geo locations found."
                                                                onMouseEnter={loadGeoLocations}
                                                                displayValue={
                                                                    typeof data.geoLocationName === 'string'
                                                                        ? data.geoLocationName
                                                                        : data.geoLocationName?._ || data.geoLocationName?.name || ''
                                                                }
                                                            />
                                                            {errors.geoLocationName && (
                                                                <p className="mt-1 text-sm text-destructive">{errors.geoLocationName}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Device Options Section */}
                                                    <div className="border-t pt-6">
                                                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Device Options</h4>
                                                        <div className="space-y-4">
                                                            <Toggle
                                                                label="Ignore Presentation Indicators (internal calls only)"
                                                                checked={toBoolean(data.ignorePresentationIndicators)}
                                                                onCheckedChange={(checked: boolean) =>
                                                                    setData('ignorePresentationIndicators', checked)
                                                                }
                                                            />
                                                            <Toggle
                                                                label="Allow Control of Device from CTI"
                                                                checked={toBoolean(data.allowCtiControlFlag)}
                                                                onCheckedChange={(checked: boolean) => setData('allowCtiControlFlag', checked)}
                                                            />
                                                            <Toggle
                                                                label="Logged Into Hunt Group"
                                                                checked={toBoolean(data.hlogStatus)}
                                                                onCheckedChange={(checked: boolean) => setData('hlogStatus', checked)}
                                                            />
                                                            <Toggle
                                                                label="Remote Device"
                                                                checked={toBoolean(data.remoteDevice)}
                                                                onCheckedChange={(checked: boolean) => setData('remoteDevice', checked)}
                                                            />
                                                            <Toggle
                                                                label="Require off-premise location"
                                                                checked={toBoolean(data.requireOffPremiseLocation)}
                                                                onCheckedChange={(checked: boolean) => setData('requireOffPremiseLocation', checked)}
                                                            />
                                                        </div>
                                                    </div>
                                                </FormSection>

                                                {/* Number Presentation Transformation Section */}
                                                <FormSection title="Number Presentation Transformation">
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="mb-4 text-sm font-medium text-muted-foreground">
                                                                Caller ID For Calls From This Phone
                                                            </h4>
                                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Calling Party Transformation CSS
                                                                    </label>
                                                                    <Combobox
                                                                        options={callingSearchSpaces.map((o) => ({
                                                                            value: o.name,
                                                                            label: o.name,
                                                                        }))}
                                                                        value={
                                                                            typeof data.cgpnIngressDN === 'string'
                                                                                ? data.cgpnIngressDN
                                                                                : data.cgpnIngressDN?._ || data.cgpnIngressDN?.name || ''
                                                                        }
                                                                        onValueChange={(value) => {
                                                                            const selectedCss = callingSearchSpaces.find((css) => css.name === value);
                                                                            if (selectedCss) {
                                                                                setData('cgpnIngressDN', {
                                                                                    _: selectedCss.name,
                                                                                    uuid: selectedCss.uuid || '',
                                                                                });
                                                                            } else {
                                                                                setData('cgpnIngressDN', null);
                                                                            }
                                                                        }}
                                                                        placeholder="Select Calling Party Transformation CSS"
                                                                        searchPlaceholder="Search calling party transformation CSS..."
                                                                        emptyMessage="No calling party transformation CSS found."
                                                                        onMouseEnter={loadCallingSearchSpaces}
                                                                        displayValue={
                                                                            typeof data.cgpnIngressDN === 'string'
                                                                                ? data.cgpnIngressDN
                                                                                : data.cgpnIngressDN?._ || data.cgpnIngressDN?.name || ''
                                                                        }
                                                                        disabled={toBoolean(data.useDevicePoolCgpnIngressDN)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Toggle
                                                                        label="Use Device Pool Calling Party Transformation CSS (Caller ID For Calls From This Phone)"
                                                                        checked={toBoolean(data.useDevicePoolCgpnIngressDN)}
                                                                        onCheckedChange={(checked: boolean) => {
                                                                            setData('useDevicePoolCgpnIngressDN', checked);
                                                                            // Clear the CSS selection when using device pool
                                                                            if (checked) {
                                                                                setData('cgpnIngressDN', null);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h4 className="mb-4 text-sm font-medium text-muted-foreground">Remote Number</h4>
                                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                                <div>
                                                                    <label className="mb-1 block text-sm font-medium">
                                                                        Calling Party Transformation CSS
                                                                    </label>
                                                                    <Combobox
                                                                        options={callingSearchSpaces.map((o) => ({
                                                                            value: o.name,
                                                                            label: o.name,
                                                                        }))}
                                                                        value={
                                                                            typeof data.cgpnTransformationCssName === 'string'
                                                                                ? data.cgpnTransformationCssName
                                                                                : data.cgpnTransformationCssName?._ ||
                                                                                  data.cgpnTransformationCssName?.name ||
                                                                                  ''
                                                                        }
                                                                        onValueChange={(value) => {
                                                                            const selectedCss = callingSearchSpaces.find((css) => css.name === value);
                                                                            if (selectedCss) {
                                                                                setData('cgpnTransformationCssName', {
                                                                                    _: selectedCss.name,
                                                                                    uuid: selectedCss.uuid || '',
                                                                                });
                                                                            } else {
                                                                                setData('cgpnTransformationCssName', null);
                                                                            }
                                                                        }}
                                                                        placeholder="Select Calling Party Transformation CSS"
                                                                        searchPlaceholder="Search calling party transformation CSS..."
                                                                        emptyMessage="No calling party transformation CSS found."
                                                                        onMouseEnter={loadCallingSearchSpaces}
                                                                        displayValue={
                                                                            typeof data.cgpnTransformationCssName === 'string'
                                                                                ? data.cgpnTransformationCssName
                                                                                : data.cgpnTransformationCssName?._ ||
                                                                                  data.cgpnTransformationCssName?.name ||
                                                                                  ''
                                                                        }
                                                                        disabled={toBoolean(data.useDevicePoolCgpnTransformCss)}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <Toggle
                                                                        label="Use Device Pool Calling Party Transformation CSS (Device Mobility Related Information)"
                                                                        checked={toBoolean(data.useDevicePoolCgpnTransformCss)}
                                                                        onCheckedChange={(checked: boolean) => {
                                                                            setData('useDevicePoolCgpnTransformCss', checked);
                                                                            // Clear the CSS selection when using device pool
                                                                            if (checked) {
                                                                                setData('cgpnTransformationCssName', null);
                                                                            }
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </FormSection>

                                                {/* Protocol Specific Information Section */}
                                                <FormSection title="Protocol Specific Information">
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Packet Capture Mode*</label>
                                                            <Combobox
                                                                options={[
                                                                    { value: 'None', label: 'None' },
                                                                    { value: 'Batch Processing Mode', label: 'Batch Processing Mode' },
                                                                ]}
                                                                value={data.packetCaptureMode || 'None'}
                                                                onValueChange={(value) => setData('packetCaptureMode', value)}
                                                                placeholder="Select packet capture mode..."
                                                                searchPlaceholder="Search options..."
                                                                emptyMessage="No options found."
                                                                displayValue={data.packetCaptureMode || 'None'}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Packet Capture Duration</label>
                                                            <input
                                                                type="number"
                                                                className="w-full rounded-md border bg-background p-2"
                                                                value={data.packetCaptureDuration || 0}
                                                                onChange={(e) => setData('packetCaptureDuration', parseInt(e.target.value) || 0)}
                                                                min="0"
                                                                max="300000"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">BLF Presence Group*</label>
                                                            <Combobox
                                                                options={presenceGroups.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.presenceGroupName === 'string'
                                                                        ? data.presenceGroupName
                                                                        : data.presenceGroupName?._ || data.presenceGroupName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedGroup = presenceGroups.find((group) => group.name === value);
                                                                    if (selectedGroup) {
                                                                        setData('presenceGroupName', {
                                                                            _: selectedGroup.name,
                                                                            uuid: selectedGroup.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('presenceGroupName', null);
                                                                    }
                                                                }}
                                                                placeholder="Select BLF Presence Group..."
                                                                searchPlaceholder="Search presence groups..."
                                                                emptyMessage="No presence groups found."
                                                                onMouseEnter={loadPresenceGroups}
                                                                displayValue={
                                                                    typeof data.presenceGroupName === 'string'
                                                                        ? data.presenceGroupName
                                                                        : data.presenceGroupName?._ || data.presenceGroupName?.name || ''
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">SIP Dial Rules</label>
                                                            <Combobox
                                                                options={sipDialRules.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.dialRulesName === 'string'
                                                                        ? data.dialRulesName
                                                                        : data.dialRulesName?._ || data.dialRulesName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedRules = sipDialRules.find((rules) => rules.name === value);
                                                                    if (selectedRules) {
                                                                        setData('dialRulesName', {
                                                                            _: selectedRules.name,
                                                                            uuid: selectedRules.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('dialRulesName', null);
                                                                    }
                                                                }}
                                                                placeholder="Select SIP Dial Rules..."
                                                                searchPlaceholder="Search SIP dial rules..."
                                                                emptyMessage="No SIP dial rules found."
                                                                onMouseEnter={loadSipDialRules}
                                                                displayValue={
                                                                    typeof data.dialRulesName === 'string'
                                                                        ? data.dialRulesName
                                                                        : data.dialRulesName?._ || data.dialRulesName?.name || ''
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">MTP Preferred Originating Codec*</label>
                                                            <Combobox
                                                                options={[
                                                                    { value: '711ulaw', label: '711ulaw' },
                                                                    { value: '711alaw', label: '711alaw' },
                                                                    { value: 'G729', label: 'G729' },
                                                                    { value: 'G722', label: 'G722' },
                                                                    { value: 'G723', label: 'G723' },
                                                                    { value: 'G726', label: 'G726' },
                                                                    { value: 'G728', label: 'G728' },
                                                                    { value: 'G729a', label: 'G729a' },
                                                                    { value: 'G729b', label: 'G729b' },
                                                                    { value: 'G729ab', label: 'G729ab' },
                                                                    { value: 'G7231', label: 'G7231' },
                                                                    { value: 'G7231a', label: 'G7231a' },
                                                                    { value: 'G7231b', label: 'G7231b' },
                                                                    { value: 'G7231ab', label: 'G7231ab' },
                                                                    { value: 'G726-16', label: 'G726-16' },
                                                                    { value: 'G726-24', label: 'G726-24' },
                                                                    { value: 'G726-32', label: 'G726-32' },
                                                                    { value: 'G726-40', label: 'G726-40' },
                                                                    { value: 'G726-16a', label: 'G726-16a' },
                                                                    { value: 'G726-24a', label: 'G726-24a' },
                                                                    { value: 'G726-32a', label: 'G726-32a' },
                                                                    { value: 'G726-40a', label: 'G726-40a' },
                                                                    { value: 'G726-16b', label: 'G726-16b' },
                                                                    { value: 'G726-24b', label: 'G726-24b' },
                                                                    { value: 'G726-32b', label: 'G726-32b' },
                                                                    { value: 'G726-40b', label: 'G726-40b' },
                                                                    { value: 'G726-16ab', label: 'G726-16ab' },
                                                                    { value: 'G726-24ab', label: 'G726-24ab' },
                                                                    { value: 'G726-32ab', label: 'G726-32ab' },
                                                                    { value: 'G726-40ab', label: 'G726-40ab' },
                                                                ]}
                                                                value={data.mtpPreferedCodec || '711ulaw'}
                                                                onValueChange={(value) => setData('mtpPreferedCodec', value)}
                                                                placeholder="Select MTP Preferred Codec..."
                                                                searchPlaceholder="Search codecs..."
                                                                emptyMessage="No codecs found."
                                                                displayValue={data.mtpPreferedCodec || '711ulaw'}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Device Security Profile*</label>
                                                            <Combobox
                                                                options={phoneSecurityProfiles.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.securityProfileName === 'string'
                                                                        ? data.securityProfileName
                                                                        : data.securityProfileName?._ || data.securityProfileName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedProfile = phoneSecurityProfiles.find(
                                                                        (profile) => profile.name === value,
                                                                    );
                                                                    if (selectedProfile) {
                                                                        setData('securityProfileName', {
                                                                            _: selectedProfile.name,
                                                                            uuid: selectedProfile.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('securityProfileName', null);
                                                                    }
                                                                }}
                                                                placeholder="Select Device Security Profile..."
                                                                searchPlaceholder="Search security profiles..."
                                                                emptyMessage="No security profiles found."
                                                                onMouseEnter={loadPhoneSecurityProfiles}
                                                                displayValue={
                                                                    typeof data.securityProfileName === 'string'
                                                                        ? data.securityProfileName
                                                                        : data.securityProfileName?._ || data.securityProfileName?.name || ''
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Rerouting Calling Search Space</label>
                                                            <Combobox
                                                                options={callingSearchSpaces.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.rerouteCallingSearchSpaceName === 'string'
                                                                        ? data.rerouteCallingSearchSpaceName
                                                                        : data.rerouteCallingSearchSpaceName?._ ||
                                                                          data.rerouteCallingSearchSpaceName?.name ||
                                                                          ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedCss = callingSearchSpaces.find((css) => css.name === value);
                                                                    if (selectedCss) {
                                                                        setData('rerouteCallingSearchSpaceName', {
                                                                            _: selectedCss.name,
                                                                            uuid: selectedCss.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('rerouteCallingSearchSpaceName', null);
                                                                    }
                                                                }}
                                                                placeholder="Select Rerouting Calling Search Space..."
                                                                searchPlaceholder="Search calling search spaces..."
                                                                emptyMessage="No calling search spaces found."
                                                                onMouseEnter={loadCallingSearchSpaces}
                                                                displayValue={
                                                                    typeof data.rerouteCallingSearchSpaceName === 'string'
                                                                        ? data.rerouteCallingSearchSpaceName
                                                                        : data.rerouteCallingSearchSpaceName?._ ||
                                                                          data.rerouteCallingSearchSpaceName?.name ||
                                                                          ''
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">SUBSCRIBE Calling Search Space</label>
                                                            <Combobox
                                                                options={callingSearchSpaces.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.subscribeCallingSearchSpaceName === 'string'
                                                                        ? data.subscribeCallingSearchSpaceName
                                                                        : data.subscribeCallingSearchSpaceName?._ ||
                                                                          data.subscribeCallingSearchSpaceName?.name ||
                                                                          ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedCss = callingSearchSpaces.find((css) => css.name === value);
                                                                    if (selectedCss) {
                                                                        setData('subscribeCallingSearchSpaceName', {
                                                                            _: selectedCss.name,
                                                                            uuid: selectedCss.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('subscribeCallingSearchSpaceName', null);
                                                                    }
                                                                }}
                                                                placeholder="Select SUBSCRIBE Calling Search Space..."
                                                                searchPlaceholder="Search calling search spaces..."
                                                                emptyMessage="No calling search spaces found."
                                                                onMouseEnter={loadCallingSearchSpaces}
                                                                displayValue={
                                                                    typeof data.subscribeCallingSearchSpaceName === 'string'
                                                                        ? data.subscribeCallingSearchSpaceName
                                                                        : data.subscribeCallingSearchSpaceName?._ ||
                                                                          data.subscribeCallingSearchSpaceName?.name ||
                                                                          ''
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">SIP Profile*</label>
                                                            <Combobox
                                                                options={sipProfiles.map((o) => ({
                                                                    value: o.name,
                                                                    label: o.name,
                                                                }))}
                                                                value={
                                                                    typeof data.sipProfileName === 'string'
                                                                        ? data.sipProfileName
                                                                        : data.sipProfileName?._ || data.sipProfileName?.name || ''
                                                                }
                                                                onValueChange={(value) => {
                                                                    const selectedProfile = sipProfiles.find((profile) => profile.name === value);
                                                                    if (selectedProfile) {
                                                                        setData('sipProfileName', {
                                                                            _: selectedProfile.name,
                                                                            uuid: selectedProfile.uuid || '',
                                                                        });
                                                                    } else {
                                                                        setData('sipProfileName', null);
                                                                    }
                                                                }}
                                                                placeholder="Select SIP Profile..."
                                                                searchPlaceholder="Search SIP profiles..."
                                                                emptyMessage="No SIP profiles found."
                                                                onMouseEnter={loadSipProfiles}
                                                                displayValue={
                                                                    typeof data.sipProfileName === 'string'
                                                                        ? data.sipProfileName
                                                                        : data.sipProfileName?._ || data.sipProfileName?.name || ''
                                                                }
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="mb-1 block text-sm font-medium">Digest User</label>
                                                            <Combobox
                                                                options={ucmUsers.map((o) => ({
                                                                    value: o.userid || o.name || '',
                                                                    label: o.userid || o.name || '',
                                                                }))}
                                                                value={data.digestUser || ''}
                                                                onValueChange={(value) => setData('digestUser', value)}
                                                                placeholder="Select Digest User..."
                                                                searchPlaceholder="Search users..."
                                                                emptyMessage="No users found."
                                                                onMouseEnter={loadUcmUsers}
                                                                displayValue={data.digestUser || ''}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Protocol Specific Checkboxes */}
                                                    <div className="border-t pt-6">
                                                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Protocol Options</h4>
                                                        <div className="space-y-4">
                                                            <Toggle
                                                                label="Media Termination Point Required"
                                                                checked={toBoolean(data.mtpRequired)}
                                                                onCheckedChange={(checked: boolean) => setData('mtpRequired', checked)}
                                                            />
                                                            <Toggle
                                                                label="Unattended Port"
                                                                checked={toBoolean(data.unattendedPort)}
                                                                onCheckedChange={(checked: boolean) => setData('unattendedPort', checked)}
                                                            />
                                                            <Toggle
                                                                label="Require DTMF Reception"
                                                                checked={toBoolean(data.requireDtmfReception)}
                                                                onCheckedChange={(checked: boolean) => setData('requireDtmfReception', checked)}
                                                            />
                                                        </div>
                                                    </div>
                                                </FormSection>

                                                {/* Extension Information Section */}
                                                <FormSection title="Extension Information">
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <Toggle
                                                                    label="Enable Extension Mobility"
                                                                    checked={toBoolean(data.enableExtensionMobility)}
                                                                    onCheckedChange={(checked: boolean) =>
                                                                        setData('enableExtensionMobility', checked)
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <label className="mb-1 block text-sm font-medium">Default Profile</label>
                                                                <Combobox
                                                                    options={[
                                                                        { value: 'current', label: '-- Use Current Device Settings --' },
                                                                        ...deviceProfiles.map((o) => ({
                                                                            value: o.name,
                                                                            label: o.name,
                                                                        })),
                                                                    ]}
                                                                    value={
                                                                        typeof data.defaultProfileName === 'string'
                                                                            ? data.defaultProfileName
                                                                            : data.defaultProfileName?._ || data.defaultProfileName?.name || 'current'
                                                                    }
                                                                    onValueChange={(value) => {
                                                                        if (value === 'current') {
                                                                            setData('defaultProfileName', null);
                                                                        } else {
                                                                            const selectedProfile = deviceProfiles.find(
                                                                                (profile) => profile.name === value,
                                                                            );
                                                                            if (selectedProfile) {
                                                                                setData('defaultProfileName', {
                                                                                    _: selectedProfile.name,
                                                                                    uuid: selectedProfile.uuid || '',
                                                                                });
                                                                            } else {
                                                                                setData('defaultProfileName', null);
                                                                            }
                                                                        }
                                                                    }}
                                                                    placeholder="Select a default profile..."
                                                                    searchPlaceholder="Search device profiles..."
                                                                    emptyMessage="No device profiles found."
                                                                    onMouseEnter={loadDeviceProfiles}
                                                                    displayValue={
                                                                        typeof data.defaultProfileName === 'string'
                                                                            ? data.defaultProfileName
                                                                            : data.defaultProfileName?._ ||
                                                                              data.defaultProfileName?.name ||
                                                                              '-- Use Current Device Settings --'
                                                                    }
                                                                />
                                                                {errors.defaultProfileName && (
                                                                    <p className="mt-1 text-sm text-destructive">{errors.defaultProfileName}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mb-6"></div>

                                                    {/* Extension Mobility Status */}
                                                    <div className="border-t pt-6">
                                                        <div className="mb-4 flex items-center justify-between">
                                                            <h4 className="text-sm font-medium text-muted-foreground">
                                                                Current Extension Mobility Status
                                                            </h4>
                                                            <button
                                                                type="button"
                                                                onClick={loadExtensionMobilityData}
                                                                disabled={extensionMobilityLoading}
                                                                className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {extensionMobilityLoading ? (
                                                                    <>
                                                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                                                                        Loading...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg
                                                                            className="h-3 w-3"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                                            />
                                                                        </svg>
                                                                        Refresh Status
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                            <div className="rounded-lg border bg-muted/50 p-3">
                                                                <label className="mb-1 block text-sm font-medium">Logged In User</label>
                                                                <div className="flex items-center gap-2">
                                                                    {extensionMobilityLoading ? (
                                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                                    ) : extensionMobilityData?.userid ? (
                                                                        <span className="text-sm font-medium">{extensionMobilityData.userid}</span>
                                                                    ) : (
                                                                        <span className="text-sm text-muted-foreground">&lt; None &gt;</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="rounded-lg border bg-muted/50 p-3">
                                                                <label className="mb-1 block text-sm font-medium">Current Device Profile</label>
                                                                <div className="flex items-center gap-2">
                                                                    {extensionMobilityLoading ? (
                                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                                    ) : extensionMobilityData?.deviceprofilename ? (
                                                                        <span className="text-sm font-medium">
                                                                            {extensionMobilityData.deviceprofilename}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-sm text-muted-foreground">&lt; None &gt;</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="rounded-lg border bg-muted/50 p-3">
                                                                <label className="mb-1 block text-sm font-medium">Login Time</label>
                                                                <div className="flex items-center gap-2">
                                                                    {extensionMobilityLoading ? (
                                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                                    ) : extensionMobilityData?.logintime ? (
                                                                        <span className="text-sm font-medium">
                                                                            {new Date(
                                                                                parseInt(extensionMobilityData.logintime) * 1000,
                                                                            ).toLocaleString()}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-sm text-muted-foreground">&lt; None &gt;</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="rounded-lg border bg-muted/50 p-3">
                                                                <label className="mb-1 block text-sm font-medium">Login Duration</label>
                                                                <div className="flex items-center gap-2">
                                                                    {extensionMobilityLoading ? (
                                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                                    ) : extensionMobilityData?.loginduration ? (
                                                                        <span className="text-sm font-medium">
                                                                            {extensionMobilityData.loginduration} seconds
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-sm text-muted-foreground">&lt; None &gt;</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </FormSection>

                                                {/* Do Not Disturb Section */}
                                                <FormSection title="Do Not Disturb">
                                                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                        <div>
                                                            <Toggle
                                                                label="Do Not Disturb"
                                                                checked={toBoolean(data.dndStatus)}
                                                                onCheckedChange={(checked: boolean) => setData('dndStatus', checked)}
                                                            />
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">DND Option*</label>
                                                                <Combobox
                                                                    options={[
                                                                        { value: 'Ringer Off', label: 'Ringer Off' },
                                                                        { value: 'Call Reject', label: 'Call Reject' },
                                                                        {
                                                                            value: 'Use Common Phone Profile Setting',
                                                                            label: 'Use Common Phone Profile Setting',
                                                                        },
                                                                    ]}
                                                                    value={data.dndOption || ''}
                                                                    onValueChange={(value) => setData('dndOption', value)}
                                                                    placeholder="Select DND option..."
                                                                    searchPlaceholder="Search options..."
                                                                    emptyMessage="No options found."
                                                                    displayValue={data.dndOption || ''}
                                                                />
                                                                {errors.dndOption && (
                                                                    <p className="mt-1 text-sm text-destructive">{errors.dndOption}</p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium">DND Incoming Call Alert</label>
                                                                <Combobox
                                                                    options={[
                                                                        { value: '< None >', label: '< None >' },
                                                                        { value: 'Disable', label: 'Disable' },
                                                                        { value: 'Flash Only', label: 'Flash Only' },
                                                                        { value: 'Beep Only', label: 'Beep Only' },
                                                                    ]}
                                                                    value={data.dndRingSetting || '< None >'}
                                                                    onValueChange={(value) => setData('dndRingSetting', value)}
                                                                    placeholder="Select DND incoming call alert..."
                                                                    searchPlaceholder="Search options..."
                                                                    emptyMessage="No options found."
                                                                    displayValue={data.dndRingSetting || '< None >'}
                                                                />
                                                                {errors.dndRingSetting && (
                                                                    <p className="mt-1 text-sm text-destructive">{errors.dndRingSetting}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </FormSection>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="api-data" className="mt-6">
                                <div className="overflow-hidden rounded-lg border bg-card shadow">
                                    <div className="p-6">
                                        <PhoneApiData
                                            phoneId={data.id}
                                            apiData={updatedApiData}
                                            onDataUpdate={(newData) => {
                                                // Update the API data state
                                                setUpdatedApiData(newData);
                                            }}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="screen-captures" className="mt-4">
                                <div className="overflow-hidden rounded-lg border bg-card shadow">
                                    <div className="p-4">
                                        <PhoneScreenCaptures
                                            phoneId={data.id}
                                            phoneName={data.name}
                                            canScreenCapture={(phone as any).canScreenCapture}
                                            screenCaptures={screenCaptures || []}
                                        />
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

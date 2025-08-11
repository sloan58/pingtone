import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { PhoneButtonLayout } from '@/components/phone-edit/phone-button-layout';
import { PhoneHeader } from '@/components/phone-edit/phone-header';
import { Combobox } from '@/components/ui/combobox';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

type PhoneForm = {
    id: string;
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
    buttons?: any[];
    lines?: any;
    speedDials?: any[];
    blfs?: any[];
};

type Option = { id: string; name: string; uuid?: string; sourceId?: string; userid?: string };

interface Props {
    phone: PhoneForm;
    phoneButtonTemplate?: any; // The phone button template data from the API
    mohAudioSources?: any[]; // MOH audio sources data from the backend
}

export default function Edit({ phone, phoneButtonTemplate, mohAudioSources }: Props) {
    const { data, setData, patch, processing, errors } = useForm<PhoneForm>(phone as any);
    const isSaving = useRef(false);

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
    const [ucmUsers, setUcmUsers] = useState<Option[]>([]);
    const [mobilityUsers, setMobilityUsers] = useState<Option[]>([]);
    const [phones, setPhones] = useState<Option[]>([]);

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
            const button = {
                index: buttonNum,
                type: templateButton.feature?.toLowerCase() || 'line',
                label: '',
                target: '',
                feature: templateButton.feature || 'Line',
            };

            // Map based on feature type
            switch (templateButton.feature?.toLowerCase()) {
                case 'line':
                    // Find the line that matches this buttonnum position
                    const matchingLine = availableLines.find((line: any) => parseInt(line.index) === buttonNum);
                    if (matchingLine) {
                        button.label = matchingLine?.dirn?.pattern || matchingLine?.label || 'Line';
                        button.target = matchingLine?.dirn?.pattern || '';
                    } else {
                        button.label = 'Add Line';
                        button.target = '';
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
        if (!phoneButtonTemplate?.buttons) return;

        const mappedButtons = mapTemplateToPhoneButtons();
        setData('buttons', mappedButtons);
    }, [phoneButtonTemplate, mapTemplateToPhoneButtons, setData]);

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

    console.log('Select value:', data.builtInBridgeStatus);
    console.log('Phone object keys:', Object.keys(phone));
    console.log('Phone object:', phone);
    console.log('builtInBridge field:', (phone as any).builtInBridge);
    console.log('builtInBridgeStatus field:', (phone as any).builtInBridgeStatus);

    return (
        <AppShell variant="sidebar">
            <Head title={`Edit Phone - ${data.name}`} />
            <AppSidebar />
            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />
                <AppContent variant="sidebar" className="p-0">
                    <div className="space-y-4 p-6">
                        <PhoneHeader
                            name={data.name}
                            model={data.model}
                            ucmName={(phone as any).ucm?.name}
                            onSave={() => {
                                if (isSaving.current) {
                                    return;
                                }
                                isSaving.current = true;

                                // Data is already in the correct MongoDB object structure from the combobox handlers
                                const transformedData = { ...data } as any;

                                patch(`/phones/${data.id}`, transformedData);
                                // Reset the saving flag after a short delay to allow the request to complete
                                setTimeout(() => {
                                    isSaving.current = false;
                                }, 1000);
                            }}
                            onRevert={() => window.location.reload()}
                            canSave={true}
                            saving={processing}
                        />
                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                            {/* Left Column - Phone Button Configuration */}
                            <div className="lg:col-span-1">
                                <div className="overflow-hidden rounded-lg border bg-card shadow">
                                    <div className="p-6">
                                        <PhoneButtonLayout
                                            buttons={data.buttons || []}
                                            onButtonClick={(button) => {
                                                // TODO: Open button configuration modal
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
                                        <h2 className="text-lg font-semibold">Device Settings</h2>
                                        <p className="text-sm text-muted-foreground">Update basic phone configuration</p>
                                    </div>
                                    <form className="space-y-6 p-6">
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
                                                {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description}</p>}
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
                                                {errors.devicePoolName && <p className="mt-1 text-sm text-destructive">{errors.devicePoolName}</p>}
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
                                                        const selectedConfig = commonDeviceConfigs.find((config) => config.name === value);
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
                                                        const selectedTemplate = phoneButtonTemplates.find((template) => template.name === value);
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
                                                            setData('callingSearchSpaceName', { _: '', uuid: '' });
                                                        }
                                                    }}
                                                    placeholder="Select a calling search space..."
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
                                                            setData('automatedAlternateRoutingCssName', { _: '', uuid: '' });
                                                        }
                                                    }}
                                                    placeholder="Select an AAR calling search space..."
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
                                                    <p className="mt-1 text-sm text-destructive">{errors.automatedAlternateRoutingCssName}</p>
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
                                                                String(audioSource.sourceId || audioSource.uuid || audioSource.name) === value,
                                                        );
                                                        if (selectedAudioSource) {
                                                            setData(
                                                                'userHoldMohAudioSourceId',
                                                                selectedAudioSource.sourceId || selectedAudioSource.uuid || selectedAudioSource.name,
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
                                                                String(audioSource.sourceId || audioSource.uuid || audioSource.name) === value,
                                                        );
                                                        if (selectedAudioSource) {
                                                            setData(
                                                                'networkHoldMohAudioSourceId',
                                                                selectedAudioSource.sourceId || selectedAudioSource.uuid || selectedAudioSource.name,
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
                                                {errors.locationName && <p className="mt-1 text-sm text-destructive">{errors.locationName}</p>}
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
                                                {errors.userLocale && <p className="mt-1 text-sm text-destructive">{errors.userLocale}</p>}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Built In Bridge</label>
                                                <select
                                                    value={data.builtInBridgeStatus || ''}
                                                    onChange={(e) => setData('builtInBridgeStatus', e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">&lt; None &gt;</option>
                                                    <option value="Off">Off</option>
                                                    <option value="On">On</option>
                                                    <option value="Default">Default</option>
                                                </select>
                                                {errors.builtInBridgeStatus && (
                                                    <p className="mt-1 text-sm text-destructive">{errors.builtInBridgeStatus}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Privacy</label>
                                                <select
                                                    value={data.callInfoPrivacyStatus || ''}
                                                    onChange={(e) => setData('callInfoPrivacyStatus', e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">&lt; None &gt;</option>
                                                    <option value="Off">Off</option>
                                                    <option value="On">On</option>
                                                    <option value="Default">Default</option>
                                                </select>
                                                {errors.callInfoPrivacyStatus && (
                                                    <p className="mt-1 text-sm text-destructive">{errors.callInfoPrivacyStatus}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Device Mobility Mode</label>
                                                <select
                                                    value={data.deviceMobilityMode || ''}
                                                    onChange={(e) => setData('deviceMobilityMode', e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">&lt; None &gt;</option>
                                                    <option value="Off">Off</option>
                                                    <option value="On">On</option>
                                                    <option value="Default">Default</option>
                                                </select>
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
                                                {errors.ownerUserName && <p className="mt-1 text-sm text-destructive">{errors.ownerUserName}</p>}
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
                                                <select
                                                    value={data.useTrustedRelayPoint || ''}
                                                    onChange={(e) => setData('useTrustedRelayPoint', e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">&lt; None &gt;</option>
                                                    <option value="Off">Off</option>
                                                    <option value="On">On</option>
                                                    <option value="Default">Default</option>
                                                </select>
                                                {errors.useTrustedRelayPoint && (
                                                    <p className="mt-1 text-sm text-destructive">{errors.useTrustedRelayPoint}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">Always Use Prime Line*</label>
                                                <select
                                                    value={data.alwaysUsePrimeLine || ''}
                                                    onChange={(e) => setData('alwaysUsePrimeLine', e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">&lt; None &gt;</option>
                                                    <option value="Off">Off</option>
                                                    <option value="On">On</option>
                                                    <option value="Default">Default</option>
                                                </select>
                                                {errors.alwaysUsePrimeLine && (
                                                    <p className="mt-1 text-sm text-destructive">{errors.alwaysUsePrimeLine}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">BLF Audible Alert Setting (Phone Idle)*</label>
                                                <select
                                                    value={data.ringSettingIdleBlfAudibleAlert || ''}
                                                    onChange={(e) => setData('ringSettingIdleBlfAudibleAlert', e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">&lt; None &gt;</option>
                                                    <option value="Off">Off</option>
                                                    <option value="On">On</option>
                                                    <option value="Default">Default</option>
                                                </select>
                                                {errors.ringSettingIdleBlfAudibleAlert && (
                                                    <p className="mt-1 text-sm text-destructive">{errors.ringSettingIdleBlfAudibleAlert}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">BLF Audible Alert Setting (Phone Busy)*</label>
                                                <select
                                                    value={data.ringSettingBusyBlfAudibleAlert || ''}
                                                    onChange={(e) => setData('ringSettingBusyBlfAudibleAlert', e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <option value="">&lt; None &gt;</option>
                                                    <option value="Off">Off</option>
                                                    <option value="On">On</option>
                                                    <option value="Default">Default</option>
                                                </select>
                                                {errors.ringSettingBusyBlfAudibleAlert && (
                                                    <p className="mt-1 text-sm text-destructive">{errors.ringSettingBusyBlfAudibleAlert}</p>
                                                )}
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

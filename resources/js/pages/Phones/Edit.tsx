import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { PhoneButton } from '@/components/phone-edit/buttons-editor';
import { PhoneButtonLayout } from '@/components/phone-edit/phone-button-layout';
import { PhoneHeader } from '@/components/phone-edit/phone-header';
import { Combobox } from '@/components/ui/combobox';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type PhoneForm = {
    id: string;
    ucm_id: string;
    name: string;
    description?: string;
    model?: string;
    protocol?: string;
    devicePoolName?: string;
    commonDeviceConfigName?: string;
    phoneTemplateName?: string;
    commonPhoneConfigName?: string;
    buttons?: PhoneButton[];
};

type Option = { id: string; name: string; uuid?: string };

interface Props {
    phone: PhoneForm;
}

export default function Edit({ phone }: Props) {
    const { data, setData, patch, processing, errors } = useForm<PhoneForm>(phone);
    const [activeTab, setActiveTab] = useState<'device' | 'lines' | 'speed_dials' | 'blfs'>('device');
    const [isDirty, setIsDirty] = useState(false);
    const [originalData, setOriginalData] = useState(phone);

    const [devicePools, setDevicePools] = useState<Option[]>([]);
    const [phoneModels, setPhoneModels] = useState<Option[]>([]);
    const [commonDeviceConfigs, setCommonDeviceConfigs] = useState<Option[]>([]);
    const [phoneButtonTemplates, setPhoneButtonTemplates] = useState<Option[]>([]);
    const [commonPhoneConfigs, setCommonPhoneConfigs] = useState<Option[]>([]);

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

    useEffect(() => {
        // Handle devicePoolName properly - compare the actual values
        const currentDevicePool =
            typeof data.devicePoolName === 'string' ? data.devicePoolName : data.devicePoolName?._ || data.devicePoolName?.name || '';
        const originalDevicePool =
            typeof originalData.devicePoolName === 'string'
                ? originalData.devicePoolName
                : originalData.devicePoolName?._ || originalData.devicePoolName?.name || '';

        // Handle model properly - it's a simple string
        const currentModel = data.model || '';
        const originalModel = originalData.model || '';

        const isDataDirty =
            data.name !== originalData.name ||
            (data.description || '') !== (originalData.description || '') ||
            currentModel !== originalModel ||
            currentDevicePool !== originalDevicePool ||
            JSON.stringify(data.buttons || []) !== JSON.stringify(originalData.buttons || []);

        console.log('Dirty state check:', {
            name: { current: data.name, original: originalData.name, dirty: data.name !== originalData.name },
            description: {
                current: data.description || '',
                original: originalData.description || '',
                dirty: (data.description || '') !== (originalData.description || ''),
            },
            model: { current: currentModel, original: originalModel, dirty: currentModel !== originalModel },
            devicePoolName: { current: currentDevicePool, original: originalDevicePool, dirty: currentDevicePool !== originalDevicePool },
            isDirty,
        });

        setIsDirty(isDataDirty);
    }, [data.name, data.description, data.model, data.devicePoolName, data.buttons, originalData]);

    // Handle toast messages from backend
    const page = usePage();
    useEffect(() => {
        if (page.props.flash?.toast) {
            const toastData = page.props.flash.toast;
            if (toastData.type === 'success') {
                toast.success(toastData.message);
                // Update originalData to match the current data after successful save
                setOriginalData({ ...data });
                setIsDirty(false);
            } else if (toastData.type === 'error') {
                toast.error(toastData.message);
            }
        }
    }, [page.props.flash?.toast]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // Data is already in the correct MongoDB object structure from the combobox handlers
        const transformedData = { ...data };

        patch(`/phones/${data.id}`, transformedData, {
            onStart: () => {
                setIsSaving(true);
            },
            onFinish: () => {
                setIsSaving(false);
            },
        });
    };

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
                                console.log('Save button clicked');

                                // Data is already in the correct MongoDB object structure from the combobox handlers
                                const transformedData = { ...data };

                                patch(`/phones/${data.id}`, transformedData);
                            }}
                            onRevert={() => window.location.reload()}
                            canSave={isDirty}
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
                                                console.log('Button clicked:', button);
                                                // TODO: Open button configuration modal
                                            }}
                                            onAddButton={() => {
                                                console.log('Add button clicked');
                                                // TODO: Open add button modal
                                            }}
                                            onReorderButtons={(reorderedButtons) => {
                                                console.log('Buttons reordered:', reorderedButtons);
                                                setData('buttons', reorderedButtons);
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
                                    <form onSubmit={submit} className="space-y-6 p-6">
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

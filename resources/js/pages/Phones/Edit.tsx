import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { ButtonsEditor, PhoneButton } from '@/components/phone-edit/buttons-editor';
import { PhoneHeader } from '@/components/phone-edit/phone-header';
import { PhoneInnerNav } from '@/components/phone-edit/phone-inner-nav';
import { Combobox } from '@/components/ui/combobox';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type PhoneForm = {
    id: string;
    ucm_id: string;
    name: string;
    description?: string;
    model?: string;
    devicePoolName?: string;
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
    const [originalData] = useState(phone);



    const [devicePools, setDevicePools] = useState<Option[]>([]);
    const [phoneModels, setPhoneModels] = useState<Option[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        fetch(`/api/ucm/${data.ucm_id}/options/device-pools`, { signal: controller.signal })
            .then((r) => r.json())
            .then(setDevicePools)
            .catch(() => {});
        fetch(`/api/ucm/${data.ucm_id}/options/phone-models`, { signal: controller.signal })
            .then((r) => r.json())
            .then(setPhoneModels)
            .catch(() => {});
        return () => controller.abort();
    }, [data.ucm_id]);

    useEffect(() => {
        // Handle devicePoolName properly - it might be an object or string
        const currentDevicePool =
            typeof data.devicePoolName === 'string' ? data.devicePoolName : data.devicePoolName?._ || data.devicePoolName?.name || '';
        const originalDevicePool =
            typeof originalData.devicePoolName === 'string'
                ? originalData.devicePoolName
                : originalData.devicePoolName?._ || originalData.devicePoolName?.name || '';

        const isDataDirty =
            data.name !== originalData.name ||
            (data.description || '') !== (originalData.description || '') ||
            (data.model || '') !== (originalData.model || '') ||
            currentDevicePool !== originalDevicePool ||
            JSON.stringify(data.buttons || []) !== JSON.stringify(originalData.buttons || []);

        setIsDirty(isDataDirty);
    }, [data.name, data.description, data.model, data.devicePoolName, data.buttons, originalData]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/phones/${data.id}`);
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
                            onSave={() => submit(new Event('submit') as any)}
                            onRevert={() => window.location.reload()}
                            canSave={isDirty}
                        />
                        <PhoneInnerNav active={activeTab} onChange={setActiveTab} />
                        <div className="overflow-hidden rounded-lg border bg-card shadow">
                            <div className="border-b p-6">
                                <h2 className="text-lg font-semibold">
                                    {activeTab === 'device'
                                        ? 'Device'
                                        : activeTab === 'lines'
                                          ? 'Lines'
                                          : activeTab === 'speed_dials'
                                            ? 'Speed Dials'
                                            : 'BLFs'}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {activeTab === 'device' ? 'Update basic phone settings' : 'Configure items for this phone'}
                                </p>
                            </div>
                            <form onSubmit={submit} className="space-y-6 p-6">
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
                                    <Combobox
                                        options={phoneModels.map((o) => ({
                                            value: o.name,
                                            label: o.name,
                                        }))}
                                        value={data.model || ''}
                                        onValueChange={(value) => setData('model', value)}
                                        placeholder="Select a model..."
                                        searchPlaceholder="Search models..."
                                        emptyMessage="No models found."
                                    />
                                    {errors.model && <p className="mt-1 text-sm text-destructive">{errors.model}</p>}
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
                                        onValueChange={(value) => setData('devicePoolName', value)}
                                        placeholder="Select a device pool..."
                                        searchPlaceholder="Search device pools..."
                                        emptyMessage="No device pools found."
                                    />
                                    {errors.devicePoolName && <p className="mt-1 text-sm text-destructive">{errors.devicePoolName}</p>}
                                </div>

                                {activeTab !== 'device' && (
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold">
                                            {activeTab === 'lines' ? 'Lines' : activeTab === 'speed_dials' ? 'Speed Dials' : 'BLFs'}
                                        </h3>
                                        <ButtonsEditor
                                            value={data.buttons || []}
                                            onChange={(next) => {
                                                setData('buttons', next);
                                                setIsDirty(true);
                                            }}
                                        />
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                </AppContent>
            </div>
        </AppShell>
    );
}

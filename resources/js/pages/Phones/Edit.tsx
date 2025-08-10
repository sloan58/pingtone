import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type PhoneForm = {
  id: string;
  ucm_id: string;
  name: string;
  description?: string;
  model?: string;
  devicePoolName?: string;
};

type Option = { id: string; name: string; uuid?: string };

interface Props { phone: PhoneForm }

export default function Edit({ phone }: Props) {
  const { data, setData, patch, processing, errors } = useForm<PhoneForm>(phone);

  const [devicePools, setDevicePools] = useState<Option[]>([]);
  const [phoneModels, setPhoneModels] = useState<Option[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/ucm/${data.ucm_id}/options/device-pools`, { signal: controller.signal })
      .then(r => r.json()).then(setDevicePools).catch(() => {});
    fetch(`/api/ucm/${data.ucm_id}/options/phone-models`, { signal: controller.signal })
      .then(r => r.json()).then(setPhoneModels).catch(() => {});
    return () => controller.abort();
  }, [data.ucm_id]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch(`/phones/${data.id}`);
  };

  return (
    <AuthenticatedLayout>
      <Head title={`Edit Phone - ${data.name}`} />
      <div className="py-12">
        <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
          <div className="overflow-hidden bg-card shadow sm:rounded-lg">
            <div className="border-b p-6">
              <h2 className="text-xl font-semibold">Edit Phone</h2>
              <p className="text-sm text-muted-foreground">Update basic phone settings</p>
            </div>
            <form onSubmit={submit} className="space-y-6 p-6">
              <div>
                <label className="mb-1 block text-sm font-medium">Name</label>
                <input className="w-full rounded-md border bg-background p-2" value={data.name} onChange={e=>setData('name', e.target.value)} />
                {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <input className="w-full rounded-md border bg-background p-2" value={data.description||''} onChange={e=>setData('description', e.target.value)} />
                {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Model</label>
                <select className="w-full rounded-md border bg-background p-2" value={data.model||''} onChange={e=>setData('model', e.target.value)}>
                  <option value="">Select a model…</option>
                  {phoneModels.map(o => (
                    <option key={o.id} value={o.name}>{o.name}</option>
                  ))}
                </select>
                {errors.model && <p className="mt-1 text-sm text-destructive">{errors.model}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Device Pool</label>
                <select className="w-full rounded-md border bg-background p-2" value={data.devicePoolName||''} onChange={e=>setData('devicePoolName', e.target.value)}>
                  <option value="">Select a device pool…</option>
                  {devicePools.map(o => (
                    <option key={o.id} value={o.name}>{o.name}</option>
                  ))}
                </select>
                {errors.devicePoolName && <p className="mt-1 text-sm text-destructive">{errors.devicePoolName}</p>}
              </div>

              <div className="flex items-center justify-between">
                <Link href={`/phones/${data.id}`} className="text-sm text-muted-foreground hover:underline">Cancel</Link>
                <button disabled={processing} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}



import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Phone } from '@/types';
import { Head, Link } from '@inertiajs/react';

interface Props {
    phones: {
        data: Phone[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

export default function Index({ phones }: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Phones" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-card shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="mb-6 text-2xl font-semibold">Phones</h2>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Model
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Device Pool
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        {phones.data.map((phone) => {
                                            const devicePool =
                                                (phone as any).devicePoolName ||
                                                (phone as any).device_pool_name ||
                                                (phone as any).devicepoolname || '';
                                            const devicePoolText =
                                                typeof devicePool === 'string'
                                                    ? devicePool
                                                    : devicePool?.name || devicePool?._ || devicePool?.value || '';
                                            return (
                                                <tr key={(phone as any).id ?? (phone as any)._id} className="hover:bg-muted/50">
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{(phone as any).name}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{(phone as any).description || ''}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{(phone as any).model || ''}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{devicePoolText}</td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                                                        <Link href={`/phones/${(phone as any).id}/edit`} className="text-primary hover:underline">
                                                            Edit
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Phone } from '@/types';
import { Head } from '@inertiajs/react';

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
                                                Model
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                UCM
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                Lines
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        {phones.data.map((phone) => (
                                            <tr key={phone.id} className="hover:bg-muted/50">
                                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-foreground">{phone.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{phone.model}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                                                    <span
                                                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                                            phone.status === 'Registered' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {phone.status}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">{phone.ucm?.name}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
                                                    {phone.lines?.length || 0}
                                                </td>
                                            </tr>
                                        ))}
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

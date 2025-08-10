import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
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
        <AppShell variant="sidebar">
            <Head title="Phones" />

            <AppSidebar />

            <div className="flex flex-1 flex-col gap-4">
                <AppHeader />

                <AppContent variant="sidebar">
                    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
                        <div className="p-6">
                            <h2 className="mb-6 text-2xl font-semibold">Phones</h2>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Model
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Device Pool
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-card">
                                        {phones.data.map((phone) => {
                                            const devicePool =
                                                (phone as any).devicePoolName ||
                                                (phone as any).device_pool_name ||
                                                (phone as any).devicepoolname ||
                                                '';
                                            const devicePoolText =
                                                typeof devicePool === 'string'
                                                    ? devicePool
                                                    : devicePool?.name || devicePool?._ || devicePool?.value || '';
                                            return (
                                                <tr key={(phone as any).id ?? (phone as any)._id} className="hover:bg-muted/50">
                                                    <td className="px-6 py-4 text-sm font-medium whitespace-nowrap text-foreground">
                                                        {(phone as any).name}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                                                        {(phone as any).description || ''}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">
                                                        {(phone as any).model || ''}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm whitespace-nowrap text-muted-foreground">{devicePoolText}</td>
                                                    <td className="px-6 py-4 text-right text-sm whitespace-nowrap">
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
                </AppContent>
            </div>
        </AppShell>
    );
}

import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { Edit, Phone, Plus, Search } from 'lucide-react';
import { useState } from 'react';

interface Line {
    _id: string;
    uuid: string;
    pattern: string;
    description?: string;
    routePartitionName?: {
        _: string;
        uuid: string;
    };
    usage: string;
    shareLineAppearanceCssName?: {
        _: string;
        uuid: string;
    };
    voiceMailProfileName?: {
        _: string;
        uuid: string;
    };
    associatedDevicesCount?: number;
}

interface Props {
    lines: Line[];
    searchQuery?: string;
}

export default function LinesIndex({ lines, searchQuery = '' }: Props) {
    const [search, setSearch] = useState(searchQuery);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/lines', { search }, { preserveState: true });
    };

    return (
        <AppLayout>
            <Head title="Lines" />
                    <div className="flex flex-col gap-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Lines</h1>
                                <p className="text-muted-foreground">
                                    Manage directory numbers and their configurations
                                </p>
                            </div>
                            <Link
                                href="/lines/create"
                                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Line
                            </Link>
                        </div>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search lines by pattern, description, or partition..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                            >
                                Search
                            </button>
                        </form>

                        {/* Table */}
                        <div className="rounded-md border">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                Pattern
                                            </th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                Description
                                            </th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                Partition
                                            </th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                Usage
                                            </th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                Calling Search Space
                                            </th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                Voice Mail Profile
                                            </th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                Devices
                                            </th>
                                            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lines.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="h-24 text-center text-muted-foreground">
                                                    {searchQuery ? 'No lines found matching your search.' : 'No lines found.'}
                                                </td>
                                            </tr>
                                        ) : (
                                            lines.map((line) => (
                                                <tr key={line.uuid} className="border-b transition-colors hover:bg-muted/50">
                                                    <td className="p-4 align-middle">
                                                        <div className="font-medium">{line.pattern}</div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="max-w-[200px] truncate" title={line.description}>
                                                            {line.description || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="max-w-[150px] truncate" title={line.routePartitionName?._}>
                                                            {line.routePartitionName?._ || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                                            {line.usage}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="max-w-[150px] truncate" title={line.shareLineAppearanceCssName?._}>
                                                            {line.shareLineAppearanceCssName?._ || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="max-w-[150px] truncate" title={line.voiceMailProfileName?._}>
                                                            {line.voiceMailProfileName?._ || '-'}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="h-3 w-3 text-muted-foreground" />
                                                            <span className="text-sm text-muted-foreground">
                                                                {line.associatedDevicesCount || 0}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/lines/${line._id}/edit`}
                                                                className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
                                                                title="Edit line"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Summary */}
                        {lines.length > 0 && (
                            <div className="text-sm text-muted-foreground">
                                Showing {lines.length} line{lines.length !== 1 ? 's' : ''}
                                {searchQuery && ` matching "${searchQuery}"`}
                            </div>
                        )}
                    </div>
        </AppLayout>
    );
}

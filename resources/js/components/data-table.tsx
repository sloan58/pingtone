import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable, VisibilityState } from '@tanstack/react-table';
import { Eye } from 'lucide-react';
import * as React from 'react';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    sorting: SortingState;
    onSortingChange: (updater: SortingState) => void;
    columnVisibility?: VisibilityState;
    onColumnVisibilityChange?: (updater: VisibilityState) => void;
    showColumnVisibility?: boolean;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    sorting,
    onSortingChange,
    columnVisibility = {},
    onColumnVisibilityChange,
    showColumnVisibility = true,
}: DataTableProps<TData, TValue>) {
    const [dropdownOpen, setDropdownOpen] = React.useState(false);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnVisibility,
        },
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            onSortingChange(newSorting);
        },
        onColumnVisibilityChange: onColumnVisibilityChange
            ? (updater) => {
                  const newVisibility = typeof updater === 'function' ? updater(columnVisibility) : updater;
                  onColumnVisibilityChange(newVisibility);
              }
            : undefined,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualSorting: true,
    });

    const visibleColumns = table.getAllLeafColumns().filter((column) => column.getIsVisible());
    const hiddenColumns = table.getAllLeafColumns().filter((column) => !column.getIsVisible());

    const handleDropdownOpenChange = (open: boolean) => {
        // Only close if clicking outside or pressing escape
        // Don't close when clicking on checkboxes
        setDropdownOpen(open);
    };

    return (
        <div className="space-y-4">
            {/* Column Visibility Controls */}
            {showColumnVisibility && (
                <div className="flex items-center justify-end">
                    <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange} modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8">
                                <Eye className="mr-2 h-4 w-4" />
                                Columns
                                {hiddenColumns.length > 0 && (
                                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{hiddenColumns.length}</span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">Toggle columns</div>
                            <DropdownMenuSeparator />
                            {table
                                .getAllLeafColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                            onSelect={(e) => {
                                                // Prevent the dropdown from closing when selecting items
                                                e.preventDefault();
                                            }}
                                        >
                                            {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                {visibleColumns.length} of {table.getAllLeafColumns().length} columns visible
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-6 py-3 text-left text-xs font-medium tracking-wider text-muted-foreground uppercase"
                                    >
                                        {header.isPlaceholder ? null : (
                                            <button className="select-none" onClick={header.column.getToggleSortingHandler()}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {({ asc: ' ▲', desc: ' ▼' } as any)[header.column.getIsSorted() as string] ?? null}
                                            </button>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {table.getRowModel().rows.map((row) => (
                            <tr key={row.id} className="hover:bg-muted/50">
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-6 py-4 text-sm whitespace-nowrap">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

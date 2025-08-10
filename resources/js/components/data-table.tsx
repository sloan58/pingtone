import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    sorting: SortingState;
    onSortingChange: (updater: SortingState) => void;
}

export function DataTable<TData, TValue>({ columns, data, sorting, onSortingChange }: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualSorting: true,
    });

    return (
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
    );
}

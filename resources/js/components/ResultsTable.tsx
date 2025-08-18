import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import React from 'react';

interface QueryResults {
    rows: Record<string, any>[];
    columns: Array<{
        data_field: string;
        text: string;
        sort?: boolean;
        filter?: boolean;
    }>;
}

interface ResultsTableProps {
    results: QueryResults;
    onExport?: () => void;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results, onExport }) => {
    const [sorting, setSorting] = React.useState([]);
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [columnFilters, setColumnFilters] = React.useState([]);

    if (!results.rows || results.rows.length === 0) {
        return null;
    }

    // Build columns for TanStack Table
    const columns = React.useMemo(() => {
        return results.columns.map((col) => ({
            accessorKey: col.data_field,
            header: col.text,
            enableSorting: col.sort !== false,
            enableColumnFilter: col.filter !== false,
            cell: (info: any) => {
                const value = info.getValue();
                return value !== null && value !== undefined ? String(value) : '';
            },
        }));
    }, [results.columns]);

    const data = React.useMemo(() => results.rows, [results.rows]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            globalFilter,
            columnFilters,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        debugTable: false,
    });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    Query Results ({results.rows.length} rows)
                    {onExport && (
                        <Button onClick={onExport} variant="outline" size="sm" className="flex items-center space-x-2">
                            <Download className="h-4 w-4" />
                            <span>Export CSV</span>
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="mb-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead
                                            key={header.id}
                                            className={header.column.getCanSort() ? 'cursor-pointer select-none hover:bg-muted/50' : ''}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                                                {header.column.getIsSorted() === 'asc' && <span className="ml-1 text-xs">▲</span>}
                                                {header.column.getIsSorted() === 'desc' && <span className="ml-1 text-xs">▼</span>}
                                            </div>
                                            {header.column.getCanFilter() && (
                                                <div className="mt-2 mb-2">
                                                    <input
                                                        className="block w-full rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                                                        value={(header.column.getFilterValue() as string) ?? ''}
                                                        onChange={(e) => header.column.setFilterValue(e.target.value)}
                                                        placeholder="Filter..."
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                            )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} className="hover:bg-muted/50">
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-2 align-top">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                <div className="mt-4 flex flex-col items-center justify-between gap-2 sm:flex-row">
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm">
                            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        Rows per page:
                        <Select value={String(table.getState().pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
                            <SelectTrigger className="h-8 w-20 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 20, 50, 100].map((pageSize) => (
                                    <SelectItem key={pageSize} value={String(pageSize)}>
                                        {pageSize}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ResultsTable;

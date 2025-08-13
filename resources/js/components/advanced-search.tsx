import { useEffect, useMemo, useState } from 'react';
import { Combobox } from '@/components/ui/combobox';

export type FilterRow = {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in';
    value: string;
};

interface AdvancedSearchProps {
    fields: Array<{ value: string; label: string }>;
    initial?: { applied?: FilterRow[]; logic?: 'and' | 'or' };
    onApply: (payload: { filters: FilterRow[]; logic: 'and' | 'or' }) => void;
}

export function AdvancedSearch({ fields, initial, onApply }: AdvancedSearchProps) {
    const initialRows = (initial?.applied ?? []).map((r) => ({ field: r.field, operator: r.operator, value: r.value }));
    const [rows, setRows] = useState<FilterRow[]>(initialRows);
    const [logic, setLogic] = useState<'and' | 'or'>(initial?.logic ?? 'and');

    useEffect(() => {
        const next = (initial?.applied ?? []).map((r) => ({ field: r.field, operator: r.operator, value: r.value }));
        setRows(next);
        setLogic(initial?.logic ?? 'and');
    }, [initial?.applied, initial?.logic]);

    const operators = useMemo(
        () => [
            { value: 'equals', label: 'equals' },
            { value: 'not_equals', label: 'not equals' },
            { value: 'contains', label: 'contains' },
            { value: 'starts_with', label: 'starts with' },
            { value: 'ends_with', label: 'ends with' },
            { value: 'in', label: 'in (comma-separated)' },
            { value: 'not_in', label: 'not in (comma-separated)' },
        ],
        [],
    );

    const logicOptions = useMemo(
        () => [
            { value: 'and', label: 'all' },
            { value: 'or', label: 'any' },
        ],
        [],
    );

    const addRow = () =>
        setRows((r) => {
            // Avoid duplicating a trailing empty row when initial filters also empty
            if (r.length > 0) {
                const last = r[r.length - 1];
                if (!last.value && last.field && last.operator) {
                    return r; // keep single empty row
                }
            }
            return [...r, { field: fields[0]?.value ?? '', operator: 'contains', value: '' }];
        });
    const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

    const updateRow = (i: number, patch: Partial<FilterRow>) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

    const apply = () => {
        const sanitized = rows.filter((r) => r.field && r.operator && String(r.value).trim() !== '');
        onApply({ filters: sanitized, logic });
    };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-sm">Match</span>
                    <Combobox
                        options={logicOptions}
                        value={logic}
                        onValueChange={(value) => setLogic(value as 'and' | 'or')}
                        placeholder="Select logic..."
                        className="w-24"
                    />
                    <span className="text-sm">conditions</span>
                </div>
                <div className="flex items-center gap-2">
                    <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={addRow}>
                        Add condition
                    </button>
                    <button type="button" className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={apply}>
                        Apply filters
                    </button>
                </div>
            </div>

            <div className="flex flex-col gap-2">
                {rows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Combobox
                            options={fields}
                            value={row.field}
                            onValueChange={(value) => updateRow(i, { field: value })}
                            placeholder="Select field..."
                            className="w-48"
                        />
                        <Combobox
                            options={operators}
                            value={row.operator}
                            onValueChange={(value) => updateRow(i, { operator: value as FilterRow['operator'] })}
                            placeholder="Select operator..."
                            className="w-48"
                        />
                        <input
                            className="flex-1 rounded-md border bg-background p-2 text-sm"
                            value={row.value}
                            onChange={(e) => updateRow(i, { value: e.target.value })}
                        />
                        <button type="button" className="rounded-md border px-2 py-1 text-sm" onClick={() => removeRow(i)}>
                            Remove
                        </button>
                    </div>
                ))}
            </div>

            {/* Buttons moved up next to Add condition */}
        </div>
    );
}

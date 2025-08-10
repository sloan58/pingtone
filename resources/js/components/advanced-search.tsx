import { useEffect, useMemo, useState } from 'react';

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
    const [rows, setRows] = useState<FilterRow[]>(initial?.applied ?? []);
    const [logic, setLogic] = useState<'and' | 'or'>(initial?.logic ?? 'and');

    useEffect(() => {
        setRows(initial?.applied ?? []);
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

  const addRow = () => setRows((r) => [...r, { field: fields[0]?.value ?? '', operator: 'contains', value: '' }]);
    const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

    const updateRow = (i: number, patch: Partial<FilterRow>) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const apply = () => {
    const sanitized = rows.filter((r) => r.field && r.operator && String(r.value).trim() !== '');
    onApply({ filters: sanitized, logic });
    // prevent accumulative UI duplication by resetting to sanitized state
    setRows(sanitized);
  };

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-sm">Match</span>
                    <select
                        className="rounded-md border bg-background p-1 text-sm"
                        value={logic}
                        onChange={(e) => setLogic(e.target.value as 'and' | 'or')}
                    >
                        <option value="and">all</option>
                        <option value="or">any</option>
                    </select>
                    <span className="text-sm">conditions</span>
                </div>
                <button type="button" className="rounded-md border px-2 py-1 text-sm" onClick={addRow}>
                    Add condition
                </button>
            </div>

            <div className="flex flex-col gap-2">
                {rows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <select
                            className="w-48 rounded-md border bg-background p-2 text-sm"
                            value={row.field}
                            onChange={(e) => updateRow(i, { field: e.target.value })}
                        >
                            {fields.map((f) => (
                                <option key={f.value} value={f.value}>
                                    {f.label}
                                </option>
                            ))}
                        </select>
                        <select
                            className="w-48 rounded-md border bg-background p-2 text-sm"
                            value={row.operator}
                            onChange={(e) => updateRow(i, { operator: e.target.value as FilterRow['operator'] })}
                        >
                            {operators.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
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

            <div className="flex justify-end">
                <button type="button" className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" onClick={apply}>
                    Apply filters
                </button>
            </div>
        </div>
    );
}

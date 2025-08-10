import * as React from 'react';

export type PhoneButton = {
  index: number;
  type: 'line' | 'speed_dial' | 'blf' | 'intercom' | string;
  label?: string;
  target?: string; // pattern, directory number, uri, etc.
};

interface ButtonsEditorProps {
  value: PhoneButton[];
  onChange: (next: PhoneButton[]) => void;
}

export function ButtonsEditor({ value, onChange }: ButtonsEditorProps) {
  const [selected, setSelected] = React.useState<number | null>(null);

  const sorted = React.useMemo(() => [...value].sort((a, b) => a.index - b.index), [value]);

  const update = (idx: number, patch: Partial<PhoneButton>) => {
    const next = value.map((b) => (b.index === idx ? { ...b, ...patch } : b));
    onChange(next);
  };

  const add = () => {
    const nextIndex = (value.length ? Math.max(...value.map((b) => b.index)) : 0) + 1;
    onChange([...value, { index: nextIndex, type: 'line', label: '', target: '' }]);
    setSelected(nextIndex);
  };

  const remove = (idx: number) => {
    onChange(value.filter((b) => b.index !== idx));
    if (selected === idx) setSelected(null);
  };

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="space-y-2 md:col-span-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Buttons</h3>
          <button className="rounded-md border px-2 py-1 text-sm" type="button" onClick={add}>Add</button>
        </div>
        <div className="rounded-md border">
          {sorted.map((b) => (
            <button
              key={b.index}
              type="button"
              onClick={() => setSelected(b.index)}
              className={`flex w-full items-center justify-between border-b px-3 py-2 text-left text-sm last:border-b-0 ${
                selected === b.index ? 'bg-muted' : ''
              }`}
            >
              <span className="font-medium">{b.index}</span>
              <span className="text-muted-foreground">{b.type}</span>
              <span className="truncate">{b.label || b.target || ''}</span>
            </button>
          ))}
          {sorted.length === 0 && <div className="p-3 text-sm text-muted-foreground">No buttons configured</div>}
        </div>
      </div>
      <div className="md:col-span-2">
        {selected == null ? (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">Select a button to edit.</div>
        ) : (
          (() => {
            const b = value.find((x) => x.index === selected)!;
            return (
              <div className="space-y-3 rounded-md border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Button {b.index}</h4>
                  <button className="rounded-md border px-2 py-1 text-sm" type="button" onClick={() => remove(b.index)}>
                    Remove
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium">Type</label>
                    <select className="w-full rounded-md border bg-background p-2 text-sm" value={b.type}
                      onChange={(e) => update(b.index, { type: e.target.value })}>
                      <option value="line">Line</option>
                      <option value="speed_dial">Speed Dial</option>
                      <option value="blf">BLF</option>
                      <option value="intercom">Intercom</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Label</label>
                    <input className="w-full rounded-md border bg-background p-2 text-sm" value={b.label || ''}
                      onChange={(e) => update(b.index, { label: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium">Target</label>
                    <input className="w-full rounded-md border bg-background p-2 text-sm" value={b.target || ''}
                      onChange={(e) => update(b.index, { target: e.target.value })} placeholder="Directory number, URI or device name" />
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}



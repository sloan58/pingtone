type TabKey = 'device' | 'lines' | 'speed_dials' | 'blfs';

interface PhoneInnerNavProps {
    active: TabKey;
    onChange: (key: TabKey) => void;
}

export function PhoneInnerNav({ active, onChange }: PhoneInnerNavProps) {
    const tabs: { key: TabKey; label: string }[] = [
        { key: 'device', label: 'Device' },
        { key: 'lines', label: 'Lines' },
        { key: 'speed_dials', label: 'Speed Dials' },
        { key: 'blfs', label: 'BLFs' },
    ];
    return (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-1">
            {tabs.map((t) => (
                <button
                    key={t.key}
                    type="button"
                    onClick={() => onChange(t.key)}
                    className={`rounded-md px-3 py-2 text-sm ${active === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}

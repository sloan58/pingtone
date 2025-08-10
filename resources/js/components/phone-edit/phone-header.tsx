interface PhoneHeaderProps {
    name: string;
    model?: string;
    ucmName?: string;
    status?: string;
    onSave?: () => void;
    onRevert?: () => void;
    saving?: boolean;
    canSave?: boolean;
}

export function PhoneHeader({ name, model, ucmName, status, onSave, onRevert, saving, canSave = true }: PhoneHeaderProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div>
                <div className="text-xl font-semibold">{name}</div>
                <div className="text-sm text-muted-foreground">
                    {model || 'Model'} • {ucmName || 'UCM'}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span
                    className={`rounded-full px-2 py-1 text-xs ${status === 'Registered' ? 'bg-green-600/10 text-green-400' : 'bg-muted text-muted-foreground'}`}
                >
                    {status || 'Unknown'}
                </span>
                <button type="button" className="rounded-md border px-3 py-2 text-sm" onClick={onRevert}>
                    Revert
                </button>
                <button
                    type="button"
                    className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    onClick={onSave}
                    disabled={!!saving || !canSave}
                >
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    );
}

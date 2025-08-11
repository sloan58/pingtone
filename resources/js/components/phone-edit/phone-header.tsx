interface PhoneHeaderProps {
    name: string;
    model?: string;
    ucmName?: string;
    status?: string;
    onSave?: () => void;
    saving?: boolean;
    canSave?: boolean;
}

export function PhoneHeader({ name, model, ucmName, status, onSave, saving, canSave = true }: PhoneHeaderProps) {
    return (
        <div className="flex items-center justify-between rounded-lg border bg-card p-4">
            <div>
                <div className="text-xl font-semibold">{name}</div>
                <div className="text-sm text-muted-foreground">
                    {model || 'Model'} • {ucmName || 'UCM'}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
                    onClick={onSave}
                    disabled={!!saving || !canSave}
                >
                    {saving && (
                        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                    )}
                    {saving ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    );
}

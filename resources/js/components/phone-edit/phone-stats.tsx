import { Activity, Clock, Database, Wifi } from 'lucide-react';

interface PhoneStatsProps {
    lastx?: {
        uuid?: string;
        lastactive?: string; // epoch timestamp
        lastseen?: string; // epoch timestamp
        lastknownucm?: string;
        collected_at?: string;
        ucm_id?: string;
    };
}

export function PhoneStats({ lastx }: PhoneStatsProps) {
    if (!lastx) {
        return null;
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Never';
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch {
            return 'Invalid date';
        }
    };

    const getTimeAgo = (epochTimestamp?: string) => {
        if (!epochTimestamp) return null;
        try {
            // Convert epoch timestamp to milliseconds
            const date = new Date(parseInt(epochTimestamp) * 1000);
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'now';
            if (diffMins < 60) return `${diffMins}m`;
            if (diffHours < 24) return `${diffHours}h`;
            if (diffDays < 7) return `${diffDays}d`;
            return date.toLocaleDateString();
        } catch {
            return null;
        }
    };

    const stats = [
        {
            label: 'Active',
            timeAgo: getTimeAgo(lastx.lastactive),
            icon: Activity,
            color: 'text-green-600',
        },
        {
            label: 'Seen',
            timeAgo: getTimeAgo(lastx.lastseen),
            icon: Wifi,
            color: 'text-blue-600',
        },
        {
            label: 'UCM',
            value: lastx.lastknownucm || 'never',
            icon: Database,
            color: 'text-purple-600',
        },
    ];

    return (
        <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Stats:</span>
            </div>
            {stats.map((stat) => {
                const IconComponent = stat.icon;
                return (
                    <div key={stat.label} className="flex items-center gap-1">
                        <IconComponent className={`h-3 w-3 ${stat.color}`} />
                        <span className="text-muted-foreground">{stat.label}:</span>
                        <span className="font-medium">{stat.timeAgo || stat.value || 'never'}</span>
                    </div>
                );
            })}
        </div>
    );
}

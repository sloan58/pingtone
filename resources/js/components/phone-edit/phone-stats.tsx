import { Activity, Clock, Database, Globe, Server, Smartphone, Wifi } from 'lucide-react';

interface PhoneStatsProps {
    lastx?: {
        uuid?: string;
        lastactive?: string; // epoch timestamp
        lastseen?: string; // epoch timestamp
        lastknownucm?: string;
        collected_at?: string;
        ucm_id?: string;
    };
    // Latest RisPort status data
    latestStatus?: {
        device_data?: {
            Status?: string;
            IPAddress?: {
                item?: Array<{ IP?: string }>;
            };
        };
        cm_node?: string;
    };
}

export function PhoneStats({ lastx, latestStatus }: PhoneStatsProps) {
    // If no lastx data, create default structure with "never" values
    const statsData = lastx || {
        lastactive: null,
        lastseen: null,
        lastknownucm: null,
    };

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
        if (!epochTimestamp || epochTimestamp === '0' || parseInt(epochTimestamp) === 0) return null;
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

    // Helper function to get IP address from nested structure
    const getIpAddress = () => {
        if (!latestStatus?.device_data?.IPAddress?.item?.[0]?.IP) {
            return 'None';
        }
        return latestStatus.device_data.IPAddress.item[0].IP;
    };

    // Helper function to get status with color coding
    const getStatusWithColor = (status?: string) => {
        if (!status) return { text: 'None', color: 'text-foreground' };

        switch (status) {
            case 'Registered':
                return { text: 'Registered', color: 'text-green-600' };
            case 'UnRegistered':
                return { text: 'Unregistered', color: 'text-red-600' };
            case 'Rejected':
                return { text: 'Rejected', color: 'text-red-600' };
            case 'PartiallyRegistered':
                return { text: 'Partially Registered', color: 'text-orange-600' };
            case 'Unknown':
                return { text: 'Unknown', color: 'text-foreground' };
            default:
                return { text: 'None', color: 'text-foreground' };
        }
    };

    const lastxStats = [
        {
            label: 'Active',
            timeAgo: getTimeAgo(statsData.lastactive),
            icon: Activity,
            iconColor: 'text-muted-foreground',
        },
        {
            label: 'Seen',
            timeAgo: getTimeAgo(statsData.lastseen),
            icon: Wifi,
            iconColor: 'text-muted-foreground',
        },
        {
            label: 'Last UCM',
            value: statsData.lastknownucm || 'None',
            icon: Database,
            iconColor: 'text-muted-foreground',
        },
    ];

    const risportStats = [
        {
            label: 'Registration',
            value: getStatusWithColor(latestStatus?.device_data?.Status).text,
            icon: Smartphone,
            color: getStatusWithColor(latestStatus?.device_data?.Status).color,
            iconColor: 'text-muted-foreground',
        },
        {
            label: 'IP',
            value: getIpAddress(),
            icon: Globe,
            iconColor: 'text-muted-foreground',
        },
        {
            label: 'Node',
            value: latestStatus?.cm_node || 'None',
            icon: Server,
            iconColor: 'text-muted-foreground',
        },
    ];

    return (
        <div className="flex flex-col gap-2 text-xs">
            {/* RisPort Stats Row */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Smartphone className="h-3 w-3" />
                    <span>Status:</span>
                </div>
                {risportStats.map((stat) => {
                    const IconComponent = stat.icon;
                    const isRegistration = stat.label === 'Registration';
                    return (
                        <div key={stat.label} className="flex items-center gap-1">
                            <IconComponent className={`h-3 w-3 ${stat.iconColor}`} />
                            <span className="text-muted-foreground">{stat.label}:</span>
                            <span className={`font-medium ${isRegistration ? stat.color : 'text-foreground'}`}>{stat.value}</span>
                        </div>
                    );
                })}
            </div>

            {/* LastX Stats Row */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>History:</span>
                </div>
                {lastxStats.map((stat) => {
                    const IconComponent = stat.icon;
                    return (
                        <div key={stat.label} className="flex items-center gap-1">
                            <IconComponent className={`h-3 w-3 ${stat.iconColor}`} />
                            <span className="text-muted-foreground">{stat.label}:</span>
                            <span className="font-medium">{stat.timeAgo || stat.value || 'Never'}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

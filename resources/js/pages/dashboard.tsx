import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Activity, BarChart3, Clock, Phone, Plus, Server, Settings, TrendingUp, Users } from 'lucide-react';

interface DashboardProps {
    stats: {
        total_ucms: number;
        total_users: number;
        synced_today: number;
        currently_syncing: number;
        failed_syncs: number;
    };
    recentActivity: Array<{
        id: number;
        type: string;
        description: string;
        timestamp: string;
        icon: string;
        color: string;
    }>;
    systemHealth: {
        ucm_servers: {
            total: number;
            synced_today: number;
            currently_syncing: number;
            failed_syncs: number;
            health_percentage: number;
        };
    };
    monthlyTrends: {
        ucms: { current: number; previous: number; change_percentage: number };
        users: { current: number; previous: number; change_percentage: number };
    };
}

const getActivityIcon = (icon: string) => {
    const icons: Record<string, any> = {
        phone: Phone,
        'phone-off': Phone,
        link: Activity,
        server: Server,
        plus: Plus,
        'alert-triangle': Activity,
        settings: Settings,
    };
    return icons[icon] || Activity;
};

const getActivityColor = (color: string) => {
    const colors: Record<string, string> = {
        green: 'text-green-500 bg-green-100 dark:bg-green-900',
        blue: 'text-blue-500 bg-blue-100 dark:bg-blue-900',
        orange: 'text-orange-500 bg-orange-100 dark:bg-orange-900',
        red: 'text-red-500 bg-red-100 dark:bg-red-900',
    };
    return colors[color] || 'text-gray-500 bg-gray-100 dark:bg-gray-900';
};

export default function Dashboard({ stats, recentActivity, systemHealth, monthlyTrends }: DashboardProps) {
    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                                <p className="text-muted-foreground">Welcome to PingTone - Your unified communications management platform</p>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Button>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Device
                                </Button>
                            </div>
                        </div>

                        {/* Main Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total UCMs</CardTitle>
                                    <Server className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_ucms}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats.synced_today} synced today, {stats.currently_syncing} syncing
                                    </p>
                                    <div className="mt-2">
                                        <Badge variant={monthlyTrends.ucms.change_percentage >= 0 ? 'default' : 'destructive'}>
                                            <TrendingUp className="mr-1 h-3 w-3" />
                                            {monthlyTrends.ucms.change_percentage >= 0 ? '+' : ''}
                                            {monthlyTrends.ucms.change_percentage}%
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Synced Today</CardTitle>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.synced_today}</div>
                                    <p className="text-xs text-muted-foreground">{stats.failed_syncs} failed syncs</p>
                                    <div className="mt-2">
                                        <Progress value={systemHealth.ucm_servers.health_percentage} className="h-2" />
                                        <p className="mt-1 text-xs text-muted-foreground">{systemHealth.ucm_servers.health_percentage}% healthy</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Currently Syncing</CardTitle>
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.currently_syncing}</div>
                                    <p className="text-xs text-muted-foreground">Active sync operations</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Users</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stats.total_users}</div>
                                    <p className="text-xs text-muted-foreground">Active users in system</p>
                                    <div className="mt-2">
                                        <Badge variant={monthlyTrends.users.change_percentage >= 0 ? 'default' : 'destructive'}>
                                            <TrendingUp className="mr-1 h-3 w-3" />
                                            {monthlyTrends.users.change_percentage >= 0 ? '+' : ''}
                                            {monthlyTrends.users.change_percentage}%
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* System Health and Activity */}
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* System Health */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <BarChart3 className="mr-2 h-5 w-5" />
                                        System Health
                                    </CardTitle>
                                    <CardDescription>Overall system status and health metrics</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Sync Success Rate</span>
                                            <span className="text-sm text-muted-foreground">{systemHealth.ucm_servers.health_percentage}%</span>
                                        </div>
                                        <Progress value={systemHealth.ucm_servers.health_percentage} className="h-2" />
                                        <p className="text-xs text-muted-foreground">
                                            {systemHealth.ucm_servers.synced_today} of {systemHealth.ucm_servers.total} UCMs synced today
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Active Syncs</span>
                                            <span className="text-sm text-muted-foreground">{systemHealth.ucm_servers.currently_syncing}</span>
                                        </div>
                                        <Progress value={systemHealth.ucm_servers.currently_syncing > 0 ? 100 : 0} className="h-2" />
                                        <p className="text-xs text-muted-foreground">
                                            {systemHealth.ucm_servers.currently_syncing} UCMs currently syncing
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Failed Syncs</span>
                                            <span className="text-sm text-muted-foreground">{systemHealth.ucm_servers.failed_syncs}</span>
                                        </div>
                                        <Progress value={systemHealth.ucm_servers.failed_syncs > 0 ? 100 : 0} className="h-2" />
                                        <p className="text-xs text-muted-foreground">
                                            {systemHealth.ucm_servers.failed_syncs} failed sync operations
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Recent Activity */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Activity className="mr-2 h-5 w-5" />
                                        Recent Activity
                                    </CardTitle>
                                    <CardDescription>Latest system events and changes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {recentActivity.map((activity) => {
                                            const IconComponent = getActivityIcon(activity.icon);
                                            return (
                                                <div key={activity.id} className="flex items-start space-x-3">
                                                    <div className={`rounded-full p-2 ${getActivityColor(activity.color)}`}>
                                                        <IconComponent className="h-4 w-4" />
                                                    </div>
                                                    <div className="flex-1 space-y-1">
                                                        <p className="text-sm leading-none font-medium">{activity.description}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            <Clock className="mr-1 inline h-3 w-3" />
                                                            {new Date(activity.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid gap-6 md:grid-cols-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Settings className="mr-2 h-5 w-5" />
                                        Quick Actions
                                    </CardTitle>
                                    <CardDescription>Common tasks and shortcuts</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button variant="outline" className="h-20 flex-col">
                                            <Server className="mb-2 h-5 w-5" />
                                            <span className="text-sm">Add UCM</span>
                                        </Button>
                                        <Button variant="outline" className="h-20 flex-col">
                                            <Users className="mb-2 h-5 w-5" />
                                            <span className="text-sm">Add User</span>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
        </AppLayout>
    );
}

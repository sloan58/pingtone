import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useState } from 'react';
import { RefreshCw, Wifi, Settings } from 'lucide-react';

interface PhoneApiDataProps {
    phoneId: string;
    apiData?: {
        network?: any;
        config?: any;
        timestamp?: string;
        ip_address?: string;
    };
}

export function PhoneApiData({ phoneId, apiData }: PhoneApiDataProps) {
    const [isLoading, setIsLoading] = useState(false);

    const gatherApiData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/phones/${phoneId}/gather-api-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Phone API data gathered successfully', {
                    description: `Network: ${result.data.has_network_data ? '✓' : '✗'}, Config: ${result.data.has_config_data ? '✓' : '✗'}`,
                });
                // Reload the page to show updated data
                window.location.reload();
            } else {
                toast.error('Failed to gather phone API data', {
                    description: result.error,
                });
            }
        } catch (error) {
            toast.error('Error gathering phone API data', {
                description: error instanceof Error ? error.message : 'Unknown error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const formatJson = (data: any) => {
        if (!data) return null;
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return String(data);
        }
    };

    const hasData = apiData && (apiData.network || apiData.config);
    const lastGathered = apiData?.timestamp ? new Date(apiData.timestamp).toLocaleString() : null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Phone API Data</h3>
                    <p className="text-sm text-muted-foreground">
                        Device information and network configuration from phone APIs
                    </p>
                </div>
                <Button
                    onClick={gatherApiData}
                    disabled={isLoading}
                    size="sm"
                    variant="outline"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Gathering...' : 'Gather Data'}
                </Button>
            </div>

            {apiData?.ip_address && (
                <div className="text-sm text-muted-foreground">
                    IP Address: {apiData.ip_address}
                </div>
            )}

            {lastGathered && (
                <div className="text-sm text-muted-foreground">
                    Last gathered: {lastGathered}
                </div>
            )}

            {!hasData && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <Wifi className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No API Data Available</h3>
                    <p className="text-muted-foreground mb-4">
                        Click "Gather Data" to retrieve device information and network configuration from this phone.
                    </p>
                    <Button onClick={gatherApiData} disabled={isLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        {isLoading ? 'Gathering...' : 'Gather Data'}
                    </Button>
                </div>
            )}

            {hasData && (
                <Tabs defaultValue="network" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="network" className="flex items-center gap-2">
                            <Wifi className="h-4 w-4" />
                            Network Configuration
                        </TabsTrigger>
                        <TabsTrigger value="config" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Device Information
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="network" className="mt-4">
                        <div className="rounded-lg border bg-card">
                            <div className="border-b p-4">
                                <h4 className="font-semibold">Network Configuration</h4>
                                <p className="text-sm text-muted-foreground">
                                    Network settings and configuration from the phone
                                </p>
                            </div>
                            <div className="p-4">
                                {apiData?.network ? (
                                    <pre className="text-sm bg-muted p-4 rounded-md overflow-auto max-h-96">
                                        {formatJson(apiData.network)}
                                    </pre>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Wifi className="mx-auto h-8 w-8 mb-2" />
                                        <p>No network configuration data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="config" className="mt-4">
                        <div className="rounded-lg border bg-card">
                            <div className="border-b p-4">
                                <h4 className="font-semibold">Device Information</h4>
                                <p className="text-sm text-muted-foreground">
                                    Device details and configuration information
                                </p>
                            </div>
                            <div className="p-4">
                                {apiData?.config ? (
                                    <pre className="text-sm bg-muted p-4 rounded-md overflow-auto max-h-96">
                                        {formatJson(apiData.config)}
                                    </pre>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Settings className="mx-auto h-8 w-8 mb-2" />
                                        <p>No device information data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

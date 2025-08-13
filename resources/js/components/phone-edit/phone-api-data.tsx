import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Settings, Wifi } from 'lucide-react';
import { useState } from 'react';

interface PhoneApiDataProps {
    phoneId: string;
    apiData?: {
        network?: any;
        config?: any;
        timestamp?: string;
        ip_address?: string;
    };
    onDataUpdate?: (newData: any) => void;
}

export function PhoneApiData({ phoneId, apiData, onDataUpdate }: PhoneApiDataProps) {
    const [isLoading, setIsLoading] = useState(false);

    const gatherApiData = async () => {
        if (!isLoading) {
            setIsLoading(true);
            try {
                const response = await fetch(`/phones/${phoneId}/gather-api-data`);

                const responseData = await response.json();

                if (responseData.success) {
                    // Update the parent component with new data
                    if (onDataUpdate) {
                        onDataUpdate(responseData.data);
                    }
                } else {
                    console.error('Failed to gather phone API data:', responseData.error);
                }
            } catch (error) {
                console.error('Failed to gather phone API data:', error);
            } finally {
                setIsLoading(false);
            }
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
                    <p className="text-sm text-muted-foreground">Device information and network configuration from phone APIs</p>
                </div>
                <Button onClick={gatherApiData} disabled={isLoading} size="sm" variant="outline">
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? 'Gathering...' : 'Gather Data'}
                </Button>
            </div>

            {apiData?.ip_address && <div className="text-sm text-muted-foreground">IP Address: {apiData.ip_address}</div>}

            {lastGathered && <div className="text-sm text-muted-foreground">Last gathered: {lastGathered}</div>}

            {!hasData && (
                <div className="rounded-lg border border-dashed p-8 text-center">
                    <Wifi className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="mb-2 text-lg font-semibold">No API Data Available</h3>
                    <p className="mb-4 text-muted-foreground">
                        Click "Gather Data" to retrieve device information and network configuration from this phone.
                    </p>
                    <Button onClick={gatherApiData} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                                <p className="text-sm text-muted-foreground">Network settings and configuration from the phone</p>
                            </div>
                            <div className="p-4">
                                {apiData?.network ? (
                                    <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">{formatJson(apiData.network)}</pre>
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Wifi className="mx-auto mb-2 h-8 w-8" />
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
                                <p className="text-sm text-muted-foreground">Device details and configuration information</p>
                            </div>
                            <div className="p-4">
                                {apiData?.config ? (
                                    <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-sm">{formatJson(apiData.config)}</pre>
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Settings className="mx-auto mb-2 h-8 w-8" />
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

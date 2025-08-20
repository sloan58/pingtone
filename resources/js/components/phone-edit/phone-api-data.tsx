import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { XmlDisplay } from '@/components/xml-display';
import axios from 'axios';
import { FileText, Network, RefreshCw, Settings, Wifi } from 'lucide-react';
import { useState } from 'react';

interface PhoneApiDataProps {
    phoneId: string;
    apiData?: {
        network?: any;
        config?: any;
        port?: any;
        log?: any;
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
                const response = await axios.get(`/phones/${phoneId}/gather-api-data`);

                if (response.data.success) {
                    // Update the parent component with new data
                    if (onDataUpdate) {
                        onDataUpdate(response.data.data);
                    }
                } else {
                    console.error('Failed to gather phone API data:', response.data.error);
                }
            } catch (error) {
                console.error('Failed to gather phone API data:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const hasData = apiData && (apiData.network || apiData.config || apiData.port || apiData.log);
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
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="network" className="flex items-center gap-2">
                            <Wifi className="h-4 w-4" />
                            Network
                        </TabsTrigger>
                        <TabsTrigger value="config" className="flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Device Info
                        </TabsTrigger>
                        <TabsTrigger value="port" className="flex items-center gap-2">
                            <Network className="h-4 w-4" />
                            Port Info
                        </TabsTrigger>
                        <TabsTrigger value="log" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Device Log
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="network" className="mt-4">
                        <div className="rounded-lg border bg-card">
                            <div className="border-b p-4">
                                <h4 className="font-semibold">Network Configuration</h4>
                                <p className="text-sm text-muted-foreground">Network settings and configuration from the phone</p>
                            </div>
                            <div className="p-4">
                                {apiData?.network?.raw_xml ? (
                                    <XmlDisplay xml={apiData.network.raw_xml} />
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
                                {apiData?.config?.raw_xml ? (
                                    <XmlDisplay xml={apiData.config.raw_xml} />
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Settings className="mx-auto mb-2 h-8 w-8" />
                                        <p>No device information data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="port" className="mt-4">
                        <div className="rounded-lg border bg-card">
                            <div className="border-b p-4">
                                <h4 className="font-semibold">Port Information</h4>
                                <p className="text-sm text-muted-foreground">Port details and status information</p>
                            </div>
                            <div className="p-4">
                                {apiData?.port?.raw_xml ? (
                                    <XmlDisplay xml={apiData.port.raw_xml} />
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <Network className="mx-auto mb-2 h-8 w-8" />
                                        <p>No port information data available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="log" className="mt-4">
                        <div className="rounded-lg border bg-card">
                            <div className="border-b p-4">
                                <h4 className="font-semibold">Device Log</h4>
                                <p className="text-sm text-muted-foreground">Device log entries and system information</p>
                            </div>
                            <div className="p-4">
                                {apiData?.log?.raw_xml ? (
                                    <XmlDisplay xml={apiData.log.raw_xml} />
                                ) : (
                                    <div className="py-8 text-center text-muted-foreground">
                                        <FileText className="mx-auto mb-2 h-8 w-8" />
                                        <p>No device log data available</p>
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

import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Database, FileText, Hash, Type } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface DataDictionaryTable {
    name: string;
    table_id?: string;
    description?: string;
    field_count: number;
    row_count?: number;
    size_mb?: number;
    uniqueness_constraints?: string[];
}

interface DataDictionaryField {
    name: string;
    field_id?: string;
    data_type: string;
    properties?: string[];
    default_value?: string;
    migration_source?: string;
    remarks?: string;
    description?: string;
    rules?: string[];
}

interface Props {
    ucmId: number;
    version: string;
    clusterName: string;
}

export default function DataDictionaryIndex({ ucmId, version, clusterName }: Props) {
    const [tables, setTables] = useState<DataDictionaryTable[]>([]);
    const [selectedTable, setSelectedTable] = useState<DataDictionaryTable | null>(null);
    const [fields, setFields] = useState<DataDictionaryField[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [useRegex, setUseRegex] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingFields, setLoadingFields] = useState(false);

    const filteredTables = tables.filter(table => {
        if (!searchTerm) return true;
        
        if (useRegex) {
            try {
                const regex = new RegExp(searchTerm, 'i');
                return regex.test(table.name) || (table.description && regex.test(table.description));
            } catch {
                return false;
            }
        }
        
        const term = searchTerm.toLowerCase();
        return table.name.toLowerCase().includes(term) || 
               (table.description && table.description.toLowerCase().includes(term));
    });

    useEffect(() => {
        loadTables();
    }, [ucmId, version]);

    const loadTables = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/ucm-clusters/${ucmId}/data-dictionary/api?version=${version}`);
            const data = await response.json();
            setTables(data.tables || []);
        } catch (error) {
            console.error('Failed to load tables:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTableDetails = async (table: DataDictionaryTable) => {
        try {
            setLoadingFields(true);
            setSelectedTable(table);
            const response = await fetch(`/ucm-clusters/${ucmId}/data-dictionary/tables/${table.name}?version=${version}`);
            const data = await response.json();
            setFields(data.fields || []);
        } catch (error) {
            console.error('Failed to load table details:', error);
            setFields([]);
        } finally {
            setLoadingFields(false);
        }
    };

    return (
        <AppLayout>
            <Head title={`Data Dictionary - ${clusterName}`} />
            
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/ucm-clusters/${ucmId}`}>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Cluster
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">UCM Database Schema Reference</h1>
                            <p className="text-muted-foreground">
                                Explore database schema for {clusterName} (UCM {version})
                            </p>
                        </div>
                    </div>
                </div>

                    <div className="grid grid-cols-12 gap-6">
                        {/* Tables List - Left Side */}
                        <div className="col-span-5">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Database className="h-5 w-5" />
                                        Tables ({filteredTables.length})
                                    </CardTitle>
                                    
                                    {/* Search */}
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Search tables..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="regex-mode"
                                                checked={useRegex}
                                                onCheckedChange={setUseRegex}
                                            />
                                            <label htmlFor="regex-mode" className="text-sm font-medium">
                                                Regex
                                            </label>
                                        </div>
                                    </div>
                                </CardHeader>
                                
                                <CardContent>
                                    {loading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <div className="text-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                                <span className="text-sm text-muted-foreground">Loading tables...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                                            {filteredTables.map((table) => (
                                                <div
                                                    key={table.name}
                                                    className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-accent ${
                                                        selectedTable?.name === table.name ? 'bg-accent border-primary' : 'bg-card'
                                                    }`}
                                                    onClick={() => loadTableDetails(table)}
                                                >
                                                    <div className="space-y-1">
                                                        <div className="font-mono font-medium text-sm">{table.name}</div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <span>{table.field_count} fields</span>
                                                            {table.table_id && <span>• {table.table_id}</span>}
                                                            {table.row_count && <span>• {table.row_count.toLocaleString()} rows</span>}
                                                        </div>
                                                        {table.description && (
                                                            <div className="text-xs text-muted-foreground line-clamp-2">
                                                                {table.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Table Details - Right Side */}
                        <div className="col-span-7">
                            {selectedTable ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            {selectedTable.name}
                                        </CardTitle>
                                        
                                        {selectedTable.description && (
                                            <p className="text-sm text-muted-foreground">{selectedTable.description}</p>
                                        )}
                                        
                                        <div className="flex items-center gap-4 text-sm">
                                            <div className="flex items-center gap-1">
                                                <Hash className="h-4 w-4" />
                                                <span>{selectedTable.field_count} fields</span>
                                            </div>
                                            {selectedTable.table_id && (
                                                <Badge variant="secondary">{selectedTable.table_id}</Badge>
                                            )}
                                            {selectedTable.row_count && (
                                                <div className="flex items-center gap-1">
                                                    <Database className="h-4 w-4" />
                                                    <span>{selectedTable.row_count.toLocaleString()} rows</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardHeader>
                                    
                                    <CardContent>
                                        {loadingFields ? (
                                            <div className="flex items-center justify-center py-8">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                                    <span className="text-sm text-muted-foreground">Loading fields...</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <h3 className="font-semibold flex items-center gap-2">
                                                    <Type className="h-4 w-4" />
                                                    Fields ({fields.length})
                                                </h3>
                                                
                                                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                                    {fields.map((field, index) => (
                                                        <div key={`${field.name}-${index}`} className="border rounded-lg p-3 bg-muted/30">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-mono font-medium">{field.name}</span>
                                                                    <Badge variant="outline">{field.data_type}</Badge>
                                                                </div>
                                                                
                                                                {field.description && (
                                                                    <p className="text-sm text-muted-foreground">{field.description}</p>
                                                                )}
                                                                
                                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                                    {field.field_id && (
                                                                        <div>
                                                                            <span className="font-medium">Field ID:</span> {field.field_id}
                                                                        </div>
                                                                    )}
                                                                    {field.default_value && (
                                                                        <div>
                                                                            <span className="font-medium">Default:</span> {field.default_value}
                                                                        </div>
                                                                    )}
                                                                    {field.migration_source && (
                                                                        <div>
                                                                            <span className="font-medium">Migration:</span> {field.migration_source}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                {field.properties && field.properties.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {field.properties.map((prop, i) => (
                                                                            <Badge key={i} variant="secondary" className="text-xs">
                                                                                {prop}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                                
                                                                {field.remarks && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        <span className="font-medium">Remarks:</span> {field.remarks}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-12">
                                        <div className="text-center">
                                            <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold mb-2">Select a Table</h3>
                                            <p className="text-muted-foreground">
                                                Choose a table from the list to view its fields and details.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                </div>
            </div>
        </AppLayout>
    );
}

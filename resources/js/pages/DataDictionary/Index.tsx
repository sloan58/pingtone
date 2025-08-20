import React, { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Search, Database, FileText, Hash, Type, Key, Info, ChevronRight, Table2, Rows3 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
                            <Link href={`/ucm-clusters/${ucmId}#sql-queries`}>
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

                                    {/* Search Bar */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search tables and fields..."
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
                            <Badge variant="outline" className="flex items-center gap-1">
                                <Table2 className="h-3 w-3" />
                                {filteredTables.length} tables
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {loading ? (
                    <Card>
                        <CardContent className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                <span className="text-sm text-muted-foreground">Loading database schema...</span>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredTables.map((table) => (
                            <Card key={table.name} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                                <Database className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg font-mono">{table.name}</CardTitle>
                                                {table.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">{table.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => loadTableDetails(table)}
                                            className="flex items-center gap-2"
                                        >
                                            View Details
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                
                                <CardContent className="pt-0">
                                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Hash className="h-4 w-4" />
                                            <span>{table.field_count} fields</span>
                                        </div>
                                        
                                        {table.table_id && (
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" />
                                                <span>{table.table_id}</span>
                                            </div>
                                        )}
                                        
                                        {table.row_count && (
                                            <div className="flex items-center gap-1">
                                                <Rows3 className="h-4 w-4" />
                                                <span>{table.row_count.toLocaleString()} rows</span>
                                            </div>
                                        )}
                                        
                                        {table.size_mb && (
                                            <div className="flex items-center gap-1">
                                                <Database className="h-4 w-4" />
                                                <span>{table.size_mb.toFixed(2)} MB</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Debug: Always show constraints section for testing */}
                                    {(table.uniqueness_constraints && table.uniqueness_constraints.length > 0) || table.name === 'aarneighborhood' ? (
                                        <div className="mt-3 pt-3 border-t">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Key className="h-4 w-4 text-amber-600" />
                                                <span className="text-sm font-medium text-amber-700">
                                                    Uniqueness Constraints 
                                                    {table.name === 'aarneighborhood' && (
                                                        <span className="text-xs text-red-600 ml-2">
                                                            (Debug: {JSON.stringify(table.uniqueness_constraints)})
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {table.uniqueness_constraints && table.uniqueness_constraints.length > 0 ? (
                                                    table.uniqueness_constraints.map((constraint, i) => (
                                                        <Badge key={i} variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-800">
                                                            {constraint}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-xs text-red-600">No constraints found in frontend data</span>
                                                )}
                                            </div>
                                        </div>
                                    ) : null}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Table Details Modal/Overlay */}
                {selectedTable && (
                    <Card className="mt-6 border-2 border-primary/20">
                        <CardHeader className="bg-primary/5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Table: {selectedTable.name}
                                </CardTitle>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedTable(null)}>
                                    Close
                                </Button>
                            </div>
                            
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
                                        <Rows3 className="h-4 w-4" />
                                        <span>{selectedTable.row_count.toLocaleString()} rows</span>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        
                        <CardContent className="pt-6">
                            {loadingFields ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                        <span className="text-sm text-muted-foreground">Loading field details...</span>
                                    </div>
                                </div>
                            ) : (
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-3">
                                        {fields.map((field, index) => (
                                            <div key={`${field.name}-${index}`} className="border rounded-lg p-4 bg-muted/30">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <Type className="h-4 w-4 text-blue-600" />
                                                        <span className="font-mono font-medium">{field.name}</span>
                                                    </div>
                                                    <Badge variant="outline">{field.data_type}</Badge>
                                                </div>
                                                
                                                {field.description && (
                                                    <p className="text-sm text-muted-foreground mb-3">{field.description}</p>
                                                )}
                                                
                                                <div className="grid grid-cols-3 gap-4 text-xs">
                                                    {field.field_id && (
                                                        <div>
                                                            <span className="font-medium text-muted-foreground">Field ID:</span>
                                                            <div className="mt-1">{field.field_id}</div>
                                                        </div>
                                                    )}
                                                    {field.default_value && (
                                                        <div>
                                                            <span className="font-medium text-muted-foreground">Default:</span>
                                                            <div className="mt-1 font-mono">{field.default_value}</div>
                                                        </div>
                                                    )}
                                                    {field.migration_source && (
                                                        <div>
                                                            <span className="font-medium text-muted-foreground">Migration:</span>
                                                            <div className="mt-1">{field.migration_source}</div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {field.properties && field.properties.length > 0 && (
                                                    <div className="mt-3">
                                                        <span className="text-xs font-medium text-muted-foreground">Properties:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {field.properties.map((prop, i) => (
                                                                <Badge key={i} variant="secondary" className="text-xs">
                                                                    {prop}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                
                                                {field.remarks && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <div className="flex items-start gap-2">
                                                            <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <span className="text-xs font-medium text-muted-foreground">Remarks:</span>
                                                                <p className="text-xs text-muted-foreground mt-1">{field.remarks}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

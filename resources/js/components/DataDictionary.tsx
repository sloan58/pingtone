import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import axios from 'axios';
import { ArrowLeft, ChevronDown, ChevronRight, Database, Loader2, Search, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface DataDictionaryField {
    name: string;
    field_id?: string;
    data_type: string;
    properties: string[];
    default_value?: string;
    migration_source?: string;
    remarks?: string;
    description?: string;
    rules: Array<{
        rule_id: string;
        rule_type: string;
        rule_name: string;
        description: string;
        test_condition: string;
    }>;
    is_nullable: boolean;
    is_indexed: boolean;
    is_unique: boolean;
}

interface DataDictionaryTable {
    name: string;
    table_id?: string;
    description?: string;
    uniqueness_constraints: string[];
    row_count?: number;
    size_mb?: number;
    field_count: number;
}

interface DataDictionaryProps {
    ucmId: number;
    version: string;
}

const DataDictionary: React.FC<DataDictionaryProps> = ({ ucmId, version }) => {
    const [tables, setTables] = useState<DataDictionaryTable[]>([]);
    const [selectedTable, setSelectedTable] = useState<DataDictionaryTable | null>(null);
    const [fields, setFields] = useState<DataDictionaryField[]>([]);
    const [loading, setLoading] = useState(false);
    const [fieldsLoading, setFieldsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [useRegex, setUseRegex] = useState(false);
    const [fieldSearchTerm, setFieldSearchTerm] = useState('');
    const [fieldUseRegex, setFieldUseRegex] = useState(false);
    const [fieldsCollapsed, setFieldsCollapsed] = useState(true);

    // Load tables on component mount
    useEffect(() => {
        loadTables();
    }, [ucmId]);

    const loadTables = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`/ucm-clusters/${ucmId}/data-dictionary`, {
                params: {
                    search: searchTerm,
                    use_regex: useRegex,
                },
            });

            setTables(response.data.tables);
        } catch (error) {
            console.error('Failed to load data dictionary:', error);
            const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error || error.message : 'Failed to load data dictionary';

            toast.error('Error', {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const loadTableDetails = async (table: DataDictionaryTable) => {
        setSelectedTable(table);
        setFieldsLoading(true);
        setFieldsCollapsed(true);

        try {
            const response = await axios.get(`/ucm-clusters/${ucmId}/data-dictionary/tables/${table.name}`, {
                params: {
                    field_search: fieldSearchTerm,
                    field_use_regex: fieldUseRegex,
                },
            });

            setFields(response.data.fields);
        } catch (error) {
            console.error('Failed to load table details:', error);
            const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error || error.message : 'Failed to load table details';

            toast.error('Error', {
                description: errorMessage,
            });
        } finally {
            setFieldsLoading(false);
        }
    };

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (!selectedTable) {
                loadTables();
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, useRegex]);

    // Debounced field search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (selectedTable) {
                loadTableDetails(selectedTable);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [fieldSearchTerm, fieldUseRegex]);

    const handleBackToTables = () => {
        setSelectedTable(null);
        setFields([]);
        setFieldSearchTerm('');
    };

    const getConstraintTypeColor = (type: string) => {
        switch (type) {
            case 'PK':
                return 'bg-green-100 text-green-800';
            case 'F':
                return 'bg-blue-100 text-blue-800';
            case 'UQ':
                return 'bg-purple-100 text-purple-800';
            case 'C':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    // If a table is selected, show detailed view
    if (selectedTable) {
        const filteredFields = fields.filter((field) => {
            if (!fieldSearchTerm) return true;

            if (fieldUseRegex) {
                try {
                    const regex = new RegExp(fieldSearchTerm, 'i');
                    return (
                        regex.test(field.name) ||
                        regex.test(field.data_type) ||
                        (field.remarks && regex.test(field.remarks)) ||
                        (field.description && regex.test(field.description))
                    );
                } catch (error) {
                    // If regex is invalid, fall back to simple text search
                    return (
                        field.name.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                        field.data_type.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                        (field.remarks && field.remarks.toLowerCase().includes(fieldSearchTerm.toLowerCase())) ||
                        (field.description && field.description.toLowerCase().includes(fieldSearchTerm.toLowerCase()))
                    );
                }
            } else {
                return (
                    field.name.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                    field.data_type.toLowerCase().includes(fieldSearchTerm.toLowerCase()) ||
                    (field.remarks && field.remarks.toLowerCase().includes(fieldSearchTerm.toLowerCase())) ||
                    (field.description && field.description.toLowerCase().includes(fieldSearchTerm.toLowerCase()))
                );
            }
        });

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-3">
                        <Button variant="outline" size="sm" onClick={handleBackToTables} className="flex w-fit items-center space-x-2">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Tables</span>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{selectedTable.name}</h1>
                            <p className="text-muted-foreground">Table Details</p>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6">
                    {/* Table Description */}
                    {selectedTable.description && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Description</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{selectedTable.description}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Fields */}
                    <Card>
                        <CardHeader
                            className="cursor-pointer transition-colors hover:bg-muted/50"
                            onClick={() => setFieldsCollapsed(!fieldsCollapsed)}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">Fields</CardTitle>
                                    <p className="text-sm text-muted-foreground">Detailed field information from the data dictionary</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm text-muted-foreground">{fieldsCollapsed ? 'Click to expand' : 'Click to collapse'}</span>
                                    {fieldsCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </div>
                            </div>
                        </CardHeader>
                        {!fieldsCollapsed && (
                            <CardContent>
                                {/* Field Search Form */}
                                <div className="mt-2 mb-6">
                                    <div className="flex max-w-md items-center space-x-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                                            <Input
                                                placeholder="Search fields..."
                                                value={fieldSearchTerm}
                                                onChange={(e) => setFieldSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <span className="text-sm font-medium text-muted-foreground">{filteredFields.length} fields</span>
                                    </div>
                                    <div className="mt-2 flex items-center space-x-2">
                                        <Zap className="h-3 w-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">Regex</span>
                                        <Switch checked={fieldUseRegex} onCheckedChange={setFieldUseRegex} className="scale-75" />
                                    </div>
                                </div>

                                {fieldsLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                        <span className="ml-2">Loading fields...</span>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredFields.map((field) => (
                                            <div key={field.name} className="rounded-lg border p-4">
                                                <div className="mb-3 flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-mono text-lg font-medium">{field.name}</span>
                                                        {field.field_id && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {field.field_id}
                                                            </Badge>
                                                        )}
                                                        {field.is_unique && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Unique
                                                            </Badge>
                                                        )}
                                                        {field.is_indexed && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Indexed
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium">{field.data_type}</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-3 text-sm">
                                                    <div>
                                                        <span className="font-medium text-muted-foreground">Type:</span>{' '}
                                                        <span className="font-mono">{field.data_type}</span>
                                                        {!field.is_nullable && (
                                                            <Badge variant="destructive" className="ml-2 text-xs">
                                                                NOT NULL
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    {field.default_value && (
                                                        <div>
                                                            <span className="font-medium text-muted-foreground">Default:</span>{' '}
                                                            <span className="font-mono">{field.default_value}</span>
                                                        </div>
                                                    )}

                                                    {field.remarks && (
                                                        <div>
                                                            <span className="font-medium text-muted-foreground">Remarks:</span>{' '}
                                                            <span className="text-muted-foreground">{field.remarks}</span>
                                                        </div>
                                                    )}

                                                    {field.properties && field.properties.length > 0 && (
                                                        <div>
                                                            <span className="font-medium text-muted-foreground">Properties:</span>
                                                            <div className="mt-1 flex flex-wrap gap-1">
                                                                {field.properties.map((prop, index) => (
                                                                    <Badge key={index} variant="outline" className="text-xs">
                                                                        {prop}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Rules */}
                                                {field.rules && field.rules.length > 0 && (
                                                    <div className="mt-3 space-y-2">
                                                        <div className="text-sm font-medium">Rules:</div>
                                                        {field.rules.map((rule, index) => (
                                                            <div key={index} className="space-y-1 rounded border bg-muted/50 p-3 text-xs">
                                                                <div>
                                                                    <span className="font-medium">Type:</span> {rule.rule_type}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Rule Name:</span> {rule.rule_name}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Description:</span> {rule.description}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Test Condition:</span> {rule.test_condition}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        )}
                    </Card>

                    {/* Uniqueness Constraints */}
                    {selectedTable.uniqueness_constraints && selectedTable.uniqueness_constraints.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Uniqueness Constraints</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {selectedTable.uniqueness_constraints.map((constraint, index) => (
                                        <div key={index} className="rounded bg-muted/50 p-2 text-sm text-muted-foreground">
                                            {constraint}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        );
    }

    // Main table list view
    const filteredTables = tables.filter((table) => {
        if (!searchTerm) return true;

        if (useRegex) {
            try {
                const regex = new RegExp(searchTerm, 'i');
                return regex.test(table.name) || (table.description && regex.test(table.description));
            } catch (error) {
                // If regex is invalid, fall back to simple text search
                return (
                    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (table.description && table.description.toLowerCase().includes(searchTerm.toLowerCase()))
                );
            }
        } else {
            return (
                table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (table.description && table.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Data Dictionary</h1>
                    <p className="text-muted-foreground">Explore database schema, tables, columns, and constraints for UCM {version}</p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={useRegex ? 'Search with regex...' : 'Search tables...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-md"
                        />
                        <Badge variant="secondary">{filteredTables.length} tables</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                            <Zap className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Regex</span>
                            <Switch checked={useRegex} onCheckedChange={setUseRegex} className="scale-75" />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading data dictionary...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredTables.map((table) => (
                            <Card
                                key={table.name}
                                className="cursor-pointer transition-shadow hover:shadow-md"
                                onClick={() => loadTableDetails(table)}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-mono font-medium">{table.name}</span>
                                                <Badge variant="outline" className="text-xs">{table.field_count} fields</Badge>
                                                {table.table_id && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {table.table_id}
                                                    </Badge>
                                                )}
                                            </div>
                                            {table.description && (
                                                <div className="text-sm text-muted-foreground">{table.description}</div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {!loading && filteredTables.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Database className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">No Tables Found</h3>
                            <p className="mb-4 text-center text-muted-foreground">
                                {searchTerm
                                    ? `No tables match your search "${searchTerm}"`
                                    : 'No data dictionary tables available for this UCM version'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default DataDictionary;

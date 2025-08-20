import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { ChevronDown, ChevronRight, Loader2, Play, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import { toast } from 'sonner';
import QueryEditor from './QueryEditor';
import ResultsTable from './ResultsTable';

interface SqlQueryInterfaceProps {
    ucmId: number;
}

interface QueryResults {
    rows: Record<string, any>[];
    columns: Array<{
        data_field: string;
        text: string;
        sort?: boolean;
        filter?: boolean;
    }>;
}

const SqlQueryInterface: React.FC<SqlQueryInterfaceProps> = ({ ucmId }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<QueryResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [showSamples, setShowSamples] = useState(false);
    useToast(); // For handling server flash messages

    const handleExecuteQuery = async () => {
        if (!query.trim()) {
            toast.error('Error', {
                description: 'Please enter a SQL query',
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`/ucm-clusters/${ucmId}/sql-query`, {
                query: query.trim(),
            });

            const data = response.data;
            setResults(data);

            toast.success('Success', {
                description: `Query executed successfully. ${data.rows.length} rows returned.`,
            });
        } catch (error) {
            console.error('Query execution error:', error);
            const errorMessage = axios.isAxiosError(error)
                ? error.response?.data?.message || error.message
                : error instanceof Error
                  ? error.message
                  : 'An unexpected error occurred';

            toast.error('Query Error', {
                description: errorMessage,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleClearQuery = () => {
        setQuery('');
        setResults(null);
    };

    const handleExportResults = () => {
        if (!results || !results.rows.length) {
            toast.error('No Data', {
                description: 'No results to export',
            });
            return;
        }

        // Convert results to CSV
        const headers = results.columns.map((col) => col.text);
        const csvContent = [
            headers.join(','),
            ...results.rows.map((row) =>
                results.columns
                    .map((col) => {
                        const value = row[col.data_field];
                        // Escape commas and quotes in CSV
                        const stringValue = value !== null && value !== undefined ? String(value) : '';
                        return stringValue.includes(',') || stringValue.includes('"') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
                    })
                    .join(','),
            ),
        ].join('\n');

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `ucm_query_results_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success('Export Complete', {
            description: 'Results exported to CSV file',
        });
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>SQL Query Interface</CardTitle>
                    <CardDescription>
                        Execute SQL queries directly against the UCM database using the AXL executeSQLQuery method. Use standard SQL syntax to query
                        UCM tables.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <QueryEditor value={query} onChange={setQuery} placeholder="SELECT * FROM device WHERE name LIKE 'SEP%' LIMIT 10" />

                        <div className="flex space-x-2">
                            <Button onClick={handleExecuteQuery} disabled={loading || !query.trim()} className="flex items-center space-x-2">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                <span>{loading ? 'Executing...' : 'Execute Query'}</span>
                            </Button>

                            <Button variant="outline" onClick={handleClearQuery} className="flex items-center space-x-2">
                                <Trash2 className="h-4 w-4" />
                                <span>Clear</span>
                            </Button>
                        </div>
                    </div>

                    {/* Sample Queries */}
                    <div className="mt-6">
                        <button
                            onClick={() => setShowSamples(!showSamples)}
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {showSamples ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            Sample Queries
                        </button>

                        {showSamples && (
                            <div className="mt-3 grid gap-2 text-sm">
                                <div className="rounded-md bg-muted p-3">
                                    <div className="mb-1 font-medium text-muted-foreground">List all phones:</div>
                                    <code className="text-xs">SELECT name, description FROM device WHERE tkclass = 1 LIMIT 10</code>
                                </div>
                                <div className="rounded-md bg-muted p-3">
                                    <div className="mb-1 font-medium text-muted-foreground">Find users by department:</div>
                                    <code className="text-xs">
                                        SELECT userid, firstname, lastname, department FROM enduser WHERE department IS NOT NULL LIMIT 10
                                    </code>
                                </div>
                                <div className="rounded-md bg-muted p-3">
                                    <div className="mb-1 font-medium text-muted-foreground">Show device pools:</div>
                                    <code className="text-xs">SELECT name, dateformat, timeformat FROM devicepool</code>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {results && <ResultsTable results={results} onExport={handleExportResults} />}
        </div>
    );
};

export default SqlQueryInterface;

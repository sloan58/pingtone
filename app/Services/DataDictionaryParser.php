<?php

namespace App\Services;

use App\Models\DataDictionaryField;
use App\Models\DataDictionaryTable;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class DataDictionaryParser
{
    /**
     * Parse HTML data dictionary file for a specific UCM version.
     * @throws Exception
     */
    public function parseVersion(string $version): array
    {
        $htmlPath = $this->getHtmlPath($version);

        if (!Storage::drive('ucm-data-dictionary')->exists($htmlPath)) {
            throw new Exception("Data dictionary file not found for version {$version} at {$htmlPath}");
        }

        $htmlContent = Storage::drive('ucm-data-dictionary')->get($htmlPath);

        Log::info("Parsing data dictionary for UCM version {$version}", [
            'file_size' => strlen($htmlContent),
            'file_path' => $htmlPath,
        ]);

        return $this->parseHtmlContent($htmlContent, $version);
    }

    /**
     * Get the storage path for the HTML file based on version.
     * @throws Exception
     */
    private function getHtmlPath(string $version): string
    {
        return match ($version) {
            '11.5' => '11_5/datadictionary.html',
            '12.0' => '12_0/datadictionary.html',
            '12.5' => '12_5/datadictionary.html',
            '15.0' => '15/datadictionary.html',
            default => throw new Exception("Unsupported UCM version: {$version}"),
        };
    }

    /**
     * Parse HTML content and extract structured data.
     */
    private function parseHtmlContent(string $htmlContent, string $version): array
    {
        $tables = [];
        $fields = [];

        // Regex patterns for parsing Cisco UCM HTML data dictionary
        $tablePattern = '/<th class="tablename" colspan="2"><a name="([^"]+)">([^<]+)<\/a><\/th>/';
        $fieldPattern = '/<th class="fieldname" colspan="2">([^<]+)<\/th>/';
        $fieldInfoPattern = '/<td class="fieldinfo">([^<]+)<\/td><td class="fieldinfo">([^<]+)<\/td>/';
        $tableDescPattern = '/<tr><td class="tableinfo">Description:<\/td><td>([^<]*(?:<br>)?[^<]*)<\/td><\/tr>/';
        $uniquenessPattern = '/<tr><td class="tableinfo">Uniqueness:<\/td><td class="multifieldinfo">([^<]+(?:<br>)?[^<]*)<\/td><\/tr>/';

        $lines = explode("\n", $htmlContent);
        $currentTable = null;
        $currentField = null;

        Log::info("Processing {$version} data dictionary with " . count($lines) . " lines");

        foreach ($lines as $lineNumber => $line) {
            $line = trim($line);

            // Look for table definitions
            if (preg_match($tablePattern, $line, $matches)) {
                // Save previous table if exists
                if ($currentTable) {
                    $tables[] = $currentTable;
                }

                $tableName = $matches[1];
                $tableHeader = $matches[2];

                // Extract table ID from header (e.g., "2.3.1 aardialprefixmatrix (TI-182)")
                $tableId = null;
                if (preg_match('/\(TI-(\d+)\)/', $tableHeader, $idMatches)) {
                    $tableId = "TI-{$idMatches[1]}";
                }

                $currentTable = [
                    'version' => $version,
                    'name' => $tableName,
                    'table_id' => $tableId,
                    'description' => null,
                    'uniqueness_constraints' => [],
                ];

                $currentField = null;

                Log::debug("Found table: {$tableName} ({$tableId})", ['line' => $lineNumber + 1]);
            }

            // Look for field definitions
            if (preg_match($fieldPattern, $line, $matches) && $currentTable) {
                $fieldHeader = $matches[1];

                // Extract field name and ID from header (e.g., "2.3.1.1 dialprefix (FI-1117)")
                if (preg_match('/(\d+\.\d+\.\d+\.\d+)\s+([^\s]+)\s+\(FI-(\d+)\)/', $fieldHeader, $fieldMatches)) {
                    $fieldName = $fieldMatches[2];
                    $fieldId = "FI-{$fieldMatches[3]}";

                    $currentField = [
                        'version' => $version,
                        'table_name' => $currentTable['name'],
                        'name' => $fieldName,
                        'field_id' => $fieldId,
                        'data_type' => '',
                        'properties' => [],
                        'default_value' => null,
                        'migration_source' => null,
                        'remarks' => null,
                        'description' => null,
                        'rules' => [],
                    ];

                    $fields[] = $currentField;

                    Log::debug("  Found field: {$fieldName} ({$fieldId})", ['line' => $lineNumber + 1]);
                }
            }

            // Look for field information (type, default, etc.)
            if (preg_match($fieldInfoPattern, $line, $matches) && $currentField) {
                $label = trim($matches[1]);
                $value = trim($matches[2]);

                // Update the last field in the array
                $lastFieldIndex = count($fields) - 1;

                switch ($label) {
                    case 'Type:':
                        $fields[$lastFieldIndex]['data_type'] = $value;
                        // Extract properties from parentheses if present
                        if (preg_match('/\(([^)]+)\)/', $value, $propMatches)) {
                            $properties = array_map('trim', explode(',', $propMatches[1]));
                            $fields[$lastFieldIndex]['properties'] = array_filter($properties);
                        }
                        break;
                    case 'Default Value:':
                        if ($value !== 'null' && !empty($value)) {
                            $fields[$lastFieldIndex]['default_value'] = $value;
                        }
                        break;
                    case 'Migration Source:':
                        if ($value !== 'null' && !empty($value)) {
                            $fields[$lastFieldIndex]['migration_source'] = $value;
                        }
                        break;
                    case 'Remarks:':
                        if (!empty($value)) {
                            $fields[$lastFieldIndex]['remarks'] = $value;
                        }
                        break;
                }
            }

            // Look for table descriptions
            if (preg_match($tableDescPattern, $line, $matches) && $currentTable) {
                $description = trim($matches[1]);
                $cleanDescription = $this->cleanHtmlText($description);

                if (!empty($cleanDescription)) {
                    $currentTable['description'] = $cleanDescription;

                    // Update the last table in the array
                    $lastTableIndex = count($tables);
                    if ($lastTableIndex > 0) {
                        $tables[$lastTableIndex - 1]['description'] = $cleanDescription;
                    }

                    Log::debug("  Found table description for {$currentTable['name']}: {$cleanDescription}");
                }
            }

            // Look for uniqueness constraints
            if (preg_match($uniquenessPattern, $line, $matches) && $currentTable) {
                $constraint = trim($matches[1]);
                $cleanConstraint = $this->cleanHtmlText($constraint);

                if (!empty($cleanConstraint) && $cleanConstraint !== 'No multicolumn uniqueness constraints') {
                    $currentTable['uniqueness_constraints'][] = $cleanConstraint;

                    // Update the last table in the array
                    $lastTableIndex = count($tables);
                    if ($lastTableIndex > 0) {
                        $tables[$lastTableIndex - 1]['uniqueness_constraints'][] = $cleanConstraint;
                    }

                    Log::debug("  Found uniqueness constraint for {$currentTable['name']}: {$cleanConstraint}");
                }
            }
        }

        // Add the last table
        if ($currentTable) {
            $tables[] = $currentTable;
        }

        Log::info("Parsed {$version} data dictionary", [
            'tables_count' => count($tables),
            'fields_count' => count($fields),
        ]);

        return [
            'tables' => $tables,
            'fields' => $fields,
        ];
    }

    /**
     * Clean HTML text by removing tags and normalizing whitespace.
     */
    private function cleanHtmlText(string $text): string
    {
        return trim(preg_replace('/\s+/', ' ', strip_tags(str_replace(['<br>', '&nbsp;'], [' ', ' '], $text))));
    }

    /**
     * Store parsed data in the database.
     */
    public function storeData(array $data, string $version): void
    {
        Log::info("Storing data dictionary for version {$version}");

        // Clear existing data for this version
        DataDictionaryTable::where('version', $version)->delete();
        DataDictionaryField::where('version', $version)->delete();

        // Store tables
        foreach ($data['tables'] as $tableData) {
            DataDictionaryTable::create($tableData);
        }

        // Store fields
        foreach ($data['fields'] as $fieldData) {
            DataDictionaryField::create($fieldData);
        }

        Log::info("Stored data dictionary for version {$version}", [
            'tables_stored' => count($data['tables']),
            'fields_stored' => count($data['fields']),
        ]);
    }

    /**
     * Get available UCM versions that have data dictionary files.
     */
    public function getAvailableVersions(): array
    {
        $versions = ['11.5', '12.0', '12.5', '15.0'];
        $available = [];

        foreach ($versions as $version) {
            try {
                $htmlPath = $this->getHtmlPath($version);
                echo Storage::drive('ucm-data-dictionary')->path($htmlPath) . PHP_EOL;
                if (Storage::drive('ucm-data-dictionary')->path($htmlPath)) {
                    $available[] = $version;
                }
            } catch (Exception $e) {
                // Skip unavailable versions
            }
        }

        return $available;
    }
}

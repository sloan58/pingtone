<?php

namespace Database\Seeders;

use App\Models\DataDictionaryField;
use App\Models\DataDictionaryTable;
use Illuminate\Database\Seeder;

class DataDictionarySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Seeding sample data dictionary data...');

        // Clear existing data
        DataDictionaryTable::truncate();
        DataDictionaryField::truncate();

        // Sample UCM 15.0 tables
        $tables = [
            [
                'version' => '15.0',
                'name' => 'device',
                'table_id' => 'TI-1001',
                'description' => 'Contains information about all devices registered in the system including phones, gateways, and other endpoints.',
                'uniqueness_constraints' => ['name', 'pkid'],
            ],
            [
                'version' => '15.0',
                'name' => 'enduser',
                'table_id' => 'TI-1002',
                'description' => 'Stores end user information including personal details and system preferences.',
                'uniqueness_constraints' => ['userid', 'pkid'],
            ],
            [
                'version' => '15.0',
                'name' => 'devicepool',
                'table_id' => 'TI-1003',
                'description' => 'Device pool configuration that defines regional settings and call processing behavior.',
                'uniqueness_constraints' => ['name', 'pkid'],
            ],
            [
                'version' => '15.0',
                'name' => 'numplan',
                'table_id' => 'TI-1004',
                'description' => 'Directory number plan entries that define how numbers are routed and processed.',
                'uniqueness_constraints' => ['dnorpattern', 'fkroutepartition'],
            ],
        ];

        foreach ($tables as $tableData) {
            DataDictionaryTable::create($tableData);
        }

        // Sample fields for device table
        $deviceFields = [
            [
                'version' => '15.0',
                'table_name' => 'device',
                'name' => 'pkid',
                'field_id' => 'FI-1001',
                'data_type' => 'varchar(36)',
                'properties' => ['Primary Key', 'Not Null', 'Unique'],
                'remarks' => 'Primary key identifier for the device record',
            ],
            [
                'version' => '15.0',
                'table_name' => 'device',
                'name' => 'name',
                'field_id' => 'FI-1002',
                'data_type' => 'varchar(128)',
                'properties' => ['Not Null', 'Unique', 'Indexed'],
                'remarks' => 'Unique device name identifier',
            ],
            [
                'version' => '15.0',
                'table_name' => 'device',
                'name' => 'description',
                'field_id' => 'FI-1003',
                'data_type' => 'varchar(255)',
                'properties' => ['Null OK'],
                'remarks' => 'Human-readable description of the device',
            ],
            [
                'version' => '15.0',
                'table_name' => 'device',
                'name' => 'tkclass',
                'field_id' => 'FI-1004',
                'data_type' => 'integer',
                'properties' => ['Not Null', 'Indexed'],
                'default_value' => '1',
                'remarks' => 'Device class type (1=Phone, 2=Gateway, etc.)',
                'rules' => [
                    [
                        'rule_id' => 'R-1001',
                        'rule_type' => 'Check Constraint',
                        'rule_name' => 'Valid Device Class',
                        'description' => 'Ensures tkclass is within valid range',
                        'test_condition' => 'tkclass >= 1 AND tkclass <= 10',
                    ],
                ],
            ],
            [
                'version' => '15.0',
                'table_name' => 'device',
                'name' => 'fkdevicepool',
                'field_id' => 'FI-1005',
                'data_type' => 'varchar(36)',
                'properties' => ['Foreign Key', 'Indexed'],
                'remarks' => 'Foreign key reference to devicepool table',
            ],
        ];

        foreach ($deviceFields as $fieldData) {
            DataDictionaryField::create($fieldData);
        }

        // Sample fields for enduser table
        $enduserFields = [
            [
                'version' => '15.0',
                'table_name' => 'enduser',
                'name' => 'pkid',
                'field_id' => 'FI-2001',
                'data_type' => 'varchar(36)',
                'properties' => ['Primary Key', 'Not Null', 'Unique'],
                'remarks' => 'Primary key identifier for the end user record',
            ],
            [
                'version' => '15.0',
                'table_name' => 'enduser',
                'name' => 'userid',
                'field_id' => 'FI-2002',
                'data_type' => 'varchar(128)',
                'properties' => ['Not Null', 'Unique', 'Indexed'],
                'remarks' => 'Unique user identifier/login name',
            ],
            [
                'version' => '15.0',
                'table_name' => 'enduser',
                'name' => 'firstname',
                'field_id' => 'FI-2003',
                'data_type' => 'varchar(128)',
                'properties' => ['Null OK'],
                'remarks' => 'User first name',
            ],
            [
                'version' => '15.0',
                'table_name' => 'enduser',
                'name' => 'lastname',
                'field_id' => 'FI-2004',
                'data_type' => 'varchar(128)',
                'properties' => ['Null OK'],
                'remarks' => 'User last name',
            ],
            [
                'version' => '15.0',
                'table_name' => 'enduser',
                'name' => 'department',
                'field_id' => 'FI-2005',
                'data_type' => 'varchar(255)',
                'properties' => ['Null OK', 'Indexed'],
                'remarks' => 'Department or organizational unit',
            ],
        ];

        foreach ($enduserFields as $fieldData) {
            DataDictionaryField::create($fieldData);
        }

        // Sample fields for devicepool table
        $devicepoolFields = [
            [
                'version' => '15.0',
                'table_name' => 'devicepool',
                'name' => 'pkid',
                'field_id' => 'FI-3001',
                'data_type' => 'varchar(36)',
                'properties' => ['Primary Key', 'Not Null', 'Unique'],
                'remarks' => 'Primary key identifier for the device pool record',
            ],
            [
                'version' => '15.0',
                'table_name' => 'devicepool',
                'name' => 'name',
                'field_id' => 'FI-3002',
                'data_type' => 'varchar(128)',
                'properties' => ['Not Null', 'Unique', 'Indexed'],
                'remarks' => 'Unique device pool name',
            ],
            [
                'version' => '15.0',
                'table_name' => 'devicepool',
                'name' => 'dateformat',
                'field_id' => 'FI-3003',
                'data_type' => 'integer',
                'properties' => ['Not Null'],
                'default_value' => '1',
                'remarks' => 'Date format preference (1=MM/DD/YYYY, 2=DD/MM/YYYY, etc.)',
            ],
            [
                'version' => '15.0',
                'table_name' => 'devicepool',
                'name' => 'timeformat',
                'field_id' => 'FI-3004',
                'data_type' => 'integer',
                'properties' => ['Not Null'],
                'default_value' => '1',
                'remarks' => 'Time format preference (1=12-hour, 2=24-hour)',
            ],
        ];

        foreach ($devicepoolFields as $fieldData) {
            DataDictionaryField::create($fieldData);
        }

        $this->command->info('✅ Sample data dictionary data seeded successfully!');
        $this->command->info('   - 4 tables created');
        $this->command->info('   - ' . (count($deviceFields) + count($enduserFields) + count($devicepoolFields)) . ' fields created');
    }
}
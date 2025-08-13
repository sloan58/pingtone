<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use MongoDB\Laravel\Connection;

return new class extends Migration
{
    public function up(): void
    {
        // Get the MongoDB connection using the default connection
        $connection = \DB::connection();
        
        // Create the index for nested line UUIDs to support shared line detection
        $connection->getCollection('devices')->createIndex(
            ['lines.line.dirn.uuid' => 1],
            ['name' => 'lines_line_dirn_uuid_idx', 'background' => true]
        );
    }

    public function down(): void
    {
        // Get the MongoDB connection using the default connection
        $connection = \DB::connection();
        
        // Drop the index
        $connection->getCollection('devices')->dropIndex('lines_line_dirn_uuid_idx');
    }
};

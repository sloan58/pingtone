<?php

namespace Database\Seeders;

use App\Models\UcmNode;
use App\Models\UcmCluster;
use Illuminate\Database\Seeder;

class UcmSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a test cluster
        $cluster = UcmCluster::create([
            'name' => 'Test Cluster',
        ]);

        // Create a test UCM node
        UcmNode::create([
            'ucm_cluster_id' => $cluster->id,
            'name' => 'Karmatek',
            'hostname' => '192.168.1.10',
            'username' => 'pingtone',
            'password' => 'password',
            'is_active' => true,
            'schema_version' => '15.0',
            'cluster_name' => 'Test Cluster',
            'node_role' => 'Publisher',
        ]);
    }
}

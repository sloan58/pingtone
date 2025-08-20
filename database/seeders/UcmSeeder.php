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
            "name" => "Karmatek",
            "username" => "pingtone",
            "password" => "password",
            "schema_version" => "15.0",
        ]);

        // Create a test UCM node
        UcmNode::create([
            "ucm_cluster_id" => $cluster->getKey(),
            "name" => "ucm-pub.karmatek.io",
            "hostname" => "192.168.1.10",
            "version" => "15.0.1.10000(32)",
            "node_role" => "Publisher",
        ]);
    }
}

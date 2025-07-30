<?php

namespace Database\Seeders;

use App\Models\Ucm;
use Illuminate\Database\Seeder;

class UcmSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Ucm::create([
            'name' => 'Production UCM',
            'hostname' => 'cucm.company.com',
            'username' => 'administrator',
            'password' => 'password123',
            'schema_version' => '15.0',
            'version' => '15.0.1.1000-1',
        ]);

        Ucm::create([
            'name' => 'Test UCM',
            'hostname' => 'test-cucm.company.com',
            'username' => 'admin',
            'password' => 'testpass123',
            'schema_version' => '14.0',
            'version' => '14.0.2.1000-1',
        ]);

        Ucm::create([
            'name' => 'Development UCM',
            'hostname' => 'dev-cucm.company.com',
            'username' => 'devadmin',
            'password' => 'devpass123',
            'schema_version' => '12.5',
            'version' => '12.5.1.11900-1',
        ]);
    }
} 
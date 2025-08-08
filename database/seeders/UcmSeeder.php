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
            'name' => 'Karmatek',
            'hostname' => '192.168.1.10',
            'username' => 'pingtone',
            'password' => 'password',
            'is_active' => true,
            'schema_version' => '15.0'
        ]);
    }
} 
<?php

namespace Database\Seeders;

use App\Models\Ucm;
use App\Models\User;
use Illuminate\Database\Seeder;

class DashboardSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample UCM server
        $ucm1 = Ucm::create([
            'name' => 'Karmatek',
            'hostname' => '192.168.1.10',
            'username' => 'pingtone',
            'password' => 'password',
            'is_active' => true,
        ]);

        // Create sample user
        User::create([
            'name' => 'Admin',
            'email' => 'admin@pingtone.com',
            'password' => bcrypt('password'),
        ]);
    }
}

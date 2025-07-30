<?php

namespace Database\Seeders;

use App\Models\Ucm;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
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

        // Create sample user
        User::updateOrCreate(['email' => 'admin@pingtone.com'], [
            'name' => 'Admin',
            'password' => bcrypt('password'),
        ]);

        $this->call([
            UcmSeeder::class,
            SyncHistorySeeder::class,
        ]);
    }
}

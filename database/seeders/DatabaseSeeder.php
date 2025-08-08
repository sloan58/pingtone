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
        // Create sample user
        User::updateOrCreate(['email' => 'admin@pingtone.com'], [
            'name' => 'Admin',
            'password' => bcrypt('password'),
        ]);

        $this->call([
            UcmSeeder::class,
            // SyncHistorySeeder::class,
        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\ServiceArea;
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

        ServiceArea::updateOrCreate(
            ['name' => 'Headquarters'],
            ['userFilter' => [
                'field' => 'mailid',
                'regex' => '.*@karmatek\.io',
            ]]
        );

        $this->call([
//            UcmSeeder::class,
            // SyncHistorySeeder::class,
        ]);
    }
}

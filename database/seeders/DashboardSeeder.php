<?php

namespace Database\Seeders;

use App\Models\Ucm;
use App\Models\Phone;
use App\Models\Line;
use App\Models\User;
use Illuminate\Database\Seeder;

class DashboardSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample UCM servers
        $ucm1 = Ucm::create([
            'name' => 'UCM-Primary',
            'hostname' => 'ucm-primary.company.com',
            'username' => 'admin',
            'password' => 'password',
            'version' => '14.0.1.11900-26',
            'is_active' => true,
        ]);

        $ucm2 = Ucm::create([
            'name' => 'UCM-Secondary',
            'hostname' => 'ucm-secondary.company.com',
            'username' => 'admin',
            'password' => 'password',
            'version' => '14.0.1.11900-26',
            'is_active' => false,
        ]);

        // Create sample phones
        $phoneModels = ['Cisco 8841', 'Cisco 8851', 'Cisco 8861', 'Cisco 8865', 'Cisco 8845'];
        
        for ($i = 1; $i <= 25; $i++) {
            $model = $phoneModels[array_rand($phoneModels)];
            $status = rand(1, 10) <= 8 ? 'Registered' : 'Unregistered';
            
            Phone::create([
                'pkid' => 'SEP' . str_pad($i, 12, '0', STR_PAD_LEFT),
                'name' => "Phone-{$i}",
                'description' => "Phone {$i} - {$model}",
                'model' => $model,
                'protocol' => rand(1, 2) == 1 ? 'SIP' : 'SCCP',
                'status' => $status,
                'ucm_id' => $ucm1->id,
            ]);
        }

        // Create sample lines
        for ($i = 1001; $i <= 1050; $i++) {
            Line::create([
                'pkid' => "Line-{$i}",
                'pattern' => $i,
                'description' => "Line {$i}",
                'route_partition_name' => 'Default',
                'ucm_id' => $ucm1->id,
            ]);
        }

        // Create sample users
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@company.com',
            'password' => bcrypt('password'),
        ]);

        User::create([
            'name' => 'John Doe',
            'email' => 'john@company.com',
            'password' => bcrypt('password'),
        ]);

        User::create([
            'name' => 'Jane Smith',
            'email' => 'jane@company.com',
            'password' => bcrypt('password'),
        ]);
    }
} 
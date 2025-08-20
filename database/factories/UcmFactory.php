<?php

namespace Database\Factories;

use App\Models\UcmNode;
use App\Models\UcmCluster;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<UcmNode>
 */
class UcmFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ucm_cluster_id' => UcmCluster::factory(),
            'name' => $this->faker->company() . ' UCM',
            'hostname' => $this->faker->domainName(),
            'username' => $this->faker->userName(),
            'password' => $this->faker->password(),
            'schema_version' => '12.5',
            'version' => '12.5.1.11900-26',
            'cluster_name' => $this->faker->company() . ' Cluster',
            'node_role' => $this->faker->randomElement(['Publisher', 'Subscriber']),
            'last_sync_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }
}

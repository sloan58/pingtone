<?php

namespace Database\Factories;

use App\Models\Ucm;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ucm>
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
            'name' => $this->faker->company() . ' UCM',
            'hostname' => $this->faker->domainName(),
            'username' => $this->faker->userName(),
            'password' => $this->faker->password(),
            'schema_version' => '12.5',
            'version' => '12.5.1.11900-26',
            'last_sync_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }
}

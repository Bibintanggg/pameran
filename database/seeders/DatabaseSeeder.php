<?php

namespace Database\Seeders;

use App\Models\Cards;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();
        User::factory()->create([
            'name' => 'Test User',
            'phone_number' => "082313132",
            'email' => 'test@example.com',
        ]);

        Cards::create([
            'user_id' => 1,
            'name' => 'IDR Card',
            'currency' => 'indonesian_rupiah',
            'card_number' => null,
            'balance' => 0,
        ]);
    }
}

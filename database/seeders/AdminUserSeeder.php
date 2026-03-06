<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Use firstOrCreate to prevent duplicates
        User::firstOrCreate(
            ['email' => 'mabdullah.navicosoft@gmail.com'],
            [
                'name' => 'Abdullah Rasheed',
                'password' => 'password123', // Will be hashed by model cast
                'email_verified_at' => now(),
            ]
        );
    }
}

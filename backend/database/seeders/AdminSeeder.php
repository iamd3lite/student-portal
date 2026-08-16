<?php

namespace Database\Seeders;

use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        Admin::updateOrCreate(
            ['admin_id' => env('ADMIN_ADMIN_ID', 'ADM-2025-001')],
            [
                'name' => env('ADMIN_NAME', 'System Administrator'),
                'email' => env('ADMIN_EMAIL', 'admin@fu.edu.ng'),
                'password' => Hash::make(env('ADMIN_PASSWORD', 'ChangeMe!2025')),
            ],
        );
    }
}

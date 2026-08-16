<?php

namespace Database\Seeders;

use App\Models\Semester;
use Illuminate\Database\Seeder;

class SemesterSeeder extends Seeder
{
    public function run(): void
    {
        $session = '2025/2026';

        Semester::updateOrCreate(
            ['session' => $session, 'term' => 1],
            ['name' => 'First Semester', 'is_current' => true, 'registration_open' => true],
        );

        Semester::updateOrCreate(
            ['session' => $session, 'term' => 2],
            ['name' => 'Second Semester', 'is_current' => false, 'registration_open' => true],
        );
    }
}

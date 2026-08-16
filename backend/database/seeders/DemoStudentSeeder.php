<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DemoStudentSeeder extends Seeder
{
    public function run(): void
    {
        $csc = Department::where('code', 'CSC')->first();
        if (! $csc) {
            return;
        }

        Student::updateOrCreate(
            ['matric_number' => 'CSC/2022/0147'],
            [
                'first_name' => 'Adaeze',
                'last_name' => 'Okafor',
                'email' => 'adaeze.okafor@student.fu.edu.ng',
                'phone' => '+234 803 547 2916',
                'department_id' => $csc->id,
                'level' => 300,
                'password' => Hash::make('password123'),
            ],
        );
    }
}

<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['code' => 'CSC', 'name' => 'Computer Science', 'programme' => 'B.Sc. Computer Science', 'faculty' => 'Computing and Information Technology'],
            ['code' => 'EEE', 'name' => 'Electrical Engineering', 'programme' => 'B.Eng. Electrical Engineering', 'faculty' => 'Engineering'],
            ['code' => 'MEE', 'name' => 'Mechanical Engineering', 'programme' => 'B.Eng. Mechanical Engineering', 'faculty' => 'Engineering'],
            ['code' => 'MAC', 'name' => 'Mass Communication', 'programme' => 'B.Sc. Mass Communication', 'faculty' => 'Arts and Social Sciences'],
            ['code' => 'ACC', 'name' => 'Accounting', 'programme' => 'B.Sc. Accounting', 'faculty' => 'Management Sciences'],
            ['code' => 'ECO', 'name' => 'Economics', 'programme' => 'B.Sc. Economics', 'faculty' => 'Management Sciences'],
            ['code' => 'LAW', 'name' => 'Law', 'programme' => 'LL.B. Law', 'faculty' => 'Law'],
            ['code' => 'MCB', 'name' => 'Microbiology', 'programme' => 'B.Sc. Microbiology', 'faculty' => 'Science'],
            ['code' => 'BCH', 'name' => 'Biochemistry', 'programme' => 'B.Sc. Biochemistry', 'faculty' => 'Science'],
            ['code' => 'MED', 'name' => 'Medicine & Surgery', 'programme' => 'MBBS Medicine & Surgery', 'faculty' => 'Clinical Sciences'],
        ];

        foreach ($departments as $dept) {
            Department::updateOrCreate(['code' => $dept['code']], $dept);
        }
    }
}

<?php

namespace Tests\Feature;

use App\Models\Course;
use App\Models\CourseRegistration;
use App\Models\Department;
use App\Models\Semester;
use App\Models\Student;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CourseRegistrationTest extends TestCase
{
    use RefreshDatabase;

    private function makeStudent(Department $dept, int $level = 300): Student
    {
        return Student::create([
            'first_name' => 'Test',
            'last_name' => 'Student',
            'matric_number' => 'CSC/2022/'.rand(1000, 9999),
            'email' => 'test'.rand(1000, 9999).'@student.fu.edu.ng',
            'department_id' => $dept->id,
            'level' => $level,
            'password' => Hash::make('password123'),
        ]);
    }

    private function seedContext(): array
    {
        $sem = Semester::create(['session' => '2025/2026', 'term' => 1, 'name' => 'First Semester', 'is_current' => true, 'registration_open' => true]);
        $csc = Department::create(['code' => 'CSC', 'name' => 'Computer Science', 'programme' => 'B.Sc. Computer Science', 'faculty' => 'CIT']);
        $eee = Department::create(['code' => 'EEE', 'name' => 'Electrical Engineering', 'programme' => 'B.Eng. EEE', 'faculty' => 'Engineering']);

        $ownCourse = Course::create(['code' => 'CSC 301', 'title' => 'DSA', 'unit' => 3, 'department_id' => $csc->id, 'semester_id' => $sem->id, 'level' => 300, 'capacity' => 2]);
        $otherCourse = Course::create(['code' => 'EEE 301', 'title' => 'Circuits', 'unit' => 3, 'department_id' => $eee->id, 'semester_id' => $sem->id, 'level' => 300, 'capacity' => 50]);

        return compact('sem', 'csc', 'eee', 'ownCourse', 'otherCourse');
    }

    public function test_student_can_register_their_own_course(): void
    {
        ['csc' => $csc, 'ownCourse' => $ownCourse] = $this->seedContext();
        $student = $this->makeStudent($csc);
        Sanctum::actingAs($student, ['student']);

        $response = $this->postJson('/api/registrations', ['course_ids' => [$ownCourse->id]]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('course_registrations', [
            'student_id' => $student->id,
            'course_id' => $ownCourse->id,
            'status' => 'pending',
        ]);
    }

    public function test_student_cannot_register_a_course_outside_their_department(): void
    {
        ['csc' => $csc, 'otherCourse' => $otherCourse] = $this->seedContext();
        $student = $this->makeStudent($csc);
        Sanctum::actingAs($student, ['student']);

        $response = $this->postJson('/api/registrations', ['course_ids' => [$otherCourse->id]]);

        $response->assertStatus(422);
        $this->assertDatabaseCount('course_registrations', 0);
    }

    public function test_student_cannot_register_the_same_course_twice(): void
    {
        ['csc' => $csc, 'ownCourse' => $ownCourse] = $this->seedContext();
        $student = $this->makeStudent($csc);
        Sanctum::actingAs($student, ['student']);

        $this->postJson('/api/registrations', ['course_ids' => [$ownCourse->id]])->assertStatus(201);
        $this->postJson('/api/registrations', ['course_ids' => [$ownCourse->id]])->assertStatus(422);

        $this->assertDatabaseCount('course_registrations', 1);
    }

    public function test_course_capacity_is_enforced(): void
    {
        ['csc' => $csc, 'ownCourse' => $ownCourse] = $this->seedContext();

        // capacity is 2; fill it with two other students
        foreach (range(1, 2) as $i) {
            $filler = $this->makeStudent($csc);
            CourseRegistration::create([
                'student_id' => $filler->id,
                'course_id' => $ownCourse->id,
                'semester_id' => $ownCourse->semester_id,
                'status' => 'pending',
                'submitted_at' => now(),
            ]);
        }

        $student = $this->makeStudent($csc);
        Sanctum::actingAs($student, ['student']);

        $response = $this->postJson('/api/registrations', ['course_ids' => [$ownCourse->id]]);

        $response->assertStatus(422);
    }

    public function test_student_can_only_see_their_own_registrations(): void
    {
        ['csc' => $csc, 'ownCourse' => $ownCourse] = $this->seedContext();

        $other = $this->makeStudent($csc);
        CourseRegistration::create([
            'student_id' => $other->id,
            'course_id' => $ownCourse->id,
            'semester_id' => $ownCourse->semester_id,
            'status' => 'pending',
            'submitted_at' => now(),
        ]);

        $student = $this->makeStudent($csc);
        Sanctum::actingAs($student, ['student']);

        $response = $this->getJson('/api/registrations');

        $response->assertOk();
        $response->assertJsonPath('summary.total_courses', 0);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /**
     * List the courses available to the authenticated student:
     * scoped to their own department + level. Optionally filter by semester.
     *
     * Each course includes live capacity information.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $query = Course::query()
            ->with('semester')
            ->withCount('registrations')
            ->where('department_id', $student->department_id)
            ->where('level', $student->level);

        if ($request->filled('semester_id')) {
            $query->where('semester_id', $request->integer('semester_id'));
        }

        $courses = $query->orderBy('semester_id')->orderBy('code')->get()
            ->map(function (Course $course) {
                return [
                    'id' => $course->id,
                    'code' => $course->code,
                    'title' => $course->title,
                    'unit' => $course->unit,
                    'level' => $course->level,
                    'prerequisite' => $course->prerequisite,
                    'semester_id' => $course->semester_id,
                    'semester' => $course->semester?->name,
                    'term' => $course->semester?->term,
                    'capacity' => $course->capacity,
                    'registered' => $course->registrations_count,
                    'remaining' => max(0, $course->capacity - $course->registrations_count),
                    'is_full' => $course->registrations_count >= $course->capacity,
                ];
            });

        return response()->json(['courses' => $courses]);
    }

    public function show(Course $course): JsonResponse
    {
        $course->loadCount('registrations')->load('semester', 'department');

        return response()->json([
            'course' => $course,
            'remaining' => max(0, $course->capacity - $course->registrations_count),
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCourseRegistrationRequest;
use App\Models\Course;
use App\Models\CourseRegistration;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CourseRegistrationController extends Controller
{
    /**
     * Maximum number of courses a student may register per semester.
     */
    private const MAX_PER_SEMESTER = 7;

    /**
     * List the authenticated student's own registrations.
     * A student can ONLY ever see their own records.
     */
    public function index(Request $request): JsonResponse
    {
        $student = $request->user();

        $registrations = CourseRegistration::with(['course.semester', 'reviewer'])
            ->forStudent($student->id)
            ->get()
            ->map(fn (CourseRegistration $r) => $this->transform($r));

        return response()->json([
            'registrations' => $registrations,
            'summary' => $this->summary($student->id),
        ]);
    }

    /**
     * Register one or more courses for the authenticated student.
     *
     * Enforces:
     *  - Own courses only (student's department + level).
     *  - No duplicate registrations (DB unique + explicit check).
     *  - Per-semester course cap (max 7).
     *  - Course capacity (seat availability), guarded with row locks.
     */
    public function store(StoreCourseRegistrationRequest $request): JsonResponse
    {
        $student = $request->user();
        $courseIds = $request->validated()['course_ids'];

        $semester = Semester::current();
        if (! $semester || ! $semester->registration_open) {
            throw ValidationException::withMessages([
                'course_ids' => ['Course registration is not open at the moment.'],
            ]);
        }

        $created = DB::transaction(function () use ($student, $courseIds, $semester) {
            // Lock the selected course rows to prevent capacity race conditions.
            $courses = Course::whereIn('id', $courseIds)
                ->lockForUpdate()
                ->get();

            // Rule 1: every selected course must belong to the student's
            // own department AND level. Otherwise reject the whole request.
            foreach ($courses as $course) {
                if ($course->department_id !== $student->department_id || $course->level !== $student->level) {
                    throw ValidationException::withMessages([
                        'course_ids' => ["You can only register courses for your own department and level ({$course->code} is not yours)."],
                    ]);
                }
            }

            // Group by semester to enforce the per-semester cap.
            $existing = CourseRegistration::forStudent($student->id)->get();
            $countsBySemester = $existing->groupBy('semester_id')->map->count();

            $newBySemester = $courses->groupBy('semester_id')->map->count();

            foreach ($newBySemester as $semesterId => $addCount) {
                $current = (int) ($countsBySemester[$semesterId] ?? 0);
                if ($current + $addCount > self::MAX_PER_SEMESTER) {
                    throw ValidationException::withMessages([
                        'course_ids' => ['You can register a maximum of '.self::MAX_PER_SEMESTER.' courses per semester.'],
                    ]);
                }
            }

            $results = [];

            foreach ($courses as $course) {
                // Rule 2: prevent duplicate registration.
                $already = CourseRegistration::where('student_id', $student->id)
                    ->where('course_id', $course->id)
                    ->exists();

                if ($already) {
                    throw ValidationException::withMessages([
                        'course_ids' => ["You have already registered {$course->code}."],
                    ]);
                }

                // Rule 3: enforce course capacity.
                $registeredCount = CourseRegistration::where('course_id', $course->id)->count();
                if ($registeredCount >= $course->capacity) {
                    throw ValidationException::withMessages([
                        'course_ids' => ["{$course->code} is full (no seats remaining)."],
                    ]);
                }

                $results[] = CourseRegistration::create([
                    'student_id' => $student->id,
                    'course_id' => $course->id,
                    'semester_id' => $course->semester_id,
                    'status' => CourseRegistration::STATUS_PENDING,
                    'submitted_at' => now(),
                ]);
            }

            return $results;
        });

        return response()->json([
            'message' => count($created).' course(s) registered and submitted for validation.',
            'summary' => $this->summary($student->id),
        ], 201);
    }

    /**
     * Drop one of the student's own registrations (only while still pending).
     */
    public function destroy(Request $request, CourseRegistration $registration): JsonResponse
    {
        $student = $request->user();

        // Ownership guard: a student can only drop their own registration.
        if ($registration->student_id !== $student->id) {
            return response()->json(['message' => 'You can only modify your own registrations.'], 403);
        }

        if ($registration->status === CourseRegistration::STATUS_APPROVED) {
            throw ValidationException::withMessages([
                'registration' => ['Approved courses cannot be dropped. Contact your course adviser.'],
            ]);
        }

        $registration->delete();

        return response()->json([
            'message' => 'Course dropped.',
            'summary' => $this->summary($student->id),
        ]);
    }

    private function transform(CourseRegistration $r): array
    {
        return [
            'id' => $r->id,
            'course_id' => $r->course_id,
            'code' => $r->course?->code,
            'title' => $r->course?->title,
            'unit' => $r->course?->unit,
            'semester' => $r->course?->semester?->name,
            'term' => $r->course?->semester?->term,
            'status' => $r->status,
            'note' => $r->note,
            'reviewed_by' => $r->reviewer?->name,
            'submitted_at' => $r->submitted_at,
            'reviewed_at' => $r->reviewed_at,
        ];
    }

    private function summary(int $studentId): array
    {
        $rows = CourseRegistration::with('course')->forStudent($studentId)->get();

        return [
            'total_courses' => $rows->count(),
            'total_units' => $rows->sum(fn ($r) => $r->course?->unit ?? 0),
            'pending' => $rows->where('status', CourseRegistration::STATUS_PENDING)->count(),
            'approved' => $rows->where('status', CourseRegistration::STATUS_APPROVED)->count(),
            'rejected' => $rows->where('status', CourseRegistration::STATUS_REJECTED)->count(),
        ];
    }
}

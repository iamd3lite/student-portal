<?php

namespace App\Http\Controllers;

use App\Models\CourseRegistration;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminRegistrationController extends Controller
{
    /**
     * List every student's submitted course form, grouped per student,
     * so an administrator can review and validate them.
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status'); // optional filter

        $students = Student::with(['department', 'registrations.course.semester', 'registrations.reviewer'])
            ->whereHas('registrations', function ($q) use ($status) {
                if ($status) {
                    $q->where('status', $status);
                }
            })
            ->get()
            ->map(function (Student $student) {
                $regs = $student->registrations;

                return [
                    'student_id' => $student->id,
                    'full_name' => $student->full_name,
                    'matric_number' => $student->matric_number,
                    'department' => $student->department?->name,
                    'programme' => $student->department?->programme,
                    'level' => $student->level,
                    'total_courses' => $regs->count(),
                    'total_units' => $regs->sum(fn ($r) => $r->course?->unit ?? 0),
                    'status' => $this->overallStatus($regs),
                    'courses' => $regs->map(fn ($r) => [
                        'registration_id' => $r->id,
                        'code' => $r->course?->code,
                        'title' => $r->course?->title,
                        'unit' => $r->course?->unit,
                        'semester' => $r->course?->semester?->name,
                        'status' => $r->status,
                    ])->values(),
                    'note' => optional($regs->firstWhere('note', '!=', null))->note,
                    'submitted_at' => optional($regs->max('submitted_at')),
                ];
            })
            ->values();

        return response()->json([
            'submissions' => $students,
            'stats' => [
                'total' => $students->count(),
                'pending' => $students->where('status', 'pending')->count(),
                'approved' => $students->where('status', 'approved')->count(),
                'rejected' => $students->where('status', 'rejected')->count(),
            ],
        ]);
    }

    /**
     * Approve every registration in a student's submitted form.
     */
    public function approve(Request $request, Student $student): JsonResponse
    {
        $admin = $request->user();

        DB::transaction(function () use ($student, $admin) {
            CourseRegistration::forStudent($student->id)->update([
                'status' => CourseRegistration::STATUS_APPROVED,
                'note' => null,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);
        });

        return response()->json(['message' => "Approved {$student->full_name}'s course form."]);
    }

    /**
     * Reject a student's submitted form, with an optional note.
     */
    public function reject(Request $request, Student $student): JsonResponse
    {
        $admin = $request->user();
        $validated = $request->validate([
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($student, $admin, $validated) {
            CourseRegistration::forStudent($student->id)->update([
                'status' => CourseRegistration::STATUS_REJECTED,
                'note' => $validated['note'] ?? null,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);
        });

        return response()->json(['message' => "Rejected {$student->full_name}'s course form."]);
    }

    /**
     * Derive one overall status from a set of registration rows.
     */
    private function overallStatus($regs): string
    {
        if ($regs->contains('status', CourseRegistration::STATUS_REJECTED)) {
            return 'rejected';
        }
        if ($regs->every(fn ($r) => $r->status === CourseRegistration::STATUS_APPROVED)) {
            return 'approved';
        }

        return 'pending';
    }
}

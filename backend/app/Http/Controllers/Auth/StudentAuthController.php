<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentLoginRequest;
use App\Http\Requests\StudentRegisterRequest;
use App\Models\Student;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StudentAuthController extends Controller
{
    /**
     * Register a new student account and issue an API token.
     */
    public function register(StudentRegisterRequest $request): JsonResponse
    {
        $data = $request->validated();

        $student = Student::create($data);
        $student->load('department');

        $token = $student->createToken('student-'.$student->matric_number, ['student'])->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully.',
            'student' => $student,
            'token' => $token,
        ], 201);
    }

    /**
     * Log a student in via matric number + password.
     */
    public function login(StudentLoginRequest $request): JsonResponse
    {
        $data = $request->validated();

        $student = Student::where('matric_number', $data['matric_number'])->first();

        if (! $student || ! Hash::check($data['password'], $student->password)) {
            throw ValidationException::withMessages([
                'matric_number' => ['The matric number or password is incorrect.'],
            ]);
        }

        $student->load('department');

        $token = $student->createToken('student-'.$student->matric_number, ['student'])->plainTextToken;

        return response()->json([
            'message' => 'Signed in successfully.',
            'student' => $student,
            'token' => $token,
        ]);
    }

    /**
     * Return the currently authenticated student.
     */
    public function me(Request $request): JsonResponse
    {
        $student = $request->user()->load('department');

        return response()->json(['student' => $student]);
    }

    /**
     * Revoke the current access token (logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Signed out successfully.']);
    }
}

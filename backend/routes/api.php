<?php

use App\Http\Controllers\AdminRegistrationController;
use App\Http\Controllers\Auth\AdminAuthController;
use App\Http\Controllers\Auth\StudentAuthController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\CourseRegistrationController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\SemesterController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| All routes are prefixed with /api (configured in bootstrap/app.php).
*/

// ---- Public reference data (needed by the registration form) ----
Route::get('/departments', [DepartmentController::class, 'index']);
Route::get('/departments/{department}', [DepartmentController::class, 'show']);
Route::get('/semesters', [SemesterController::class, 'index']);
Route::get('/semesters/current', [SemesterController::class, 'current']);

// ---- Student authentication ----
Route::prefix('auth/student')->group(function () {
    Route::post('/register', [StudentAuthController::class, 'register']);
    Route::post('/login', [StudentAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'student'])->group(function () {
        Route::get('/me', [StudentAuthController::class, 'me']);
        Route::post('/logout', [StudentAuthController::class, 'logout']);
    });
});

// ---- Admin authentication ----
Route::prefix('auth/admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('/me', [AdminAuthController::class, 'me']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
    });
});

// ---- Student-only area ----
Route::middleware(['auth:sanctum', 'student'])->group(function () {
    // Courses available to this student (own department + level).
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/{course}', [CourseController::class, 'show']);

    // The student's own registrations.
    Route::get('/registrations', [CourseRegistrationController::class, 'index']);
    Route::post('/registrations', [CourseRegistrationController::class, 'store']);
    Route::delete('/registrations/{registration}', [CourseRegistrationController::class, 'destroy']);
});

// ---- Admin-only area ----
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/submissions', [AdminRegistrationController::class, 'index']);
    Route::post('/submissions/{student}/approve', [AdminRegistrationController::class, 'approve']);
    Route::post('/submissions/{student}/reject', [AdminRegistrationController::class, 'reject']);
});

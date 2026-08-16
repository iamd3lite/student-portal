<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    /**
     * List all departments (used to populate the registration dropdown).
     */
    public function index(): JsonResponse
    {
        $departments = Department::orderBy('name')->get();

        return response()->json(['departments' => $departments]);
    }

    public function show(Department $department): JsonResponse
    {
        return response()->json(['department' => $department]);
    }
}

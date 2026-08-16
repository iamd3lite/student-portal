<?php

namespace App\Http\Controllers;

use App\Models\Semester;
use Illuminate\Http\JsonResponse;

class SemesterController extends Controller
{
    public function index(): JsonResponse
    {
        $semesters = Semester::orderBy('session')->orderBy('term')->get();

        return response()->json(['semesters' => $semesters]);
    }

    /**
     * The active registration window.
     */
    public function current(): JsonResponse
    {
        return response()->json(['semester' => Semester::current()]);
    }
}
